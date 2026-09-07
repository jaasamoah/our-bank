from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import secrets
from .. import auth, schemas
from ..database import get_db
from ..models import PasswordResetToken, RefreshToken, User
from ..rate_limit import rate_limit

router = APIRouter()

@router.post("/login", dependencies=[Depends(rate_limit("login", 10))])
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not user.is_active or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.username})
    refresh_token = auth.create_refresh_token(db, user)
    db.commit()
    auth.set_auth_cookies(
        response,
        access_token,
        refresh_token,
        admin=bool(request and request.headers.get("X-Client-Role") == "admin"),
    )
    return {"token_type": "bearer", "role": user.role.value}


@router.post("/refresh", dependencies=[Depends(rate_limit("refresh", 20))])
def refresh_session(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    is_admin_session = request.headers.get("X-Client-Role") == "admin"
    if not is_admin_session:
        is_admin_session = bool(request.cookies.get(auth.ADMIN_REFRESH_COOKIE)) and not request.cookies.get(auth.REFRESH_COOKIE)
    refresh_cookie = auth.ADMIN_REFRESH_COOKIE if is_admin_session else auth.REFRESH_COOKIE
    raw_token = request.cookies.get(refresh_cookie)
    if not raw_token:
        raise HTTPException(status_code=401, detail="Authentication required")
    stored = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == auth.hash_refresh_token(raw_token),
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not stored or not stored.user.is_active:
        raise HTTPException(status_code=401, detail="Authentication required")
    stored.revoked_at = datetime.now(timezone.utc)
    new_refresh = auth.create_refresh_token(db, stored.user)
    stored.replaced_by_hash = auth.hash_refresh_token(new_refresh)
    new_access = auth.create_access_token(data={"sub": stored.user.username})
    db.commit()
    auth.set_auth_cookies(response, new_access, new_refresh, admin=is_admin_session)
    return {"token_type": "bearer", "role": stored.user.role.value}


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(auth.REFRESH_COOKIE) or request.cookies.get(auth.ADMIN_REFRESH_COOKIE)
    if raw_token:
        stored = db.query(RefreshToken).filter(RefreshToken.token_hash == auth.hash_refresh_token(raw_token)).first()
        if stored and stored.revoked_at is None:
            stored.revoked_at = datetime.now(timezone.utc)
            db.commit()
    auth.clear_auth_cookies(response)
    return {"message": "Signed out"}


@router.post(
    "/password-reset/request",
    response_model=schemas.PasswordResetResponse,
    dependencies=[Depends(rate_limit("password-reset", 5))],
)
def request_password_reset(
    payload: schemas.PasswordResetRequest,
    db: Session = Depends(get_db),
):
    identifier = payload.identifier.strip()
    user = (
        db.query(User)
        .filter((User.username == identifier) | (User.email == identifier))
        .first()
    )
    if not user:
        return {"message": "If an account matches that information, a password reset link is ready."}

    token = secrets.token_urlsafe(32)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token=sha256(token.encode("utf-8")).hexdigest(),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
    )
    db.commit()
    # Never return reset tokens in API responses. In production this token is
    # delivered by an out-of-band email/SMS provider.
    return {"message": "If an account matches that information, a password reset link is ready."}


@router.post(
    "/password-reset/confirm",
    response_model=schemas.PasswordResetResponse,
    dependencies=[Depends(rate_limit("password-reset-confirm", 5))],
)
def confirm_password_reset(
    payload: schemas.PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    reset = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token == sha256(payload.token.encode("utf-8")).hexdigest(),
            PasswordResetToken.used.is_(False),
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not reset:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")
    reset.user.hashed_password = auth.get_password_hash(payload.new_password)
    reset.used = True
    db.query(RefreshToken).filter(
        RefreshToken.user_id == reset.user_id,
        RefreshToken.revoked_at.is_(None),
    ).update({RefreshToken.revoked_at: datetime.now(timezone.utc)}, synchronize_session=False)
    db.commit()
    return {"message": "Your password has been updated. You can now sign in."}