from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4

from ..auth import get_current_admin
from ..database import get_db
from ..models import Account, Beneficiary, Card, Complaint, Loan, Transaction, User, UserRole
from ..schemas import (
    AdminAccountUpdate,
    AdminBeneficiaryUpdate,
    AdminCardUpdate,
    AdminLoanOut,
    AdminLoanUpdate,
    AdminTransactionCreate,
    AdminTransactionOut,
    AdminTransactionStatusUpdate,
    AdminTransactionUpdate,
    AdminUserCreate,
    AdminUserOut,
    AdminUserUpdate,
    BeneficiaryOut,
    CardOut,
    ComplaintOut,
)

router = APIRouter()
TRANSACTION_STATUSES = {"processing", "completed", "failed", "reversed", "on_hold"}
LOAN_STATUSES = {"active", "pending", "paid", "defaulted"}


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "total_balance": sum(account.balance or 0 for account in user.accounts),
    }


def serialize_transaction(transaction: Transaction) -> dict:
    return {
        "id": transaction.id,
        "user_id": transaction.user_id,
        "user_name": transaction.user.full_name,
        "account_id": transaction.account_id,
        "account_number": transaction.account.account_number,
        "amount": transaction.amount,
        "transaction_type": transaction.transaction_type,
        "status": transaction.status,
        "description": transaction.description,
        "reference": transaction.reference,
        "created_at": transaction.created_at,
    }


@router.get("/me")
def admin_me(current_user: User = Depends(get_current_admin)):
    return current_user


@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).filter(User.role == UserRole.CUSTOMER).order_by(User.created_at.desc()).all()
    return [serialize_user(user) for user in users]


