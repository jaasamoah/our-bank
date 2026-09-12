from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user, verify_password
from ..database import get_db
from ..models import Payee, User
from ..schemas import PayeeCreate, PayeeOut, PasswordConfirmation
from ..rate_limit import rate_limit

router = APIRouter()


@router.get("/", response_model=list[PayeeOut])
def get_payees(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Payee).filter(Payee.user_id == current_user.id).order_by(Payee.name).all()


@router.post(
    "/",
    response_model=PayeeOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("payee-create", 10))],
)
def create_payee(
    payload: PayeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = payload.name.strip()
    bank = payload.bank.strip()
    account_number = payload.account_number.strip()
    iban = payload.iban.strip().replace(" ", "").upper()
    swift_code = payload.swift_code.strip().replace(" ", "").upper()

    # Explicit mandatory validation
    if not name or not bank or len(account_number) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter a valid recipient name, bank, and account number",
        )

    if not iban or len(iban) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid IBAN is required",
        )

    if not swift_code or len(swift_code) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid SWIFT / BIC code is required (8-11 characters)",
        )

    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect",
        )

    existing = (
        db.query(Payee)
        .filter(
            Payee.user_id == current_user.id,
            Payee.account_number == account_number,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A payee with this account number already exists",
        )

    payee = Payee(
        user_id=current_user.id,
        name=name,
        bank=bank,
        account_number=account_number,
        iban=iban,
        swift_code=swift_code,
    )
    db.add(payee)
    db.commit()
    db.refresh(payee)
    return payee


@router.delete(
    "/{payee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(rate_limit("payee-delete", 10))],
)
def delete_payee(
    payee_id: int,
    payload: PasswordConfirmation,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payee = db.query(Payee).filter(Payee.id == payee_id, Payee.user_id == current_user.id).first()
    if not payee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payee not found")

    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password is incorrect")

    db.delete(payee)
    db.commit()
    return None