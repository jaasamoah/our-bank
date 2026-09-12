from datetime import datetime, timedelta, timezone
from hashlib import sha256
import os
import secrets
from typing import Annotated, Any, Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request, Response, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import get_db
from .models import RefreshToken, User

load_dotenv()

_raw_secret = os.getenv("SESSION_SECRET") or os.getenv("SECRET_KEY")
if not _raw_secret or len(_raw_secret) < 32:
  raise RuntimeError(
      "SESSION_SECRET must be configured with at least 32 characters"
  )

SECRET_KEY: str = _raw_secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7
ACCESS_COOKIE = "access_token"
ADMIN_ACCESS_COOKIE = "admin_access_token"
REFRESH_COOKIE = "refresh_token"
ADMIN_REFRESH_COOKIE = "admin_refresh_token"
CSRF_COOKIE = "csrf_token"

pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
  return bool(pwd_context.verify(plain_password, hashed_password))


def get_password_hash(password: str) -> str:
  return str(pwd_context.hash(password))


def create_access_token(
    data: dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
  to_encode = data.copy()
  now = datetime.now(timezone.utc)
  expire = now + (
      expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  )
  to_encode.update({
      "exp": expire,
      "iat": now,
      "jti": secrets.token_hex(16),
      "type": "access",
  })
  return str(jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM))


def hash_refresh_token(token: str) -> str:
  return sha256(token.encode("utf-8")).hexdigest()


def create_refresh_token(db: Session, user: User) -> str:
  raw_token = secrets.token_urlsafe(48)
  db.add(
      RefreshToken(
          user_id=user.id,
          token_hash=hash_refresh_token(raw_token),
          expires_at=datetime.now(timezone.utc)
          + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
      )
  )
  return raw_token


def set_auth_cookies(
    response: Response, access_token: str, refresh_token: Any, admin: bool = False
) -> None:
  app_env = os.getenv("APP_ENV", "").lower()
  # Default to secure cross-origin settings unless explicitly disabled in local dev
  is_local = app_env in {"dev", "development", "local"}
  is_secure = (
      os.getenv("COOKIE_SECURE", "false" if is_local else "true").lower()
      == "true"
  )

  token_str = getattr(refresh_token, "token", refresh_token)
  prefix = "admin_" if admin else ""

  # Cross-origin (Vercel -> Render) mandates samesite="none" and secure=True
  samesite_val = "none" if is_secure else "lax"

  response.set_cookie(
      key=f"{prefix}access_token",
      value=access_token,
      httponly=True,
      secure=is_secure,
      samesite=samesite_val,
      max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
      path="/",
  )
  response.set_cookie(
      key=f"{prefix}refresh_token",
      value=str(token_str),
      httponly=True,
      secure=is_secure,
      samesite=samesite_val,
      max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
      path="/",
  )


def get_current_user(
    request: Request, db: Annotated[Session, Depends(get_db)]
) -> User:
  credentials_exception = HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Could not validate credentials",
      headers={"WWW-Authenticate": "Bearer"},
  )

  token: Optional[str] = None

  # 1. Primary check: Authorization: Bearer <token> header (Crucial for iOS Safari)
  auth_header = request.headers.get("Authorization")
  if auth_header and auth_header.startswith("Bearer "):
    token = auth_header.split(" ", 1)[1].strip()

  # 2. Secondary check: Cookies fallback
  if not token:
    is_admin_path = request.url.path.startswith("/api/admin")
    preferred_cookie = ADMIN_ACCESS_COOKIE if is_admin_path else ACCESS_COOKIE
    cookie_val = request.cookies.get(preferred_cookie) or request.cookies.get(
        ACCESS_COOKIE
    )
    if cookie_val:
      token = (
          cookie_val.split(" ", 1)[1].strip()
          if cookie_val.startswith("Bearer ")
          else cookie_val.strip()
      )

  if not token:
    raise credentials_exception

  try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") != "access":
      raise credentials_exception
    username = payload.get("sub")
    if not username or not isinstance(username, str):
      raise credentials_exception
  except JWTError:
    raise credentials_exception

  user = db.query(User).filter(User.username == username).first()
  if user is None or not bool(user.is_active):
    raise credentials_exception

  return user


async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
  role_val = (
      current_user.role.value
      if hasattr(current_user.role, "value")
      else str(current_user.role)
  )
  if role_val.strip().lower() not in {"admin", "super_admin"}:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Administrator access required",
    )
  return current_user