from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_admin
from ..database import get_db
from ..models import Account, Card, Complaint, User, UserRole
from ..schemas import AdminAccountUpdate, AdminUserCreate, AdminUserOut, AdminUserUpdate, CardOut, ComplaintOut

router = APIRouter()


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