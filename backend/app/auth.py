from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Optional
import os
import secrets

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from .database import get_db
from .models import RefreshToken, User
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SESSION_SECRET") or os.getenv("SECRET_KEY")
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError("SESSION_SECRET must be configured with at least 32 characters")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10
REFRESH_TOKEN_EXPIRE_DAYS = 7
ACCESS_COOKIE = "access_token"
ADMIN_ACCESS_COOKIE = "admin_access_token"
REFRESH_COOKIE = "refresh_token"
ADMIN_REFRESH_COOKIE = "admin_refresh_token"
CSRF_COOKIE = "csrf_token"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true" if os.getenv("APP_ENV") == "production" else "false").lower() == "true"

pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "jti": secrets.token_hex(16), "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def hash_refresh_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def create_refresh_token(db: Session, user: User) -> str:
    raw_token = secrets.token_urlsafe(48)
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    return raw_token


def set_auth_cookies(response, access_token: str, refresh_token, admin: bool = False):
    import os
    app_env = os.getenv("APP_ENV", "").lower()
    is_prod = app_env == "production" or os.getenv("COOKIE_SECURE", "false").lower() == "true"
    
    token_str = getattr(refresh_token, "token", refresh_token)
    prefix = "admin_" if admin else ""
    
    samesite_val = "none" if is_prod else "lax"
    secure_val = True if is_prod else False

    response.set_cookie(
        key=f"{prefix}access_token",
        value=access_token,
        httponly=True,
        secure=secure_val,
        samesite=samesite_val,
        max_age=15 * 60,
        path="/",
    )
    response.set_cookie(
        key=f"{prefix}refresh_token",
        value=str(token_str),
        httponly=True,
        secure=secure_val,
        samesite=samesite_val,
        max_age=7 * 86400,
        path="/",
    )


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    access_cookie = ADMIN_ACCESS_COOKIE if request.url.path.startswith("/api/admin") else ACCESS_COOKIE
    token = request.cookies.get(access_cookie)
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise credentials_exception
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role.value not in {"admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required")
    return current_user