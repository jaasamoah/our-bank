from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user, verify_password
from ..database import get_db
from ..models import Payee, User
from ..schemas import PayeeCreate, PayeeOut, PasswordConfirmation

router = APIRouter()


@router.get("/", response_model=list[PayeeOut])
def get_payees(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Payee).filter(Payee.user_id == current_user.id).order_by(Payee.name).all()


@router.post("/", response_model=PayeeOut, status_code=201)
def create_payee(
    payload: PayeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = payload.name.strip()
    bank = payload.bank.strip()
    account_number = payload.account_number.strip()
    if not name or not bank or len(account_number) < 4:
        raise HTTPException(status_code=400, detail="Enter a name, bank, and valid account number")
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Password is incorrect")
    payee = Payee(
        user_id=current_user.id,
        name=name,
        bank=bank,
        account_number=account_number,
        iban=(payload.iban or "").strip() or None,
        swift_code=(payload.swift_code or "").strip().upper() or None,
    )
    db.add(payee)
    db.commit()
    db.refresh(payee)
    return payee


@router.delete("/{payee_id}", status_code=204)
def delete_payee(
    payee_id: int,
    payload: PasswordConfirmation,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payee = db.query(Payee).filter(Payee.id == payee_id, Payee.user_id == current_user.id).first()
    if not payee:
        raise HTTPException(status_code=404, detail="Payee not found")
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Password is incorrect")
    db.delete(payee)
    db.commit()