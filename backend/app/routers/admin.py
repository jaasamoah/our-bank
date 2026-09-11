from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_admin
from ..database import get_db
from ..models import (
    Account,
    Beneficiary,
    Card,
    Complaint,
    Investment,
    Loan,
    LoginChallenge,
    PasswordResetToken,
    Payee,
    PublicSupportRequest,
    SecurityQuestion,
    Transaction,
    User,
    UserRole,
)
from ..schemas import (
    AdminAccountCreate,
    AdminAccountOut,
    AdminAccountUpdate,
    AdminBeneficiaryUpdate,
    AdminCardCreate,
    AdminCardOut,
    AdminCardUpdate,
    AdminInvestmentCreate,
    AdminInvestmentOut,
    AdminInvestmentUpdate,
    AdminLoanCreate,
    AdminLoanOut,
    AdminLoanUpdate,
    AdminSecurityQuestionsOut,
    AdminSecurityQuestionsUpdate,
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
    UserOut,
)

router = APIRouter()
TRANSACTION_STATUSES = {"processing", "completed", "failed", "reversed", "on_hold"}
LOAN_STATUSES = {"active", "pending", "paid", "defaulted"}
ACCOUNT_STATUSES = {"active", "frozen", "closed"}


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "address": user.address,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "total_balance": sum(account.balance or 0 for account in user.accounts),
    }


def serialize_security_question(question: SecurityQuestion) -> dict:
    return {"id": question.id, "question": question.question}


def serialize_account(account: Account) -> dict:
    return {
        "id": account.id,
        "user_id": account.user_id,
        "user_name": account.user.full_name if account.user else "",
        "account_number": account.account_number,
        "account_type": account.account_type,
        "balance": account.balance,
        "currency": account.currency,
        "status": account.status or "Active",
    }


def serialize_card(card: Card) -> dict:
    return {
        "id": card.id,
        "user_id": card.user_id,
        "user_name": card.user.full_name if card.user else "",
        "account_id": card.account_id,
        "account_type": card.account.account_type if card.account else "",
        "holder_name": card.holder_name,
        "last_four": card.last_four,
        "card_number": card.card_number,
        "expiry": card.expiry,
        "cvc": card.cvc,
        "network": card.network,
        "frozen": card.frozen,
        "created_at": card.created_at,
    }


def serialize_investment(investment: Investment) -> dict:
    return {
        "id": investment.id,
        "user_id": investment.user_id,
        "user_name": investment.user.full_name if investment.user else "",
        "symbol": investment.symbol,
        "name": investment.name,
        "asset_class": investment.asset_class,
        "units": investment.units,
        "average_cost": investment.average_cost,
        "current_price": investment.current_price,
        "market_value": investment.market_value,
        "cost_basis": investment.cost_basis,
        "daily_change": investment.daily_change,
        "total_return": investment.total_return,
        "allocation_percentage": investment.allocation_percentage,
        "currency": investment.currency,
        "created_at": investment.created_at,
    }


def serialize_transaction(transaction: Transaction) -> dict:
    return {
        "id": transaction.id,
        "user_id": transaction.user_id,
        "user_name": transaction.user.full_name if transaction.user else "",
        "account_id": transaction.account_id,
        "account_number": transaction.account.account_number if transaction.account else "",
        "amount": transaction.amount,
        "transaction_type": transaction.transaction_type,
        "status": transaction.status,
        "description": transaction.description,
        "reference": transaction.reference,
        "created_at": transaction.created_at,
    }


@router.get("/me", response_model=UserOut)
def admin_me(current_user: User = Depends(get_current_admin)):
    return current_user


@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .filter(User.role == UserRole.CUSTOMER)
        .order_by(User.created_at.desc())
        .all()
    )
    return [serialize_user(user) for user in users]