@router.post("/users", response_model=AdminUserOut, status_code=201)
def create_user(
    payload: AdminUserCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from ..auth import get_password_hash

    if db.query(User).filter((User.email == payload.email) | (User.username == payload.username)).first():
        raise HTTPException(status_code=400, detail="Email or username is already in use")
    user = User(
        email=payload.email,
        username=payload.username.strip(),
        full_name=payload.full_name.strip(),
        hashed_password=get_password_hash(payload.password),
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.patch("/users/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.CUSTOMER).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    values = payload.model_dump(exclude_unset=True)
    if "email" in values and db.query(User).filter(User.email == values["email"], User.id != user_id).first():
        raise HTTPException(status_code=400, detail="Email is already in use")
    if "username" in values and db.query(User).filter(User.username == values["username"], User.id != user_id).first():
        raise HTTPException(status_code=400, detail="Username is already in use")
    for key, value in values.items():
        setattr(user, key, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.get("/accounts")
def list_accounts(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    accounts = db.query(Account).join(User).order_by(Account.id).all()
    return [
        {
            "id": account.id,
            "user_id": account.user_id,
            "user_name": account.user.full_name,
            "account_number": account.account_number,
            "account_type": account.account_type,
            "balance": account.balance,
            "currency": account.currency,
            "status": "Active",
        }
        for account in accounts
    ]


@router.patch("/accounts/{account_id}")
def update_account(
    account_id: int,
    payload: AdminAccountUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    values = payload.model_dump(exclude_unset=True)
    if "balance" in values:
        account.balance = values["balance"]
    db.commit()
    db.refresh(account)
    return {
        "id": account.id,
        "user_id": account.user_id,
        "user_name": account.user.full_name,
        "account_number": account.account_number,
        "account_type": account.account_type,
        "balance": account.balance,
        "currency": account.currency,
        "status": values.get("status", "Active"),
    }


@router.post("/transactions", response_model=AdminTransactionOut, status_code=201)
def create_transaction(
    payload: AdminTransactionCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    merchant = payload.merchant.strip()
    category = payload.category.strip()
    direction = payload.direction.strip().lower()
    next_status = payload.status.strip().lower()
    if not merchant or not category:
        raise HTTPException(status_code=400, detail="Merchant and category are required")
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    if direction not in {"debit", "credit"}:
        raise HTTPException(status_code=400, detail="Direction must be debit or credit")
    if next_status not in TRANSACTION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Status must be processing, completed, failed, reversed, or on_hold",
        )

    user = db.query(User).filter(User.id == payload.user_id, User.role == UserRole.CUSTOMER).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    account = (
        db.query(Account)
        .filter(Account.id == payload.account_id, Account.user_id == payload.user_id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account does not belong to this customer")

    signed_amount = abs(payload.amount) if direction == "credit" else -abs(payload.amount)
    transaction_values = {
        "user_id": user.id,
        "account_id": account.id,
        "amount": signed_amount,
        "transaction_type": "deposit" if direction == "credit" else "withdrawal",
        "status": next_status,
        "description": f"{merchant} · {category}",
        "reference": payload.reference.strip() if payload.reference and payload.reference.strip() else f"ADM-{uuid4().hex[:12].upper()}",
    }
    if payload.created_at:
        transaction_values["created_at"] = payload.created_at

    account.balance += signed_amount
    transaction = Transaction(**transaction_values)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return serialize_transaction(transaction)


@router.patch("/transactions/{transaction_id}", response_model=AdminTransactionOut)
def update_transaction(
    transaction_id: int,
    payload: AdminTransactionUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    transaction = (
        db.query(Transaction)
        .join(User, Transaction.user_id == User.id)
        .join(Account, Transaction.account_id == Account.id)
        .filter(Transaction.id == transaction_id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    values = payload.model_dump(exclude_unset=True)
    if "status" in values:
        next_status = values["status"].strip().lower()
        if next_status not in TRANSACTION_STATUSES:
            raise HTTPException(
                status_code=400,
                detail="Status must be processing, completed, failed, reversed, or on_hold",
            )
        for linked_transaction in db.query(Transaction).filter(
            Transaction.reference == transaction.reference
        ).all():
            linked_transaction.status = next_status
    if "created_at" in values:
        if values["created_at"] is None:
            raise HTTPException(status_code=400, detail="Transaction date and time are required")
        transaction.created_at = values["created_at"]

    db.commit()
    db.refresh(transaction)
    return serialize_transaction(transaction)


@router.get("/transactions", response_model=list[AdminTransactionOut])
def list_transactions(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    transactions = (
        db.query(Transaction)
        .join(User, Transaction.user_id == User.id)
        .join(Account, Transaction.account_id == Account.id)
        .order_by(Transaction.created_at.desc(), Transaction.id.desc())
        .all()
    )
    return [serialize_transaction(transaction) for transaction in transactions]


@router.patch("/transactions/{transaction_id}/status", response_model=AdminTransactionOut)
def update_transaction_status(
    transaction_id: int,
    payload: AdminTransactionStatusUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    next_status = payload.status.strip().lower()
    if next_status not in TRANSACTION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Status must be processing, completed, failed, reversed, or on_hold",
        )

    transaction = (
        db.query(Transaction)
        .join(User, Transaction.user_id == User.id)
        .join(Account, Transaction.account_id == Account.id)
        .filter(Transaction.id == transaction_id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    linked_transactions = db.query(Transaction).filter(Transaction.reference == transaction.reference).all()
    for linked_transaction in linked_transactions:
        linked_transaction.status = next_status
    db.commit()
    db.refresh(transaction)
    return {
        "id": transaction.id,
        "user_id": transaction.user_id,
        "user_name": transaction.user.full_name,
        "account_id": transaction.account_id,
        "account_number": transaction.account.account_number,
        "amount": transaction.amount,
        "transaction_type": transaction.transaction_type,
        "status": transaction.status,
        "description": transaction.description,
        "reference": transaction.reference,
        "created_at": transaction.created_at,
    }


@router.get("/cards", response_model=list[CardOut])
def list_cards(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(Card).order_by(Card.id).all()


@router.patch("/cards/{card_id}/freeze", response_model=CardOut)
def set_card_frozen(
    card_id: int,
    frozen: bool,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    card.frozen = frozen
    db.commit()
    db.refresh(card)
    return card


@router.patch("/cards/{card_id}", response_model=CardOut)
def update_card(
    card_id: int,
    payload: AdminCardUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    values = payload.model_dump(exclude_unset=True)
    if "holder_name" in values:
        holder_name = (values["holder_name"] or "").strip()
        if not holder_name:
            raise HTTPException(status_code=400, detail="Card holder name is required")
        card.holder_name = holder_name
    if "card_number" in values:
        card_number = "".join((values["card_number"] or "").split())
        if not card_number.isdigit() or not 12 <= len(card_number) <= 19:
            raise HTTPException(status_code=400, detail="Card number must contain 12 to 19 digits")
        card.card_number = card_number
        card.last_four = card_number[-4:]
    if "expiry" in values:
        expiry = (values["expiry"] or "").strip()
        if not expiry:
            raise HTTPException(status_code=400, detail="Card expiry is required")
        card.expiry = expiry
    if "cvc" in values:
        cvc = "".join((values["cvc"] or "").split())
        if not cvc.isdigit() or len(cvc) not in {3, 4}:
            raise HTTPException(status_code=400, detail="CVC must contain 3 or 4 digits")
        card.cvc = cvc

    db.commit()
    db.refresh(card)
    return card


@router.get("/loans", response_model=list[AdminLoanOut])
def list_loans(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    loans = db.query(Loan).join(User).order_by(Loan.disbursed_date.desc(), Loan.id.desc()).all()
    return [
        {
            "id": loan.id,
            "user_id": loan.user_id,
            "user_name": loan.user.full_name,
            "amount": loan.amount,
            "outstanding": loan.outstanding,
            "interest_rate": loan.interest_rate,
            "term": loan.term,
            "status": loan.status,
            "disbursed_date": loan.disbursed_date,
            "description": loan.description,
            "created_at": loan.created_at,
        }
        for loan in loans
    ]


@router.patch("/loans/{loan_id}", response_model=AdminLoanOut)
def update_loan(
    loan_id: int,
    payload: AdminLoanUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).join(User).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    values = payload.model_dump(exclude_unset=True)
    if "amount" in values and (values["amount"] is None or values["amount"] < 0):
        raise HTTPException(status_code=400, detail="Loan amount cannot be negative")
    if "outstanding" in values and (values["outstanding"] is None or values["outstanding"] < 0):
        raise HTTPException(status_code=400, detail="Outstanding balance cannot be negative")
    if "interest_rate" in values and (values["interest_rate"] is None or values["interest_rate"] < 0):
        raise HTTPException(status_code=400, detail="Interest rate cannot be negative")
    if "status" in values:
        next_status = (values["status"] or "").strip().lower()
        if next_status not in LOAN_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid loan status")
        values["status"] = next_status
    if "term" in values:
        values["term"] = (values["term"] or "").strip()
    if "description" in values:
        values["description"] = (values["description"] or "").strip() or None
    for key, value in values.items():
        setattr(loan, key, value)
    db.commit()
    db.refresh(loan)
    return {
        "id": loan.id,
        "user_id": loan.user_id,
        "user_name": loan.user.full_name,
        "amount": loan.amount,
        "outstanding": loan.outstanding,
        "interest_rate": loan.interest_rate,
        "term": loan.term,
        "status": loan.status,
        "disbursed_date": loan.disbursed_date,
        "description": loan.description,
        "created_at": loan.created_at,
    }


@router.get("/users/{user_id}/beneficiaries", response_model=list[BeneficiaryOut])
def list_user_beneficiaries(
    user_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not db.query(User).filter(User.id == user_id, User.role == UserRole.CUSTOMER).first():
        raise HTTPException(status_code=404, detail="Customer not found")
    return (
        db.query(Beneficiary)
        .filter(Beneficiary.user_id == user_id)
        .order_by(Beneficiary.created_at.desc(), Beneficiary.id.desc())
        .all()
    )


@router.post("/users/{user_id}/beneficiaries", response_model=BeneficiaryOut, status_code=201)
def create_user_beneficiary(
    user_id: int,
    payload: AdminBeneficiaryUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not db.query(User).filter(User.id == user_id, User.role == UserRole.CUSTOMER).first():
        raise HTTPException(status_code=404, detail="Customer not found")
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Beneficiary name is required")
    beneficiary = Beneficiary(
        user_id=user_id,
        name=name,
        relationship=(payload.relationship or "").strip() or None,
        bank=(payload.bank or "").strip() or None,
        account_number=(payload.account_number or "").strip() or None,
        notes=(payload.notes or "").strip() or None,
    )
    db.add(beneficiary)
    db.commit()
    db.refresh(beneficiary)
    return beneficiary


@router.patch("/beneficiaries/{beneficiary_id}", response_model=BeneficiaryOut)
def update_beneficiary(
    beneficiary_id: int,
    payload: AdminBeneficiaryUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    values = payload.model_dump(exclude_unset=True)
    if "name" in values:
        values["name"] = (values["name"] or "").strip()
        if not values["name"]:
            raise HTTPException(status_code=400, detail="Beneficiary name is required")
    for key in ("relationship", "bank", "account_number", "notes"):
        if key in values:
            values[key] = (values[key] or "").strip() or None
    for key, value in values.items():
        setattr(beneficiary, key, value)
    db.commit()
    db.refresh(beneficiary)
    return beneficiary


@router.delete("/beneficiaries/{beneficiary_id}", status_code=204)
def delete_beneficiary(
    beneficiary_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    db.delete(beneficiary)
    db.commit()


@router.get("/complaints")
def list_complaints(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(Complaint)
        .join(User)
        .order_by(Complaint.created_at.desc())
        .all()
    )