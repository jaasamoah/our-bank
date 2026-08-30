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
    payee_name: Optional[str] = None
    amount: float
    note: Optional[str] = None


class TransferOut(BaseModel):
    message: str
    amount: float
    from_account_id: int
    to_account_id: Optional[int] = None
    transaction_ids: list[int]