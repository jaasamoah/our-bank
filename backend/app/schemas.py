from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from .models import UserRole

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: UserRole = UserRole.CUSTOMER

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None


class InvestmentOut(BaseModel):
    id: int
    symbol: str
    name: str
    asset_class: str
    units: float
    average_cost: float
    current_price: float
    market_value: float
    cost_basis: float
    daily_change: float
    total_return: float
    allocation_percentage: float
    currency: str
    created_at: datetime

    class Config:
        from_attributes = True


class InvestmentSummary(BaseModel):
    total_value: float
    total_cost: float
    total_gain: float
    gain_percentage: float
    daily_change: float
    currency: str


class InvestmentPortfolioOut(BaseModel):
    summary: InvestmentSummary
    holdings: list[InvestmentOut]


class CardOut(BaseModel):
    id: int
    account_id: int
    holder_name: str
    last_four: str
    expiry: str
    network: str
    frozen: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TransferRequest(BaseModel):
    from_account_id: int
    to_account_id: Optional[int] = None
    payee_id: Optional[int] = None
    payee_name: Optional[str] = None
    amount: float
    note: Optional[str] = None


class TransferOut(BaseModel):
    message: str
    amount: float
    from_account_id: int
    to_account_id: Optional[int] = None
    transaction_ids: list[int]


class PayeeCreate(BaseModel):
    name: str
    bank: str
    account_number: str


class PayeeOut(BaseModel):
    id: int
    name: str
    bank: str
    account_number: str
    created_at: datetime

    class Config:
        from_attributes = True


class PasswordResetRequest(BaseModel):
    identifier: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class PasswordResetResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None


class ComplaintCreate(BaseModel):
    subject: str
    message: str


class ComplaintOut(BaseModel):
    id: int
    subject: str
    message: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminUserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str


class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class AdminUserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    total_balance: float

    class Config:
        from_attributes = True


class AdminAccountUpdate(BaseModel):
    balance: Optional[float] = None
    status: Optional[str] = None