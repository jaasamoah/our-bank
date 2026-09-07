from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import secrets
import subprocess
import json
import os
from pathlib import Path
from .. import auth, schemas
from ..database import get_db
from ..models import LoginChallenge, PasswordResetToken, RefreshToken, SecurityQuestion, User, UserRole
from ..rate_limit import rate_limit

router = APIRouter()

CHALLENGE_EXPIRE_MINUTES = 10
OTP_EXPIRE_MINUTES = 10
MAX_SECURITY_ATTEMPTS = 5
MAX_OTP_ATTEMPTS = 5


def _hash_challenge(value: str) -> str:
    return sha256(value.encode("utf-8")).hexdigest()


def _send_login_otp(user: User, otp: str) -> None:
    sender = os.getenv("OTP_FROM_EMAIL", "onboarding@resend.dev")
    helper = Path(__file__).resolve().parents[2] / "email_sender.mjs"
    payload = {
        "from": sender,
        "to": [user.email],
        "subject": "Your telosbank verification code",
        "text": f"Your telosbank verification code is {otp}. It expires in {OTP_EXPIRE_MINUTES} minutes. If you did not try to sign in, contact support.",
        "html": (
            "<div style=\"font-family:Arial,sans-serif;line-height:1.5\">"
            "<h2>telosbank verification code</h2>"
            f"<p>Your one-time verification code is <strong style=\"font-size:24px;letter-spacing:4px\">{otp}</strong>.</p>"
            f"<p>This code expires in {OTP_EXPIRE_MINUTES} minutes. If you did not try to sign in, contact support.</p>"
            "</div>"
        ),
    }
    try:
        result = subprocess.run(
            ["node", str(helper)],
            input=json.dumps(payload),
            text=True,
            capture_output=True,
            timeout=20,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise HTTPException(status_code=503, detail="Email delivery is temporarily unavailable") from exc
    if result.returncode != 0:
        raise HTTPException(status_code=503, detail="Email delivery is temporarily unavailable")


def _create_login_challenge(db: Session, user: User) -> tuple[str, LoginChallenge]:
    raw_token = secrets.token_urlsafe(48)
    challenge = LoginChallenge(
        user_id=user.id,
        token_hash=_hash_challenge(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=CHALLENGE_EXPIRE_MINUTES),
    )
    db.query(LoginChallenge).filter(
        LoginChallenge.user_id == user.id,
        LoginChallenge.completed_at.is_(None),
    ).delete(synchronize_session=False)
    db.add(challenge)
    db.flush()
    return raw_token, challenge


def _get_active_challenge(db: Session, raw_token: str) -> LoginChallenge:
    challenge = (
        db.query(LoginChallenge)
        .filter(
            LoginChallenge.token_hash == _hash_challenge(raw_token),
            LoginChallenge.completed_at.is_(None),
            LoginChallenge.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not challenge or not challenge.user.is_active:
        raise HTTPException(status_code=401, detail="This login challenge is invalid or has expired")
    return challenge

@router.post("/login", dependencies=[Depends(rate_limit("login", 10))])
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    is_admin_client = request.headers.get("X-Client-Role") == "admin"
    identifier_filter = User.username == form_data.username if is_admin_client else User.email == form_data.username
    user = db.query(User).filter(identifier_filter).first()
    if not user or not user.is_active or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not is_admin_client:
        questions = (
            db.query(SecurityQuestion)
            .filter(SecurityQuestion.user_id == user.id)
            .order_by(SecurityQuestion.position.asc(), SecurityQuestion.id.asc())
            .all()
        )
        if len(questions) < 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security questions have not been configured for this account. Contact an administrator.",
            )
        challenge_token, _ = _create_login_challenge(db, user)
        db.commit()
        return {
            "stage": "security_questions",
            "challenge_token": challenge_token,
            "questions": [{"id": question.id, "question": question.question} for question in questions],
        }

    access_token = auth.create_access_token(data={"sub": user.username})
    refresh_token = auth.create_refresh_token(db, user)
    db.commit()
    auth.set_auth_cookies(
        response,
        access_token,
        refresh_token,
        admin=bool(request and request.headers.get("X-Client-Role") == "admin"),
    )
    return {"stage": "complete", "token_type": "bearer", "role": user.role.value}


@router.post("/login/security-questions", response_model=schemas.LoginChallengeResponse, dependencies=[Depends(rate_limit("login-security", 10))])
def verify_security_questions(
    payload: schemas.LoginSecurityVerification,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    challenge = _get_active_challenge(db, payload.challenge_token)
    if challenge.security_verified:
        raise HTTPException(status_code=400, detail="Security questions have already been verified")
    if challenge.security_attempts >= MAX_SECURITY_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many security-question attempts")

    expected = {question.id: question for question in challenge.user.security_questions}
    submitted = {answer.question_id: answer.answer.strip().casefold() for answer in payload.answers}
    challenge.security_attempts += 1
    if set(submitted) != set(expected) or not all(
        auth.verify_password(submitted[question_id], question.answer_hash)
        for question_id, question in expected.items()
    ):
        db.commit()
        raise HTTPException(status_code=401, detail="The security answers are incorrect")

    otp = f"{secrets.randbelow(1_000_000):06d}"
    challenge.security_verified = True
    challenge.otp_hash = _hash_challenge(otp)
    challenge.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)
    challenge.otp_attempts = 0
    db.commit()
    _send_login_otp(challenge.user, otp)
    return {
        "stage": "otp",
        "challenge_token": payload.challenge_token,
        "questions": [],
        "message": "A verification code was sent to your email address.",
    }


@router.post("/login/otp", dependencies=[Depends(rate_limit("login-otp", 10))])
def verify_login_otp(
    payload: schemas.LoginOtpVerification,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    challenge = _get_active_challenge(db, payload.challenge_token)
    if not challenge.security_verified or not challenge.otp_hash or not challenge.otp_expires_at:
        raise HTTPException(status_code=400, detail="Complete the security questions first")
    if challenge.otp_attempts >= MAX_OTP_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many verification-code attempts")
    if challenge.otp_expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="The verification code has expired")

    challenge.otp_attempts += 1
    if not secrets.compare_digest(challenge.otp_hash, _hash_challenge(payload.otp)):
        db.commit()
        raise HTTPException(status_code=401, detail="The verification code is incorrect")

    challenge.completed_at = datetime.now(timezone.utc)
    access_token = auth.create_access_token(data={"sub": challenge.user.username})
    refresh_token = auth.create_refresh_token(db, challenge.user)
    db.commit()
    auth.set_auth_cookies(response, access_token, refresh_token, admin=False)
    return {"stage": "complete", "token_type": "bearer", "role": challenge.user.role.value}


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