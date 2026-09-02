from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from .. import auth, schemas
from ..database import get_db
from ..models import PasswordResetToken, User

router = APIRouter()

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role.value}
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value}


@router.post("/password-reset/request", response_model=schemas.PasswordResetResponse)
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
            token=token,
            expires_at=datetime.utcnow() + timedelta(minutes=30),
        )
    )
    db.commit()
    return {
        "message": "Your password reset link is ready. Continue below to choose a new password.",
        "reset_token": token,
    }


@router.post("/password-reset/confirm", response_model=schemas.PasswordResetResponse)
def confirm_password_reset(
    payload: schemas.PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    reset = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token == payload.token,
            PasswordResetToken.used.is_(False),
            PasswordResetToken.expires_at > datetime.utcnow(),
        )
        .first()
    )
    if not reset:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")
    reset.user.hashed_password = auth.get_password_hash(payload.new_password)
    reset.used = True
    db.commit()
    return {"message": "Your password has been updated. You can now sign in."}