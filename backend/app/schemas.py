from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from .models import UserRole


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)


class UserBase(StrictModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=64, pattern=r"^[A-Za-z0-9_.-]+$")
    full_name: str = Field(min_length=1, max_length=120)
    role: UserRole = UserRole.CUSTOMER


class UserCreate(UserBase):
    password: str = Field(min_length=12, max_length=128)


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(StrictModel):
    access_token: Optional[str] = None
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


class TransferRequest(StrictModel):
    from_account_id: int
    to_account_id: Optional[int] = None
    payee_id: Optional[int] = None
    payee_name: Optional[str] = None
    amount: float = Field(gt=0, le=1_000_000)
    note: Optional[str] = Field(default=None, max_length=500)


class TransferOut(BaseModel):
    message: str
    amount: float
    from_account_id: int
    to_account_id: Optional[int] = None
    transaction_ids: list[int]


class PayeeCreate(StrictModel):
    name: str = Field(min_length=1, max_length=120)
    bank: str = Field(min_length=1, max_length=120)
    account_number: str = Field(min_length=4, max_length=64)
    iban: str = Field(min_length=8, max_length=64)
    swift_code: str = Field(min_length=8, max_length=16)
    password: str = Field(min_length=1, max_length=128)


class PasswordConfirmation(StrictModel):
    password: str = Field(min_length=1, max_length=128)


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


class PasswordResetRequest(StrictModel):
    identifier: str = Field(min_length=3, max_length=254)


class PasswordResetConfirm(StrictModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=12, max_length=128)


class PasswordResetResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None


class SecurityQuestionAnswer(StrictModel):
    question_id: int
    answer: str = Field(min_length=1, max_length=200)


class LoginSecurityVerification(StrictModel):
    challenge_token: str = Field(min_length=32, max_length=256)
    answers: list[SecurityQuestionAnswer] = Field(min_length=1, max_length=5)


class LoginOtpVerification(StrictModel):
    challenge_token: str = Field(min_length=32, max_length=256)
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class SecurityQuestionOut(BaseModel):
    id: int
    question: str


class LoginChallengeResponse(BaseModel):
    stage: str
    challenge_token: str
    questions: list[SecurityQuestionOut] = []
    message: Optional[str] = None


class ComplaintCreate(StrictModel):
    subject: str = Field(min_length=1, max_length=160)
    message: str = Field(min_length=1, max_length=5000)


class ComplaintOut(BaseModel):
    id: int
    subject: str
    message: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PublicSupportRequestCreate(StrictModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=160)
    message: str = Field(min_length=1, max_length=5000)


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


class AdminUserCreate(StrictModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=64, pattern=r"^[A-Za-z0-9_.-]+$")
    full_name: str = Field(min_length=1, max_length=120)
    address: Optional[str] = Field(default=None, max_length=500)
    password: str = Field(min_length=12, max_length=128)


class AdminUserUpdate(StrictModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    address: Optional[str] = Field(default=None, max_length=500)
    is_active: Optional[bool] = None
    created_at: Optional[Union[datetime, str]] = None


class AdminUserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: str
    address: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    total_balance: float

    class Config:
        from_attributes = True


class AdminSecurityQuestionInput(StrictModel):
    question: str = Field(min_length=5, max_length=200)
    answer: str = Field(min_length=1, max_length=200)


class AdminSecurityQuestionsUpdate(StrictModel):
    questions: list[AdminSecurityQuestionInput] = Field(min_length=2, max_length=3)


class AdminSecurityQuestionsOut(BaseModel):
    questions: list[SecurityQuestionOut]


class AdminAccountCreate(StrictModel):
    user_id: int
    account_number: Optional[str] = Field(default=None, min_length=4, max_length=64)
    account_type: str = Field(min_length=1, max_length=64)
    balance: float = Field(default=0, ge=-1_000_000_000, le=1_000_000_000)
    currency: str = Field(default="USD", min_length=3, max_length=8)
    status: str = Field(default="Active", min_length=1, max_length=32)


class AdminAccountUpdate(StrictModel):
    account_number: Optional[str] = Field(default=None, min_length=4, max_length=64)
    account_type: Optional[str] = Field(default=None, min_length=1, max_length=64)
    balance: Optional[float] = Field(default=None, ge=-1_000_000_000, le=1_000_000_000)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=8)
    status: Optional[str] = Field(default=None, max_length=32)


class AdminAccountOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    account_number: str
    account_type: str
    balance: float
    currency: str
    status: str


class AdminCardCreate(StrictModel):
    user_id: int
    account_id: int
    holder_name: str = Field(min_length=1, max_length=120)
    card_number: str = Field(min_length=12, max_length=19)
    expiry: str = Field(min_length=4, max_length=10)
    cvc: str = Field(min_length=3, max_length=4)
    network: str = Field(min_length=2, max_length=32)
    frozen: bool = False