@router.post("/users", response_model=AdminUserOut, status_code=201)
def create_user(
    payload: AdminUserCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from ..auth import get_password_hash

    if (
        db.query(User)
        .filter(
            (User.email == payload.email) | (User.username == payload.username)
        )
        .first()
    ):
        raise HTTPException(
            status_code=400, detail="Email or username is already in use"
        )
    user = User(
        email=payload.email,
        username=payload.username.strip(),
        full_name=payload.full_name.strip(),
        address=payload.address.strip() if payload.address else None,
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
    user = (
        db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    values = payload.model_dump(exclude_unset=True)
    if (
        "email" in values
        and db.query(User)
        .filter(User.email == values["email"], User.id != user_id)
        .first()
    ):
        raise HTTPException(status_code=400, detail="Email is already in use")
    if (
        "username" in values
        and db.query(User)
        .filter(User.username == values["username"], User.id != user_id)
        .first()
    ):
        raise HTTPException(status_code=400, detail="Username is already in use")
    for key, value in values.items():
        if key == "created_at" and value is not None:
            if isinstance(value, str):
                try:
                    value = datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
                except Exception:
                    continue
            elif hasattr(value, "tzinfo"):
                value = value.replace(tzinfo=None)
            setattr(user, "created_at", value)
        else:
            setattr(user, key, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    account_ids = [
        account.id
        for account in db.query(Account.id).filter(Account.user_id == user_id).all()
    ]
    if account_ids:
        db.query(Transaction).filter(
            Transaction.account_id.in_(account_ids)
        ).delete(synchronize_session=False)
    db.query(Transaction).filter(Transaction.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Card).filter(Card.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Loan).filter(Loan.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Beneficiary).filter(Beneficiary.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Payee).filter(Payee.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Investment).filter(Investment.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Complaint).filter(Complaint.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id
    ).delete(synchronize_session=False)
    db.query(SecurityQuestion).filter(SecurityQuestion.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(LoginChallenge).filter(LoginChallenge.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Account).filter(Account.user_id == user_id).delete(
        synchronize_session=False
    )
    db.delete(user)
    db.commit()


@router.get(
    "/users/{user_id}/security-questions",
    response_model=AdminSecurityQuestionsOut,
)
def get_security_questions(
    user_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    questions = (
        db.query(SecurityQuestion)
        .filter(SecurityQuestion.user_id == user_id)
        .order_by(SecurityQuestion.position.asc(), SecurityQuestion.id.asc())
        .all()
    )
    return {
        "questions": [
            serialize_security_question(question) for question in questions
        ]
    }


@router.put(
    "/users/{user_id}/security-questions",
    response_model=AdminSecurityQuestionsOut,
)
def replace_security_questions(
    user_id: int,
    payload: AdminSecurityQuestionsUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from ..auth import get_password_hash

    user = (
        db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    normalized_questions = [
        (item.question.strip(), item.answer.strip()) for item in payload.questions
    ]
    if len({
        question.casefold() for question, _ in normalized_questions
    }) != len(normalized_questions):
        raise HTTPException(
            status_code=400, detail="Security questions must be unique"
        )
    if any(
        not question or not answer for question, answer in normalized_questions
    ):
        raise HTTPException(
            status_code=400, detail="Security questions and answers are required"
        )

    db.query(SecurityQuestion).filter(SecurityQuestion.user_id == user_id).delete(
        synchronize_session=False
    )
    for position, (question, answer) in enumerate(normalized_questions):
        db.add(
            SecurityQuestion(
                user_id=user_id,
                question=question,
                answer_hash=get_password_hash(answer.casefold()),
                position=position,
            )
        )
    db.commit()
    questions = (
        db.query(SecurityQuestion)
        .filter(SecurityQuestion.user_id == user_id)
        .order_by(SecurityQuestion.position.asc(), SecurityQuestion.id.asc())
        .all()
    )
    return {
        "questions": [
            serialize_security_question(question) for question in questions
        ]
    }


@router.get("/accounts", response_model=list[AdminAccountOut])
def list_accounts(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    accounts = db.query(Account).join(User).order_by(Account.id).all()
    return [serialize_account(account) for account in accounts]


@router.post("/accounts", response_model=AdminAccountOut, status_code=201)
def create_account(
    payload: AdminAccountCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    account_type = payload.account_type.strip().lower()
    currency = payload.currency.strip().upper()
    status = payload.status.strip().lower()
    if status not in ACCOUNT_STATUSES:
        raise HTTPException(
            status_code=400, detail="Status must be active, frozen, or closed"
        )
    account_number = (payload.account_number or "").strip() or (
        f"TEL-{uuid4().hex[:12].upper()}"
    )
    if db.query(Account).filter(Account.account_number == account_number).first():
        raise HTTPException(
            status_code=400, detail="Account number is already in use"
        )
    account = Account(
        user_id=user.id,
        account_number=account_number,
        account_type=account_type,
        balance=payload.balance,
        currency=currency,
        status=status.title(),
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return serialize_account(account)


@router.patch("/accounts/{account_id}", response_model=AdminAccountOut)
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
    if "account_number" in values:
        account_number = (values["account_number"] or "").strip()
        if not account_number:
            raise HTTPException(status_code=400, detail="Account number is required")
        if (
            db.query(Account)
            .filter(
                Account.account_number == account_number, Account.id != account_id
            )
            .first()
        ):
            raise HTTPException(
                status_code=400, detail="Account number is already in use"
            )
        account.account_number = account_number
    if "account_type" in values:
        account.account_type = (values["account_type"] or "").strip().lower()
    if "balance" in values and values["balance"] is not None:
        account.balance = float(values["balance"])
    if "currency" in values:
        account.currency = (values["currency"] or "").strip().upper()
    if "status" in values:
        status = (values["status"] or "").strip().lower()
        if status not in ACCOUNT_STATUSES:
            raise HTTPException(
                status_code=400, detail="Status must be active, frozen, or closed"
            )
        account.status = status.title()
    db.commit()
    db.refresh(account)
    return serialize_account(account)


@router.delete("/accounts/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.query(Transaction).filter(Transaction.account_id == account_id).delete(
        synchronize_session=False
    )
    db.query(Card).filter(Card.account_id == account_id).delete(
        synchronize_session=False
    )
    db.delete(account)
    db.commit()


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
        raise HTTPException(
            status_code=400, detail="Merchant and category are required"
        )
    if payload.amount <= 0:
        raise HTTPException(
            status_code=400, detail="Amount must be greater than zero"
        )
    if direction not in {"debit", "credit"}:
        raise HTTPException(
            status_code=400, detail="Direction must be debit or credit"
        )
    if next_status not in TRANSACTION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Status must be processing, completed, failed, reversed, or on_hold"
            ),
        )

    user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    account = (
        db.query(Account)
        .filter(
            Account.id == payload.account_id, Account.user_id == payload.user_id
        )
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=404, detail="Account does not belong to this customer"
        )

    signed_amount = (
        abs(payload.amount) if direction == "credit" else -abs(payload.amount)
    )
    transaction_values = {
        "user_id": user.id,
        "account_id": account.id,
        "amount": signed_amount,
        "transaction_type": "deposit" if direction == "credit" else "withdrawal",
        "status": next_status,
        "description": f"{merchant} · {category}",
        "reference": (
            payload.reference.strip()
            if payload.reference and payload.reference.strip()
            else f"ADM-{uuid4().hex[:12].upper()}"
        ),
    }
    if payload.created_at:
        raw_date = payload.created_at
        if isinstance(raw_date, str):
            try:
                raw_date = datetime.fromisoformat(raw_date.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                pass
        elif hasattr(raw_date, "tzinfo"):
            raw_date = raw_date.replace(tzinfo=None)
        transaction_values["created_at"] = raw_date

    account.balance += signed_amount
    transaction = Transaction(**transaction_values)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return serialize_transaction(transaction)


@router.patch(
    "/transactions/{transaction_id}", response_model=AdminTransactionOut
)
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
    next_user_id = values.get("user_id", transaction.user_id)
    next_account_id = values.get("account_id", transaction.account_id)
    next_user = (
        db.query(User)
        .filter(User.id == next_user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not next_user:
        raise HTTPException(status_code=404, detail="Customer not found")
    next_account = (
        db.query(Account)
        .filter(
            Account.id == next_account_id,
            Account.user_id == next_user_id,
        )
        .first()
    )
    if not next_account:
        raise HTTPException(
            status_code=404, detail="Account does not belong to this customer"
        )
    if "amount" in values and values["amount"] is None:
        raise HTTPException(status_code=400, detail="Transaction amount is required")
    if "transaction_type" in values:
        values["transaction_type"] = (
            values["transaction_type"] or ""
        ).strip().lower()
        if not values["transaction_type"]:
            raise HTTPException(
                status_code=400, detail="Transaction type is required"
            )
    if "description" in values:
        values["description"] = (values["description"] or "").strip()
        if not values["description"]:
            raise HTTPException(
                status_code=400, detail="Transaction description is required"
            )
    if "reference" in values:
        values["reference"] = (values["reference"] or "").strip()
        if not values["reference"]:
            raise HTTPException(
                status_code=400, detail="Transaction reference is required"
            )
    if "status" in values:
        next_status = values["status"].strip().lower()
        if next_status not in TRANSACTION_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Status must be processing, completed, failed, reversed, or"
                    " on_hold"
                ),
            )
        for linked_transaction in (
            db.query(Transaction)
            .filter(Transaction.reference == transaction.reference)
            .all()
        ):
            linked_transaction.status = next_status
        transaction.status = next_status

    if "created_at" in values and values["created_at"] is not None:
        raw_date = values["created_at"]
        if isinstance(raw_date, str):
            try:
                values["created_at"] = datetime.fromisoformat(raw_date.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                pass
        elif hasattr(raw_date, "tzinfo"):
            values["created_at"] = raw_date.replace(tzinfo=None)

    old_amount = transaction.amount
    old_account = transaction.account
    next_amount = values.get("amount", old_amount)
    if next_amount is None:
        raise HTTPException(status_code=400, detail="Transaction amount is required")
    if next_account.id != old_account.id:
        old_account.balance -= old_amount
        next_account.balance += next_amount
    else:
        next_account.balance += next_amount - old_amount
    transaction.user_id = next_user.id
    transaction.account_id = next_account.id
    for key in (
        "amount",
        "transaction_type",
        "description",
        "reference",
        "created_at",
    ):
        if key in values and values[key] is not None:
            setattr(transaction, key, values[key])

    db.commit()
    db.refresh(transaction)
    return serialize_transaction(transaction)


@router.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    transaction = (
        db.query(Transaction).filter(Transaction.id == transaction_id).first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    linked_transactions = (
        db.query(Transaction)
        .filter(Transaction.reference == transaction.reference)
        .all()
    )
    for linked_transaction in linked_transactions:
        linked_transaction.account.balance -= linked_transaction.amount
        db.delete(linked_transaction)
    db.commit()


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


@router.patch(
    "/transactions/{transaction_id}/status", response_model=AdminTransactionOut
)
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
            detail=(
                "Status must be processing, completed, failed, reversed, or on_hold"
            ),
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

    linked_transactions = (
        db.query(Transaction)
        .filter(Transaction.reference == transaction.reference)
        .all()
    )
    for linked_transaction in linked_transactions:
        linked_transaction.status = next_status
    db.commit()
    db.refresh(transaction)
    return serialize_transaction(transaction)


@router.get("/cards", response_model=list[AdminCardOut])
def list_cards(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return [
        serialize_card(card)
        for card in db.query(Card)
        .join(Account)
        .join(User)
        .order_by(Card.id)
        .all()
    ]


@router.post("/cards", response_model=AdminCardOut, status_code=201)
def create_card(
    payload: AdminCardCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    account = (
        db.query(Account)
        .filter(Account.id == payload.account_id, Account.user_id == user.id)
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=400, detail="Account does not belong to this customer"
        )
    card_number = "".join(payload.card_number.split())
    cvc = "".join(payload.cvc.split())
    if not card_number.isdigit() or not 12 <= len(card_number) <= 19:
        raise HTTPException(
            status_code=400, detail="Card number must contain 12 to 19 digits"
        )
    if not cvc.isdigit() or len(cvc) not in {3, 4}:
        raise HTTPException(
            status_code=400, detail="CVC must contain 3 or 4 digits"
        )
    card = Card(
        user_id=user.id,
        account_id=account.id,
        holder_name=payload.holder_name.strip(),
        last_four=card_number[-4:],
        card_number=card_number,
        expiry=payload.expiry.strip(),
        cvc=cvc,
        network=payload.network.strip(),
        frozen=payload.frozen,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return serialize_card(card)


@router.patch("/cards/{card_id}/freeze", response_model=AdminCardOut)
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
    return serialize_card(card)


@router.patch("/cards/{card_id}", response_model=AdminCardOut)
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
    if "account_id" in values:
        account = db.query(Account).filter(Account.id == values["account_id"]).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        card.account_id = account.id
        card.user_id = account.user_id
    if "holder_name" in values:
        holder_name = (values["holder_name"] or "").strip()
        if not holder_name:
            raise HTTPException(status_code=400, detail="Card holder name is required")
        card.holder_name = holder_name
    if "card_number" in values:
        card_number = "".join((values["card_number"] or "").split())
        if not card_number.isdigit() or not 12 <= len(card_number) <= 19:
            raise HTTPException(
                status_code=400, detail="Card number must contain 12 to 19 digits"
            )
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
            raise HTTPException(
                status_code=400, detail="CVC must contain 3 or 4 digits"
            )
        card.cvc = cvc
    if "network" in values:
        network = (values["network"] or "").strip()
        if not network:
            raise HTTPException(status_code=400, detail="Card network is required")
        card.network = network
    if "frozen" in values:
        card.frozen = values["frozen"]

    db.commit()
    db.refresh(card)
    return serialize_card(card)


@router.delete("/cards/{card_id}", status_code=204)
def delete_card(
    card_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()


@router.get("/investments", response_model=list[AdminInvestmentOut])
def list_investments(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    investments = (
        db.query(Investment)
        .join(User)
        .order_by(Investment.created_at.desc(), Investment.id.desc())
        .all()
    )
    return [serialize_investment(investment) for investment in investments]


@router.post("/investments", response_model=AdminInvestmentOut, status_code=201)
def create_investment(
    payload: AdminInvestmentCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    investment = Investment(
        user_id=user.id,
        symbol=payload.symbol.strip().upper(),
        name=payload.name.strip(),
        asset_class=payload.asset_class.strip(),
        units=payload.units,
        average_cost=payload.average_cost,
        current_price=payload.current_price,
        market_value=payload.market_value,
        cost_basis=payload.cost_basis,
        daily_change=payload.daily_change,
        total_return=payload.total_return,
        allocation_percentage=payload.allocation_percentage,
        currency=payload.currency.strip().upper(),
    )
    db.add(investment)
    db.commit()
    db.refresh(investment)
    return serialize_investment(investment)


@router.patch(
    "/investments/{investment_id}", response_model=AdminInvestmentOut
)
def update_investment(
    investment_id: int,
    payload: AdminInvestmentUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    investment = (
        db.query(Investment).filter(Investment.id == investment_id).first()
    )
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    values = payload.model_dump(exclude_unset=True)
    if "user_id" in values:
        user = (
            db.query(User)
            .filter(User.id == values["user_id"], User.role == UserRole.CUSTOMER)
            .first()
        )
        if not user:
            raise HTTPException(status_code=404, detail="Customer not found")
        investment.user_id = user.id
    for key, value in values.items():
        if key == "user_id":
            continue
        if isinstance(value, str):
            value = value.strip()
            if key == "symbol":
                value = value.upper()
            if key == "currency":
                value = value.upper()
        setattr(investment, key, value)
    db.commit()
    db.refresh(investment)
    return serialize_investment(investment)


@router.delete("/investments/{investment_id}", status_code=204)
def delete_investment(
    investment_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    investment = (
        db.query(Investment).filter(Investment.id == investment_id).first()
    )
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    db.delete(investment)
    db.commit()


@router.get("/dashboard")
def get_dashboard(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    customers = db.query(User).filter(User.role == UserRole.CUSTOMER).all()
    accounts = db.query(Account).all()
    investments = db.query(Investment).all()
    loans = db.query(Loan).all()
    cards = db.query(Card).all()
    transactions = (
        db.query(Transaction)
        .join(User, Transaction.user_id == User.id)
        .join(Account, Transaction.account_id == Account.id)
        .order_by(Transaction.created_at.desc(), Transaction.id.desc())
        .limit(8)
        .all()
    )
    account_assets = sum(account.balance or 0 for account in accounts)
    investment_assets = sum(
        investment.market_value or 0 for investment in investments
    )
    return {
        "total_users": len(customers),
        "active_users": sum(1 for user in customers if user.is_active),
        "total_accounts": len(accounts),
        "active_accounts": sum(
            1
            for account in accounts
            if (account.status or "Active").lower() == "active"
        ),
        "total_cards": len(cards),
        "active_cards": sum(1 for card in cards if not card.frozen),
        "active_loans": sum(1 for loan in loans if loan.status == "active"),
        "total_assets": round(account_assets + investment_assets, 2),
        "total_account_balances": round(account_assets, 2),
        "total_investment_value": round(investment_assets, 2),
        "pending_transactions": sum(
            1
            for transaction in db.query(Transaction).all()
            if transaction.status in {"processing", "on_hold"}
        ),
        "failed_transactions": sum(
            1
            for transaction in db.query(Transaction).all()
            if transaction.status == "failed"
        ),
        "recent_transactions": [
            serialize_transaction(transaction) for transaction in transactions
        ],
    }


@router.get("/loans", response_model=list[AdminLoanOut])
def list_loans(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    loans = (
        db.query(Loan)
        .join(User)
        .order_by(Loan.disbursed_date.desc(), Loan.id.desc())
        .all()
    )
    return [
        {
            "id": loan.id,
            "user_id": loan.user_id,
            "user_name": loan.user.full_name if loan.user else "",
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


@router.post("/loans", response_model=AdminLoanOut, status_code=201)
def create_loan(
    payload: AdminLoanCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    if payload.amount < 0 or payload.outstanding < 0 or payload.interest_rate < 0:
        raise HTTPException(
            status_code=400, detail="Loan values cannot be negative"
        )
    status = payload.status.strip().lower()
    if status not in LOAN_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid loan status")
    term = payload.term.strip()
    if not term:
        raise HTTPException(status_code=400, detail="Loan term is required")
    loan = Loan(
        user_id=user.id,
        amount=payload.amount,
        outstanding=payload.outstanding,
        interest_rate=payload.interest_rate,
        term=term,
        status=status,
        disbursed_date=payload.disbursed_date,
        description=(payload.description or "").strip() or None,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return {
        "id": loan.id,
        "user_id": loan.user_id,
        "user_name": loan.user.full_name if loan.user else "",
        "amount": loan.amount,
        "outstanding": loan.outstanding,
        "interest_rate": loan.interest_rate,
        "term": loan.term,
        "status": loan.status,
        "disbursed_date": loan.disbursed_date,
        "description": loan.description,
        "created_at": loan.created_at,
    }


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
    if "amount" in values and (
        values["amount"] is None or values["amount"] < 0
    ):
        raise HTTPException(
            status_code=400, detail="Loan amount cannot be negative"
        )
    if "outstanding" in values and (
        values["outstanding"] is None or values["outstanding"] < 0
    ):
        raise HTTPException(
            status_code=400, detail="Outstanding balance cannot be negative"
        )
    if "interest_rate" in values and (
        values["interest_rate"] is None or values["interest_rate"] < 0
    ):
        raise HTTPException(
            status_code=400, detail="Interest rate cannot be negative"
        )
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
        "user_name": loan.user.full_name if loan.user else "",
        "amount": loan.amount,
        "outstanding": loan.outstanding,
        "interest_rate": loan.interest_rate,
        "term": loan.term,
        "status": loan.status,
        "disbursed_date": loan.disbursed_date,
        "description": loan.description,
        "created_at": loan.created_at,
    }


@router.delete("/loans/{loan_id}", status_code=204)
def delete_loan(
    loan_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    db.delete(loan)
    db.commit()


@router.get(
    "/users/{user_id}/beneficiaries", response_model=list[BeneficiaryOut]
)
def list_user_beneficiaries(
    user_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if (
        not db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    ):
        raise HTTPException(status_code=404, detail="Customer not found")
    return (
        db.query(Beneficiary)
        .filter(Beneficiary.user_id == user_id)
        .order_by(Beneficiary.created_at.desc(), Beneficiary.id.desc())
        .all()
    )


@router.post(
    "/users/{user_id}/beneficiaries",
    response_model=BeneficiaryOut,
    status_code=201,
)
def create_user_beneficiary(
    user_id: int,
    payload: AdminBeneficiaryUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if (
        not db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    ):
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
    if payload.created_at is not None:
        beneficiary.created_at = payload.created_at
    db.add(beneficiary)
    db.commit()
    db.refresh(beneficiary)
    return beneficiary


@router.patch(
    "/beneficiaries/{beneficiary_id}", response_model=BeneficiaryOut
)
def update_beneficiary(
    beneficiary_id: int,
    payload: AdminBeneficiaryUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    beneficiary = (
        db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    )
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    values = payload.model_dump(exclude_unset=True)
    if "name" in values:
        values["name"] = (values["name"] or "").strip()
        if not values["name"]:
            raise HTTPException(
                status_code=400, detail="Beneficiary name is required"
            )
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
    beneficiary = (
        db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    )
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    db.delete(beneficiary)
    db.commit()


@router.get("/complaints")
def list_complaints(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    customer_requests = (
        db.query(Complaint).join(User).order_by(Complaint.created_at.desc()).all()
    )
    public_requests = (
        db.query(PublicSupportRequest)
        .order_by(PublicSupportRequest.created_at.desc())
        .all()
    )
    return [
        {
            "id": complaint.id,
            "user_id": complaint.user_id,
            "contact_name": complaint.user.full_name if complaint.user else None,
            "contact_email": complaint.user.email if complaint.user else None,
            "subject": complaint.subject,
            "message": complaint.message,
            "status": complaint.status,
            "created_at": complaint.created_at,
            "updated_at": complaint.updated_at,
        }
        for complaint in customer_requests
    ] + [
        {
            "id": request.id,
            "user_id": None,
            "contact_name": request.name,
            "contact_email": request.email,
            "subject": request.subject,
            "message": request.message,from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_admin
from ..database import get_db
from ..models import (
    Account,
    Beneficiary,
    Card,
    Complaint,
    Investment,
    Loan,
    LoginChallenge,
    PasswordResetToken,
    Payee,
    PublicSupportRequest,
    SecurityQuestion,
    Transaction,
    User,
    UserRole,
)
from ..schemas import (
    AdminAccountCreate,
    AdminAccountOut,
    AdminAccountUpdate,
    AdminBeneficiaryUpdate,
    AdminCardCreate,
    AdminCardOut,
    AdminCardUpdate,
    AdminInvestmentCreate,
    AdminInvestmentOut,
    AdminInvestmentUpdate,
    AdminLoanCreate,
    AdminLoanOut,
    AdminLoanUpdate,
    AdminSecurityQuestionsOut,
    AdminSecurityQuestionsUpdate,
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
    UserOut,
)

router = APIRouter()
TRANSACTION_STATUSES = {"processing", "completed", "failed", "reversed", "on_hold"}
LOAN_STATUSES = {"active", "pending", "paid", "defaulted"}
ACCOUNT_STATUSES = {"active", "frozen", "closed"}


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "address": user.address,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "total_balance": sum(account.balance or 0 for account in user.accounts),
    }


def serialize_security_question(question: SecurityQuestion) -> dict:
    return {"id": question.id, "question": question.question}


def serialize_account(account: Account) -> dict:
    return {
        "id": account.id,
        "user_id": account.user_id,
        "user_name": account.user.full_name if account.user else "",
        "account_number": account.account_number,
        "account_type": account.account_type,
        "balance": account.balance,
        "currency": account.currency,
        "status": account.status or "Active",
    }


def serialize_card(card: Card) -> dict:
    return {
        "id": card.id,
        "user_id": card.user_id,
        "user_name": card.user.full_name if card.user else "",
        "account_id": card.account_id,
        "account_type": card.account.account_type if card.account else "",
        "holder_name": card.holder_name,
        "last_four": card.last_four,
        "card_number": card.card_number,
        "expiry": card.expiry,
        "cvc": card.cvc,
        "network": card.network,
        "frozen": card.frozen,
        "created_at": card.created_at,
    }


def serialize_investment(investment: Investment) -> dict:
    return {
        "id": investment.id,
        "user_id": investment.user_id,
        "user_name": investment.user.full_name if investment.user else "",
        "symbol": investment.symbol,
        "name": investment.name,
        "asset_class": investment.asset_class,
        "units": investment.units,
        "average_cost": investment.average_cost,
        "current_price": investment.current_price,
        "market_value": investment.market_value,
        "cost_basis": investment.cost_basis,
        "daily_change": investment.daily_change,
        "total_return": investment.total_return,
        "allocation_percentage": investment.allocation_percentage,
        "currency": investment.currency,
        "created_at": investment.created_at,
    }


def serialize_transaction(transaction: Transaction) -> dict:
    return {
        "id": transaction.id,
        "user_id": transaction.user_id,
        "user_name": transaction.user.full_name if transaction.user else "",
        "account_id": transaction.account_id,
        "account_number": transaction.account.account_number if transaction.account else "",
        "amount": transaction.amount,
        "transaction_type": transaction.transaction_type,
        "status": transaction.status,
        "description": transaction.description,
        "reference": transaction.reference,
        "created_at": transaction.created_at,
    }


@router.get("/me", response_model=UserOut)
def admin_me(current_user: User = Depends(get_current_admin)):
    return current_user


@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .filter(User.role == UserRole.CUSTOMER)
        .order_by(User.created_at.desc())
        .all()
    )
    return [serialize_user(user) for user in users]


@router.post("/users", response_model=AdminUserOut, status_code=201)
def create_user(
    payload: AdminUserCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from ..auth import get_password_hash

    if (
        db.query(User)
        .filter(
            (User.email == payload.email) | (User.username == payload.username)
        )
        .first()
    ):
        raise HTTPException(
            status_code=400, detail="Email or username is already in use"
        )
    user = User(
        email=payload.email,
        username=payload.username.strip(),
        full_name=payload.full_name.strip(),
        address=payload.address.strip() if payload.address else None,
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
    user = (
        db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    values = payload.model_dump(exclude_unset=True)
    if (
        "email" in values
        and db.query(User)
        .filter(User.email == values["email"], User.id != user_id)
        .first()
    ):
        raise HTTPException(status_code=400, detail="Email is already in use")
    if (
        "username" in values
        and db.query(User)
        .filter(User.username == values["username"], User.id != user_id)
        .first()
    ):
        raise HTTPException(status_code=400, detail="Username is already in use")
    for key, value in values.items():
        if key == "created_at" and value is not None:
            if isinstance(value, str):
                try:
                    value = datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
                except Exception:
                    continue
            elif hasattr(value, "tzinfo"):
                value = value.replace(tzinfo=None)
            setattr(user, "created_at", value)
        else:
            setattr(user, key, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    account_ids = [
        account.id
        for account in db.query(Account.id).filter(Account.user_id == user_id).all()
    ]
    if account_ids:
        db.query(Transaction).filter(
            Transaction.account_id.in_(account_ids)
        ).delete(synchronize_session=False)
    db.query(Transaction).filter(Transaction.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Card).filter(Card.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Loan).filter(Loan.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Beneficiary).filter(Beneficiary.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Payee).filter(Payee.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Investment).filter(Investment.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Complaint).filter(Complaint.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id
    ).delete(synchronize_session=False)
    db.query(SecurityQuestion).filter(SecurityQuestion.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(LoginChallenge).filter(LoginChallenge.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(Account).filter(Account.user_id == user_id).delete(
        synchronize_session=False
    )
    db.delete(user)
    db.commit()


@router.get(
    "/users/{user_id}/security-questions",
    response_model=AdminSecurityQuestionsOut,
)
def get_security_questions(
    user_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    questions = (
        db.query(SecurityQuestion)
        .filter(SecurityQuestion.user_id == user_id)
        .order_by(SecurityQuestion.position.asc(), SecurityQuestion.id.asc())
        .all()
    )
    return {
        "questions": [
            serialize_security_question(question) for question in questions
        ]
    }


@router.put(
    "/users/{user_id}/security-questions",
    response_model=AdminSecurityQuestionsOut,
)
def replace_security_questions(
    user_id: int,
    payload: AdminSecurityQuestionsUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from ..auth import get_password_hash

    user = (
        db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    normalized_questions = [
        (item.question.strip(), item.answer.strip()) for item in payload.questions
    ]
    if len({
        question.casefold() for question, _ in normalized_questions
    }) != len(normalized_questions):
        raise HTTPException(
            status_code=400, detail="Security questions must be unique"
        )
    if any(
        not question or not answer for question, answer in normalized_questions
    ):
        raise HTTPException(
            status_code=400, detail="Security questions and answers are required"
        )

    db.query(SecurityQuestion).filter(SecurityQuestion.user_id == user_id).delete(
        synchronize_session=False
    )
    for position, (question, answer) in enumerate(normalized_questions):
        db.add(
            SecurityQuestion(
                user_id=user_id,
                question=question,
                answer_hash=get_password_hash(answer.casefold()),
                position=position,
            )
        )
    db.commit()
    questions = (
        db.query(SecurityQuestion)
        .filter(SecurityQuestion.user_id == user_id)
        .order_by(SecurityQuestion.position.asc(), SecurityQuestion.id.asc())
        .all()
    )
    return {
        "questions": [
            serialize_security_question(question) for question in questions
        ]
    }


@router.get("/accounts", response_model=list[AdminAccountOut])
def list_accounts(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    accounts = db.query(Account).join(User).order_by(Account.id).all()
    return [serialize_account(account) for account in accounts]


@router.post("/accounts", response_model=AdminAccountOut, status_code=201)
def create_account(
    payload: AdminAccountCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    account_type = payload.account_type.strip().lower()
    currency = payload.currency.strip().upper()
    status = payload.status.strip().lower()
    if status not in ACCOUNT_STATUSES:
        raise HTTPException(
            status_code=400, detail="Status must be active, frozen, or closed"
        )
    account_number = (payload.account_number or "").strip() or (
        f"TEL-{uuid4().hex[:12].upper()}"
    )
    if db.query(Account).filter(Account.account_number == account_number).first():
        raise HTTPException(
            status_code=400, detail="Account number is already in use"
        )
    account = Account(
        user_id=user.id,
        account_number=account_number,
        account_type=account_type,
        balance=payload.balance,
        currency=currency,
        status=status.title(),
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return serialize_account(account)


@router.patch("/accounts/{account_id}", response_model=AdminAccountOut)
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
    if "account_number" in values:
        account_number = (values["account_number"] or "").strip()
        if not account_number:
            raise HTTPException(status_code=400, detail="Account number is required")
        if (
            db.query(Account)
            .filter(
                Account.account_number == account_number, Account.id != account_id
            )
            .first()
        ):
            raise HTTPException(
                status_code=400, detail="Account number is already in use"
            )
        account.account_number = account_number
    if "account_type" in values:
        account.account_type = (values["account_type"] or "").strip().lower()
    if "balance" in values and values["balance"] is not None:
        account.balance = float(values["balance"])
    if "currency" in values:
        account.currency = (values["currency"] or "").strip().upper()
    if "status" in values:
        status = (values["status"] or "").strip().lower()
        if status not in ACCOUNT_STATUSES:
            raise HTTPException(
                status_code=400, detail="Status must be active, frozen, or closed"
            )
        account.status = status.title()
    db.commit()
    db.refresh(account)
    return serialize_account(account)


@router.delete("/accounts/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.query(Transaction).filter(Transaction.account_id == account_id).delete(
        synchronize_session=False
    )
    db.query(Card).filter(Card.account_id == account_id).delete(
        synchronize_session=False
    )
    db.delete(account)
    db.commit()


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
        raise HTTPException(
            status_code=400, detail="Merchant and category are required"
        )
    if payload.amount <= 0:
        raise HTTPException(
            status_code=400, detail="Amount must be greater than zero"
        )
    if direction not in {"debit", "credit"}:
        raise HTTPException(
            status_code=400, detail="Direction must be debit or credit"
        )
    if next_status not in TRANSACTION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Status must be processing, completed, failed, reversed, or on_hold"
            ),
        )

    user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    account = (
        db.query(Account)
        .filter(
            Account.id == payload.account_id, Account.user_id == payload.user_id
        )
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=404, detail="Account does not belong to this customer"
        )

    signed_amount = (
        abs(payload.amount) if direction == "credit" else -abs(payload.amount)
    )
    transaction_values = {
        "user_id": user.id,
        "account_id": account.id,
        "amount": signed_amount,
        "transaction_type": "deposit" if direction == "credit" else "withdrawal",
        "status": next_status,
        "description": f"{merchant} · {category}",
        "reference": (
            payload.reference.strip()
            if payload.reference and payload.reference.strip()
            else f"ADM-{uuid4().hex[:12].upper()}"
        ),
    }
    if payload.created_at:
        raw_date = payload.created_at
        if isinstance(raw_date, str):
            try:
                raw_date = datetime.fromisoformat(raw_date.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                pass
        elif hasattr(raw_date, "tzinfo"):
            raw_date = raw_date.replace(tzinfo=None)
        transaction_values["created_at"] = raw_date

    account.balance += signed_amount
    transaction = Transaction(**transaction_values)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return serialize_transaction(transaction)


@router.patch(
    "/transactions/{transaction_id}", response_model=AdminTransactionOut
)
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
    next_user_id = values.get("user_id", transaction.user_id)
    next_account_id = values.get("account_id", transaction.account_id)
    next_user = (
        db.query(User)
        .filter(User.id == next_user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not next_user:
        raise HTTPException(status_code=404, detail="Customer not found")
    next_account = (
        db.query(Account)
        .filter(
            Account.id == next_account_id,
            Account.user_id == next_user_id,
        )
        .first()
    )
    if not next_account:
        raise HTTPException(
            status_code=404, detail="Account does not belong to this customer"
        )
    if "amount" in values and values["amount"] is None:
        raise HTTPException(status_code=400, detail="Transaction amount is required")
    if "transaction_type" in values:
        values["transaction_type"] = (
            values["transaction_type"] or ""
        ).strip().lower()
        if not values["transaction_type"]:
            raise HTTPException(
                status_code=400, detail="Transaction type is required"
            )
    if "description" in values:
        values["description"] = (values["description"] or "").strip()
        if not values["description"]:
            raise HTTPException(
                status_code=400, detail="Transaction description is required"
            )
    if "reference" in values:
        values["reference"] = (values["reference"] or "").strip()
        if not values["reference"]:
            raise HTTPException(
                status_code=400, detail="Transaction reference is required"
            )
    if "status" in values:
        next_status = values["status"].strip().lower()
        if next_status not in TRANSACTION_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Status must be processing, completed, failed, reversed, or"
                    " on_hold"
                ),
            )
        for linked_transaction in (
            db.query(Transaction)
            .filter(Transaction.reference == transaction.reference)
            .all()
        ):
            linked_transaction.status = next_status
        transaction.status = next_status

    if "created_at" in values and values["created_at"] is not None:
        raw_date = values["created_at"]
        if isinstance(raw_date, str):
            try:
                values["created_at"] = datetime.fromisoformat(raw_date.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                pass
        elif hasattr(raw_date, "tzinfo"):
            values["created_at"] = raw_date.replace(tzinfo=None)

    old_amount = transaction.amount
    old_account = transaction.account
    next_amount = values.get("amount", old_amount)
    if next_amount is None:
        raise HTTPException(status_code=400, detail="Transaction amount is required")
    if next_account.id != old_account.id:
        old_account.balance -= old_amount
        next_account.balance += next_amount
    else:
        next_account.balance += next_amount - old_amount
    transaction.user_id = next_user.id
    transaction.account_id = next_account.id
    for key in (
        "amount",
        "transaction_type",
        "description",
        "reference",
        "created_at",
    ):
        if key in values and values[key] is not None:
            setattr(transaction, key, values[key])

    db.commit()
    db.refresh(transaction)
    return serialize_transaction(transaction)


@router.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    transaction = (
        db.query(Transaction).filter(Transaction.id == transaction_id).first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    linked_transactions = (
        db.query(Transaction)
        .filter(Transaction.reference == transaction.reference)
        .all()
    )
    for linked_transaction in linked_transactions:
        linked_transaction.account.balance -= linked_transaction.amount
        db.delete(linked_transaction)
    db.commit()


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


@router.patch(
    "/transactions/{transaction_id}/status", response_model=AdminTransactionOut
)
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
            detail=(
                "Status must be processing, completed, failed, reversed, or on_hold"
            ),
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

    linked_transactions = (
        db.query(Transaction)
        .filter(Transaction.reference == transaction.reference)
        .all()
    )
    for linked_transaction in linked_transactions:
        linked_transaction.status = next_status
    db.commit()
    db.refresh(transaction)
    return serialize_transaction(transaction)


@router.get("/cards", response_model=list[AdminCardOut])
def list_cards(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return [
        serialize_card(card)
        for card in db.query(Card)
        .join(Account)
        .join(User)
        .order_by(Card.id)
        .all()
    ]


@router.post("/cards", response_model=AdminCardOut, status_code=201)
def create_card(
    payload: AdminCardCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    account = (
        db.query(Account)
        .filter(Account.id == payload.account_id, Account.user_id == user.id)
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=400, detail="Account does not belong to this customer"
        )
    card_number = "".join(payload.card_number.split())
    cvc = "".join(payload.cvc.split())
    if not card_number.isdigit() or not 12 <= len(card_number) <= 19:
        raise HTTPException(
            status_code=400, detail="Card number must contain 12 to 19 digits"
        )
    if not cvc.isdigit() or len(cvc) not in {3, 4}:
        raise HTTPException(
            status_code=400, detail="CVC must contain 3 or 4 digits"
        )
    card = Card(
        user_id=user.id,
        account_id=account.id,
        holder_name=payload.holder_name.strip(),
        last_four=card_number[-4:],
        card_number=card_number,
        expiry=payload.expiry.strip(),
        cvc=cvc,
        network=payload.network.strip(),
        frozen=payload.frozen,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return serialize_card(card)


@router.patch("/cards/{card_id}/freeze", response_model=AdminCardOut)
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
    return serialize_card(card)


@router.patch("/cards/{card_id}", response_model=AdminCardOut)
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
    if "account_id" in values:
        account = db.query(Account).filter(Account.id == values["account_id"]).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        card.account_id = account.id
        card.user_id = account.user_id
    if "holder_name" in values:
        holder_name = (values["holder_name"] or "").strip()
        if not holder_name:
            raise HTTPException(status_code=400, detail="Card holder name is required")
        card.holder_name = holder_name
    if "card_number" in values:
        card_number = "".join((values["card_number"] or "").split())
        if not card_number.isdigit() or not 12 <= len(card_number) <= 19:
            raise HTTPException(
                status_code=400, detail="Card number must contain 12 to 19 digits"
            )
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
            raise HTTPException(
                status_code=400, detail="CVC must contain 3 or 4 digits"
            )
        card.cvc = cvc
    if "network" in values:
        network = (values["network"] or "").strip()
        if not network:
            raise HTTPException(status_code=400, detail="Card network is required")
        card.network = network
    if "frozen" in values:
        card.frozen = values["frozen"]

    db.commit()
    db.refresh(card)
    return serialize_card(card)


@router.delete("/cards/{card_id}", status_code=204)
def delete_card(
    card_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()


@router.get("/investments", response_model=list[AdminInvestmentOut])
def list_investments(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    investments = (
        db.query(Investment)
        .join(User)
        .order_by(Investment.created_at.desc(), Investment.id.desc())
        .all()
    )
    return [serialize_investment(investment) for investment in investments]


@router.post("/investments", response_model=AdminInvestmentOut, status_code=201)
def create_investment(
    payload: AdminInvestmentCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    investment = Investment(
        user_id=user.id,
        symbol=payload.symbol.strip().upper(),
        name=payload.name.strip(),
        asset_class=payload.asset_class.strip(),
        units=payload.units,
        average_cost=payload.average_cost,
        current_price=payload.current_price,
        market_value=payload.market_value,
        cost_basis=payload.cost_basis,
        daily_change=payload.daily_change,
        total_return=payload.total_return,
        allocation_percentage=payload.allocation_percentage,
        currency=payload.currency.strip().upper(),
    )
    db.add(investment)
    db.commit()
    db.refresh(investment)
    return serialize_investment(investment)


@router.patch(
    "/investments/{investment_id}", response_model=AdminInvestmentOut
)
def update_investment(
    investment_id: int,
    payload: AdminInvestmentUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    investment = (
        db.query(Investment).filter(Investment.id == investment_id).first()
    )
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    values = payload.model_dump(exclude_unset=True)
    if "user_id" in values:
        user = (
            db.query(User)
            .filter(User.id == values["user_id"], User.role == UserRole.CUSTOMER)
            .first()
        )
        if not user:
            raise HTTPException(status_code=404, detail="Customer not found")
        investment.user_id = user.id
    for key, value in values.items():
        if key == "user_id":
            continue
        if isinstance(value, str):
            value = value.strip()
            if key == "symbol":
                value = value.upper()
            if key == "currency":
                value = value.upper()
        setattr(investment, key, value)
    db.commit()
    db.refresh(investment)
    return serialize_investment(investment)


@router.delete("/investments/{investment_id}", status_code=204)
def delete_investment(
    investment_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    investment = (
        db.query(Investment).filter(Investment.id == investment_id).first()
    )
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    db.delete(investment)
    db.commit()


@router.get("/dashboard")
def get_dashboard(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    customers = db.query(User).filter(User.role == UserRole.CUSTOMER).all()
    accounts = db.query(Account).all()
    investments = db.query(Investment).all()
    loans = db.query(Loan).all()
    cards = db.query(Card).all()
    transactions = (
        db.query(Transaction)
        .join(User, Transaction.user_id == User.id)
        .join(Account, Transaction.account_id == Account.id)
        .order_by(Transaction.created_at.desc(), Transaction.id.desc())
        .limit(8)
        .all()
    )
    account_assets = sum(account.balance or 0 for account in accounts)
    investment_assets = sum(
        investment.market_value or 0 for investment in investments
    )
    return {
        "total_users": len(customers),
        "active_users": sum(1 for user in customers if user.is_active),
        "total_accounts": len(accounts),
        "active_accounts": sum(
            1
            for account in accounts
            if (account.status or "Active").lower() == "active"
        ),
        "total_cards": len(cards),
        "active_cards": sum(1 for card in cards if not card.frozen),
        "active_loans": sum(1 for loan in loans if loan.status == "active"),
        "total_assets": round(account_assets + investment_assets, 2),
        "total_account_balances": round(account_assets, 2),
        "total_investment_value": round(investment_assets, 2),
        "pending_transactions": sum(
            1
            for transaction in db.query(Transaction).all()
            if transaction.status in {"processing", "on_hold"}
        ),
        "failed_transactions": sum(
            1
            for transaction in db.query(Transaction).all()
            if transaction.status == "failed"
        ),
        "recent_transactions": [
            serialize_transaction(transaction) for transaction in transactions
        ],
    }


@router.get("/loans", response_model=list[AdminLoanOut])
def list_loans(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    loans = (
        db.query(Loan)
        .join(User)
        .order_by(Loan.disbursed_date.desc(), Loan.id.desc())
        .all()
    )
    return [
        {
            "id": loan.id,
            "user_id": loan.user_id,
            "user_name": loan.user.full_name if loan.user else "",
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


@router.post("/loans", response_model=AdminLoanOut, status_code=201)
def create_loan(
    payload: AdminLoanCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.role == UserRole.CUSTOMER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    if payload.amount < 0 or payload.outstanding < 0 or payload.interest_rate < 0:
        raise HTTPException(
            status_code=400, detail="Loan values cannot be negative"
        )
    status = payload.status.strip().lower()
    if status not in LOAN_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid loan status")
    term = payload.term.strip()
    if not term:
        raise HTTPException(status_code=400, detail="Loan term is required")
    loan = Loan(
        user_id=user.id,
        amount=payload.amount,
        outstanding=payload.outstanding,
        interest_rate=payload.interest_rate,
        term=term,
        status=status,
        disbursed_date=payload.disbursed_date,
        description=(payload.description or "").strip() or None,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return {
        "id": loan.id,
        "user_id": loan.user_id,
        "user_name": loan.user.full_name if loan.user else "",
        "amount": loan.amount,
        "outstanding": loan.outstanding,
        "interest_rate": loan.interest_rate,
        "term": loan.term,
        "status": loan.status,
        "disbursed_date": loan.disbursed_date,
        "description": loan.description,
        "created_at": loan.created_at,
    }


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
    if "amount" in values and (
        values["amount"] is None or values["amount"] < 0
    ):
        raise HTTPException(
            status_code=400, detail="Loan amount cannot be negative"
        )
    if "outstanding" in values and (
        values["outstanding"] is None or values["outstanding"] < 0
    ):
        raise HTTPException(
            status_code=400, detail="Outstanding balance cannot be negative"
        )
    if "interest_rate" in values and (
        values["interest_rate"] is None or values["interest_rate"] < 0
    ):
        raise HTTPException(
            status_code=400, detail="Interest rate cannot be negative"
        )
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
        "user_name": loan.user.full_name if loan.user else "",
        "amount": loan.amount,
        "outstanding": loan.outstanding,
        "interest_rate": loan.interest_rate,
        "term": loan.term,
        "status": loan.status,
        "disbursed_date": loan.disbursed_date,
        "description": loan.description,
        "created_at": loan.created_at,
    }


@router.delete("/loans/{loan_id}", status_code=204)
def delete_loan(
    loan_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    db.delete(loan)
    db.commit()


@router.get(
    "/users/{user_id}/beneficiaries", response_model=list[BeneficiaryOut]
)
def list_user_beneficiaries(
    user_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if (
        not db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    ):
        raise HTTPException(status_code=404, detail="Customer not found")
    return (
        db.query(Beneficiary)
        .filter(Beneficiary.user_id == user_id)
        .order_by(Beneficiary.created_at.desc(), Beneficiary.id.desc())
        .all()
    )


@router.post(
    "/users/{user_id}/beneficiaries",
    response_model=BeneficiaryOut,
    status_code=201,
)
def create_user_beneficiary(
    user_id: int,
    payload: AdminBeneficiaryUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if (
        not db.query(User)
        .filter(User.id == user_id, User.role == UserRole.CUSTOMER)
        .first()
    ):
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
    if payload.created_at is not None:
        beneficiary.created_at = payload.created_at
    db.add(beneficiary)@router.patch("/accounts/{account_id}", response_model=AdminAccountOut)
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
    if "account_number" in values:
        account_number = (values["account_number"] or "").strip()
        if not account_number:
            raise HTTPException(status_code=400, detail="Account number is required")
        if db.query(Account).filter(Account.account_number == account_number, Account.id != account_id).first():
            raise HTTPException(status_code=400, detail="Account number is already in use")
        account.account_number = account_number
    if "account_type" in values:
        account.account_type = (values["account_type"] or "").strip().lower()
    if "balance" in values and values["balance"] is not None:
        account.balance = float(values["balance"])
    if "currency" in values:
        account.currency = (values["currency"] or "").strip().upper()
    if "status" in values:
        status = (values["status"] or "").strip().lower()
        if status not in ACCOUNT_STATUSES:
            raise HTTPException(status_code=400, detail="Status must be active, frozen, or closed")
        account.status = status.title()
    db.commit()
    db.refresh(account)
    return serialize_account(account)


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
    next_user_id = values.get("user_id", transaction.user_id)
    next_account_id = values.get("account_id", transaction.account_id)
    next_user = db.query(User).filter(User.id == next_user_id, User.role == UserRole.CUSTOMER).first()
    if not next_user:
        raise HTTPException(status_code=404, detail="Customer not found")
    next_account = db.query(Account).filter(
        Account.id == next_account_id,
        Account.user_id == next_user_id,
    ).first()
    if not next_account:
        raise HTTPException(status_code=404, detail="Account does not belong to this customer")
    if "amount" in values and values["amount"] is None:
        raise HTTPException(status_code=400, detail="Transaction amount is required")
    if "transaction_type" in values:
        values["transaction_type"] = (values["transaction_type"] or "").strip().lower()
        if not values["transaction_type"]:
            raise HTTPException(status_code=400, detail="Transaction type is required")
    if "description" in values:
        values["description"] = (values["description"] or "").strip()
        if not values["description"]:
            raise HTTPException(status_code=400, detail="Transaction description is required")
    if "reference" in values:
        values["reference"] = (values["reference"] or "").strip()
        if not values["reference"]:
            raise HTTPException(status_code=400, detail="Transaction reference is required")
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
        transaction.status = next_status

    if "created_at" in values and values["created_at"] is not None:
        raw_date = values["created_at"]
        if isinstance(raw_date, str):
            try:
                values["created_at"] = datetime.fromisoformat(raw_date.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                pass
        elif hasattr(raw_date, "tzinfo"):
            values["created_at"] = raw_date.replace(tzinfo=None)

    old_amount = transaction.amount
    old_account = transaction.account
    next_amount = values.get("amount", old_amount)
    if next_amount is None:
        raise HTTPException(status_code=400, detail="Transaction amount is required")
    if next_account.id != old_account.id:
        old_account.balance -= old_amount
        next_account.balance += next_amount
    else:
        next_account.balance += next_amount - old_amount
    transaction.user_id = next_user.id
    transaction.account_id = next_account.id
    for key in ("amount", "transaction_type", "description", "reference", "created_at"):
        if key in values and values[key] is not None:
            setattr(transaction, key, values[key])

    db.commit()
    db.refresh(transaction)
    return serialize_transaction(transaction)
    db.commit()
    db.refresh(beneficiary)
    return beneficiary


@router.patch(
    "/beneficiaries/{beneficiary_id}", response_model=BeneficiaryOut
)
def update_beneficiary(
    beneficiary_id: int,
    payload: AdminBeneficiaryUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    beneficiary = (
        db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    )
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    values = payload.model_dump(exclude_unset=True)
    if "name" in values:
        values["name"] = (values["name"] or "").strip()
        if not values["name"]:
            raise HTTPException(
                status_code=400, detail="Beneficiary name is required"
            )
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
    beneficiary = (
        db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    )
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    db.delete(beneficiary)
    db.commit()


@router.get("/complaints")
def list_complaints(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    customer_requests = (
        db.query(Complaint).join(User).order_by(Complaint.created_at.desc()).all()
    )
    public_requests = (
        db.query(PublicSupportRequest)
        .order_by(PublicSupportRequest.created_at.desc())
        .all()
    )
    return [
        {
            "id": complaint.id,
            "user_id": complaint.user_id,
            "contact_name": complaint.user.full_name if complaint.user else None,
            "contact_email": complaint.user.email if complaint.user else None,
            "subject": complaint.subject,
            "message": complaint.message,
            "status": complaint.status,
            "created_at": complaint.created_at,
            "updated_at": complaint.updated_at,
        }
        for complaint in customer_requests
    ] + [
        {
            "id": request.id,
            "user_id": None,
            "contact_name": request.name,
            "contact_email": request.email,
            "subject": request.subject,
            "message": request.message,
            "status": request.status,
            "created_at": request.created_at,
            "updated_at": None,
        }
        for request in public_requests
    ]
            "status": request.status,
            "created_at": request.created_at,
            "updated_at": None,
        }
        for request in public_requests
    ]