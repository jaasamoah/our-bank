from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship as orm_relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    accounts = orm_relationship("Account", back_populates="user")
    transactions = orm_relationship("Transaction", back_populates="user")
    investments = orm_relationship("Investment", back_populates="user")
    cards = orm_relationship("Card", back_populates="user")
    payees = orm_relationship("Payee", back_populates="user")
    complaints = orm_relationship("Complaint", back_populates="user")
    loans = orm_relationship("Loan", back_populates="user")
    beneficiaries = orm_relationship("Beneficiary", back_populates="user")

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    account_number = Column(String, unique=True, index=True)
    account_type = Column(String)  # checking, savings, etc.
    balance = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = orm_relationship("User", back_populates="accounts")
    transactions = orm_relationship("Transaction", back_populates="account")
    cards = orm_relationship("Card", back_populates="account")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    transaction_type = Column(String)  # deposit, withdrawal, transfer
    status = Column(String, default="processing")  # processing, completed, failed, reversed
    description = Column(String)
    reference = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    account = orm_relationship("Account", back_populates="transactions")
    user = orm_relationship("User", back_populates="transactions")


class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String, nullable=False)
    name = Column(String, nullable=False)
    asset_class = Column(String, nullable=False)
    units = Column(Float, nullable=False, default=0.0)
    average_cost = Column(Float, nullable=False, default=0.0)
    current_price = Column(Float, nullable=False, default=0.0)
    market_value = Column(Float, nullable=False, default=0.0)
    cost_basis = Column(Float, nullable=False, default=0.0)
    daily_change = Column(Float, nullable=False, default=0.0)
    total_return = Column(Float, nullable=False, default=0.0)
    allocation_percentage = Column(Float, nullable=False, default=0.0)
    currency = Column(String, default="USD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = orm_relationship("User", back_populates="investments")


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    holder_name = Column(String, nullable=False)
    last_four = Column(String, nullable=False)
    card_number = Column(String, nullable=True)
    expiry = Column(String, nullable=False)
    cvc = Column(String, nullable=True)
    network = Column(String, nullable=False)
    frozen = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = orm_relationship("User", back_populates="cards")
    account = orm_relationship("Account", back_populates="cards")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    outstanding = Column(Float, nullable=False, default=0.0)
    interest_rate = Column(Float, nullable=False, default=0.0)
    term = Column(String, nullable=False, default="")
    status = Column(String, nullable=False, default="pending")
    disbursed_date = Column(DateTime(timezone=True), nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = orm_relationship("User", back_populates="loans")


class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    relationship = Column(String, nullable=True)
    bank = Column(String, nullable=True)
    account_number = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = orm_relationship("User", back_populates="beneficiaries")


class Payee(Base):
    __tablename__ = "payees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    bank = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = orm_relationship("User", back_populates="payees")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = orm_relationship("User")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String, nullable=False)
    message = Column(String, nullable=False)
    status = Column(String, default="open", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = orm_relationship("User", back_populates="complaints")