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
    card_number: Optional[str] = None
    expiry: str
    cvc: Optional[str] = None
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
    iban: Optional[str] = None
    swift_code: Optional[str] = None
    password: str


class PasswordConfirmation(BaseModel):
    password: str


class PayeeOut(BaseModel):
    id: int
    name: str
    bank: str
    account_number: str
    iban: Optional[str] = None
    swift_code: Optional[str] = None
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


class PublicSupportRequestCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


class PublicSupportRequestOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    subject: str
    message: str
    status: str
    created_at: datetime

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
    created_at: Optional[datetime] = None


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


class AdminTransactionOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    account_id: int
    account_number: str
    amount: float
    transaction_type: str
    status: str
    description: str
    reference: str
    created_at: datetime


class AdminTransactionStatusUpdate(BaseModel):
    status: str


class AdminTransactionUpdate(BaseModel):
    user_id: Optional[int] = None
    account_id: Optional[int] = None
    amount: Optional[float] = None
    transaction_type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    reference: Optional[str] = None
    created_at: Optional[datetime] = None


class AdminTransactionCreate(BaseModel):
    user_id: int
    account_id: int
    merchant: str
    category: str
    amount: float
    direction: str
    status: str = "processing"
    reference: Optional[str] = None
    created_at: Optional[datetime] = None


class AdminCardUpdate(BaseModel):
    holder_name: Optional[str] = None
    card_number: Optional[str] = None
    expiry: Optional[str] = None
    cvc: Optional[str] = None


class LoanOut(BaseModel):
    id: int
    amount: float
    outstanding: float
    interest_rate: float
    term: str
    status: str
    disbursed_date: Optional[datetime] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminLoanOut(LoanOut):
    user_id: int
    user_name: str


class AdminLoanUpdate(BaseModel):
    amount: Optional[float] = None
    outstanding: Optional[float] = None
    interest_rate: Optional[float] = None
    term: Optional[str] = None
    status: Optional[str] = None
    disbursed_date: Optional[datetime] = None
    description: Optional[str] = None


class AdminLoanCreate(BaseModel):
    user_id: int
    amount: float
    outstanding: float
    interest_rate: float
    term: str
    status: str = "pending"
    disbursed_date: Optional[datetime] = None
    description: Optional[str] = None


class BeneficiaryCreate(BaseModel):
    name: str
    relationship: Optional[str] = None
    bank: Optional[str] = None
    account_number: Optional[str] = None
    notes: Optional[str] = None


class BeneficiaryOut(BeneficiaryCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AdminBeneficiaryUpdate(BeneficiaryCreate):
    created_at: Optional[datetime] = None