class AdminCardUpdate(StrictModel):
    account_id: Optional[int] = None
    holder_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    card_number: Optional[str] = Field(default=None, min_length=12, max_length=19)
    expiry: Optional[str] = Field(default=None, min_length=4, max_length=10)
    cvc: Optional[str] = Field(default=None, min_length=3, max_length=4)
    network: Optional[str] = Field(default=None, min_length=2, max_length=32)
    frozen: Optional[bool] = None


class AdminCardOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    account_id: int
    account_type: str
    holder_name: str
    last_four: str
    card_number: Optional[str] = None
    expiry: str
    cvc: Optional[str] = None
    network: str
    frozen: bool
    created_at: datetime


class AdminInvestmentCreate(StrictModel):
    user_id: int
    symbol: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=160)
    asset_class: str = Field(min_length=1, max_length=80)
    units: float = Field(ge=0, le=1_000_000_000)
    average_cost: float = Field(ge=0, le=1_000_000_000)
    current_price: float = Field(ge=0, le=1_000_000_000)
    market_value: float = Field(ge=0, le=1_000_000_000)
    cost_basis: float = Field(ge=0, le=1_000_000_000)
    daily_change: float = Field(ge=-1_000_000_000, le=1_000_000_000)
    total_return: float = Field(ge=-1_000_000_000, le=1_000_000_000)
    allocation_percentage: float = Field(ge=0, le=100)
    currency: str = Field(default="USD", min_length=3, max_length=8)


class AdminInvestmentUpdate(StrictModel):
    user_id: Optional[int] = None
    symbol: Optional[str] = Field(default=None, min_length=1, max_length=32)
    name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    asset_class: Optional[str] = Field(default=None, min_length=1, max_length=80)
    units: Optional[float] = Field(default=None, ge=0, le=1_000_000_000)
    average_cost: Optional[float] = Field(default=None, ge=0, le=1_000_000_000)
    current_price: Optional[float] = Field(default=None, ge=0, le=1_000_000_000)
    market_value: Optional[float] = Field(default=None, ge=0, le=1_000_000_000)
    cost_basis: Optional[float] = Field(default=None, ge=0, le=1_000_000_000)
    daily_change: Optional[float] = Field(default=None, ge=-1_000_000_000, le=1_000_000_000)
    total_return: Optional[float] = Field(default=None, ge=-1_000_000_000, le=1_000_000_000)
    allocation_percentage: Optional[float] = Field(default=None, ge=0, le=100)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=8)


class AdminInvestmentOut(InvestmentOut):
    user_id: int
    user_name: str


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


class AdminTransactionStatusUpdate(StrictModel):
    status: str = Field(min_length=1, max_length=32)


class AdminTransactionUpdate(StrictModel):
    user_id: Optional[int] = None
    account_id: Optional[int] = None
    amount: Optional[float] = None
    transaction_type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    reference: Optional[str] = None
    created_at: Optional[Union[datetime, str]] = None


class AdminTransactionCreate(StrictModel):
    user_id: int
    account_id: int
    merchant: str = Field(min_length=1, max_length=160)
    category: str = Field(min_length=1, max_length=80)
    amount: float = Field(gt=0, le=1_000_000_000)
    direction: str = Field(min_length=1, max_length=16)
    status: str = Field(default="processing", max_length=32)
    reference: Optional[str] = Field(default=None, max_length=120)
    created_at: Optional[Union[datetime, str]] = None


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


class AdminLoanUpdate(StrictModel):
    amount: Optional[float] = None
    outstanding: Optional[float] = None
    interest_rate: Optional[float] = None
    term: Optional[str] = None
    status: Optional[str] = None
    disbursed_date: Optional[Union[datetime, str]] = None
    description: Optional[str] = None


class AdminLoanCreate(StrictModel):
    user_id: int
    amount: float = Field(ge=0, le=1_000_000_000)
    outstanding: float = Field(ge=0, le=1_000_000_000)
    interest_rate: float = Field(ge=0, le=100)
    term: str = Field(min_length=1, max_length=80)
    status: str = Field(default="pending", max_length=32)
    disbursed_date: Optional[Union[datetime, str]] = None
    description: Optional[str] = None


class BeneficiaryCreate(StrictModel):
    name: str = Field(min_length=1, max_length=120)
    relationship: Optional[str] = Field(default=None, max_length=80)
    bank: Optional[str] = Field(default=None, max_length=120)
    account_number: Optional[str] = Field(default=None, max_length=64)
    notes: Optional[str] = Field(default=None, max_length=500)


class BeneficiaryOut(BeneficiaryCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AdminBeneficiaryUpdate(BeneficiaryCreate):
    created_at: Optional[Union[datetime, str]] = None