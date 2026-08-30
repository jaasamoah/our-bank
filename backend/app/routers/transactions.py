from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_user
from ..models import Account, User, Transaction
from ..schemas import TransferOut, TransferRequest

router = APIRouter()

@router.get("/")
def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Transaction).filter(Transaction.user_id == current_user.id).all()


@router.post("/transfer", response_model=TransferOut)
def create_transfer(
    transfer: TransferRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if transfer.amount <= 0:
        raise HTTPException(status_code=400, detail="Transfer amount must be greater than zero")
    if not transfer.to_account_id and not transfer.payee_name:
        raise HTTPException(status_code=400, detail="Choose a destination account or payee")
    if transfer.to_account_id and transfer.to_account_id == transfer.from_account_id:
        raise HTTPException(status_code=400, detail="Choose a different destination account")

    from_account = (
        db.query(Account)
        .filter(Account.id == transfer.from_account_id, Account.user_id == current_user.id)
        .first()
    )
    if not from_account:
        raise HTTPException(status_code=404, detail="Source account not found")
    if from_account.account_type != "credit" and from_account.balance < transfer.amount:
        raise HTTPException(status_code=400, detail="Amount exceeds available balance")

    to_account = None
    if transfer.to_account_id:
        to_account = (
            db.query(Account)
            .filter(Account.id == transfer.to_account_id, Account.user_id == current_user.id)
            .first()
        )
        if not to_account:
            raise HTTPException(status_code=404, detail="Destination account not found")

    destination = to_account.account_type.title() if to_account else transfer.payee_name
    from_account.balance -= transfer.amount
    outgoing = Transaction(
        user_id=current_user.id,
        account_id=from_account.id,
        amount=-transfer.amount,
        transaction_type="transfer",
        status="completed",
        description=transfer.note or f"Transfer to {destination}",
        reference=f"TRF-{current_user.id}-{from_account.id}",
    )
    db.add(outgoing)
    db.flush()
    transaction_ids = [outgoing.id]

    if to_account:
        to_account.balance += transfer.amount
        incoming = Transaction(
            user_id=current_user.id,
            account_id=to_account.id,
            amount=transfer.amount,
            transaction_type="transfer",
            status="completed",
            description=transfer.note or f"Transfer from {from_account.account_type.title()}",
            reference=outgoing.reference,
        )
        db.add(incoming)
        db.flush()
        transaction_ids.append(incoming.id)

    db.commit()
    return {
        "message": f"Transfer to {destination} completed",
        "amount": transfer.amount,
        "from_account_id": from_account.id,
        "to_account_id": to_account.id if to_account else None,
        "transaction_ids": transaction_ids,
    }