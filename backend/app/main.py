from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scalar_fastapi import get_scalar_api_reference
from sqlalchemy import inspect, text

from .auth import get_password_hash
from .database import Base, SessionLocal, engine
from .models import Account, Beneficiary, Card, Investment, Loan, Payee, Transaction, User, UserRole
from .routers import accounts, admin, auth, beneficiaries, cards, investments, loans, payees, support, transactions, users

# Create tables
Base.metadata.create_all(bind=engine)


def ensure_legacy_columns():
    """Add fields introduced after the initial imported schema was created."""
    card_columns = {column["name"] for column in inspect(engine).get_columns("cards")}
    missing = {
        "card_number": "VARCHAR",
        "cvc": "VARCHAR",
    }
    payee_columns = {column["name"] for column in inspect(engine).get_columns("payees")}
    missing_payee = {
        "iban": "VARCHAR",
        "swift_code": "VARCHAR",
    }
    with engine.begin() as connection:
        for name, column_type in missing.items():
            if name not in card_columns:
                connection.execute(text(f"ALTER TABLE cards ADD COLUMN {name} {column_type}"))
        for name, column_type in missing_payee.items():
            if name not in payee_columns:
                connection.execute(text(f"ALTER TABLE payees ADD COLUMN {name} {column_type}"))


ensure_legacy_columns()


def seed_demo_data():
    """Ensure the documented demo account has useful data on a fresh database."""
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            demo_user = User(
                email="jordan.ellis@example.com",
                username="demo",
                hashed_password=get_password_hash("demo"),
                full_name="Jordan Ellis",
                role=UserRole.CUSTOMER,
            )
            db.add(demo_user)
            db.flush()

        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                email="admin@horizonbank.com",
                username="admin",
                hashed_password=get_password_hash("admin"),
                full_name="Alex Rivera",
                role=UserRole.SUPER_ADMIN,
            )
            db.add(admin_user)
            db.flush()

        account_specs = [
            ("Everyday Checking", "checking", "4821", 8542.13),
            ("High-Yield Savings", "savings", "7734", 24310.87),
            ("Horizon Rewards Card", "credit", "1092", -1284.50),
        ]
        account_by_type = {}
        for name, account_type, last_four, balance in account_specs:
            account = (
                db.query(Account)
                .filter(Account.user_id == demo_user.id, Account.account_type == account_type)
                .first()
            )
            if not account:
                account = Account(
                    user_id=demo_user.id,
                    account_number=f"DEMO-{last_four}",
                    account_type=account_type,
                    balance=balance,
                    currency="USD",
                )
                db.add(account)
                db.flush()
            account_by_type[account_type] = account

        has_transactions = (
            db.query(Transaction).filter(Transaction.user_id == demo_user.id).first() is not None
        )
        if not has_transactions:
            transaction_specs = [
                ("checking", -84.21, "purchase", "Whole Foods Market", "Groceries", "DEMO-0001", "2026-07-09"),
                ("checking", 3200.00, "deposit", "Payroll Deposit", "Income", "DEMO-0002", "2026-07-08"),
                ("credit", -412.90, "purchase", "Delta Airlines", "Travel", "DEMO-0003", "2026-07-08"),
                ("checking", -15.99, "purchase", "Netflix", "Entertainment", "DEMO-0004", "2026-07-07"),
                ("savings", 42.18, "deposit", "Interest Payment", "Interest", "DEMO-0005", "2026-07-06"),
                ("checking", -52.40, "purchase", "Shell Gas Station", "Transport", "DEMO-0006", "2026-07-06"),
                ("credit", -128.55, "purchase", "Amazon", "Shopping", "DEMO-0007", "2026-07-05"),
                ("checking", -96.30, "purchase", "Electric Co.", "Utilities", "DEMO-0008", "2026-07-04"),
                ("savings", 500.00, "transfer", "Transfer from Checking", "Transfer", "DEMO-0009", "2026-07-03"),
                ("checking", -6.75, "purchase", "Blue Bottle Coffee", "Dining", "DEMO-0010", "2026-07-03"),
                ("credit", -49.99, "purchase", "Gym Membership", "Health", "DEMO-0011", "2026-07-02"),
                ("checking", -1850.00, "purchase", "Rent Payment", "Housing", "DEMO-0012", "2026-07-01"),
            ]
            for account_type, amount, transaction_type, description, category, reference, date in transaction_specs:
                db.add(
                    Transaction(
                        user_id=demo_user.id,
                        account_id=account_by_type[account_type].id,
                        amount=amount,
                        transaction_type=transaction_type,
                        status="completed",
                        description=f"{description} · {category}",
                        reference=reference,
                        created_at=datetime.fromisoformat(date),
                    )
                )

        has_investments = (
            db.query(Investment).filter(Investment.user_id == demo_user.id).first() is not None
        )
        if not has_investments:
            investment_specs = [
                ("VTI", "Vanguard Total Stock Market ETF", "Equities", 42.0, 202.14, 248.55, 10439.10, 8490.00, 76.5, 2069.10, 53.9),
                ("BND", "Vanguard Total Bond Market ETF", "Fixed income", 55.0, 70.22, 72.80, 4004.00, 3862.10, 8.25, 141.90, 29.3),
                ("VXUS", "Vanguard Total International Stock ETF", "International", 30.0, 55.00, 61.50, 1845.00, 1650.00, -12.60, 195.00, 13.5),
            ]
            for (
                symbol,
                name,
                asset_class,
                units,
                average_cost,
                current_price,
                market_value,
                cost_basis,
                daily_change,
                total_return,
                allocation_percentage,
            ) in investment_specs:
                db.add(
                    Investment(
                        user_id=demo_user.id,
                        symbol=symbol,
                        name=name,
                        asset_class=asset_class,
                        units=units,
                        average_cost=average_cost,
                        current_price=current_price,
                        market_value=market_value,
                        cost_basis=cost_basis,
                        daily_change=daily_change,
                        total_return=total_return,
                        allocation_percentage=allocation_percentage,
                        currency="USD",
                    )
                )

        has_cards = db.query(Card).filter(Card.user_id == demo_user.id).first() is not None
        if not has_cards:
            db.add_all(
                [
                    Card(
                        user_id=demo_user.id,
                        account_id=account_by_type["checking"].id,
                        holder_name="Jordan Ellis",
                        last_four="4821",
                        card_number="4242424242424821",
                        expiry="09/28",
                        cvc="123",
                        network="Visa",
                        frozen=False,
                    ),
                    Card(
                        user_id=demo_user.id,
                        account_id=account_by_type["credit"].id,
                        holder_name="Jordan Ellis",
                        last_four="1092",
                        card_number="5555555555551092",
                        expiry="02/27",
                        cvc="456",
                        network="Mastercard",
                        frozen=True,
                    ),
                ]
            )
        else:
            for card in db.query(Card).filter(Card.user_id == demo_user.id).all():
                if not card.card_number:
                    card.card_number = f"000000000000{card.last_four}"
                if not card.cvc:
                    card.cvc = "123"

        if not db.query(Loan).filter(Loan.user_id == demo_user.id).first():
            db.add(
                Loan(
                    user_id=demo_user.id,
                    amount=15000,
                    outstanding=11200,
                    interest_rate=6.5,
                    term="5 years",
                    status="active",
                    disbursed_date=datetime.fromisoformat("2023-02-01T00:00:00"),
                    description="Personal loan",
                )
            )

        if not db.query(Beneficiary).filter(Beneficiary.user_id == demo_user.id).first():
            db.add(
                Beneficiary(
                    user_id=demo_user.id,
                    name="Maria Chen",
                    relationship="Family",
                    bank="Chase Bank",
                    account_number="2291",
                    notes="Previous transfer beneficiary",
                )
            )

        has_payees = db.query(Payee).filter(Payee.user_id == demo_user.id).first() is not None
        if not has_payees:
            db.add_all(
                [
                    Payee(user_id=demo_user.id, name="Maria Chen", bank="Chase Bank", account_number="2291"),
                    Payee(user_id=demo_user.id, name="Sam Patel", bank="Bank of America", account_number="8823"),
                    Payee(user_id=demo_user.id, name="Riverside Landlord LLC", bank="Wells Fargo", account_number="0071"),
                ]
            )

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


seed_demo_data()

app = FastAPI(
    title="Horizon Bank API",
    description="Secure banking services for customer and administrator portals",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (Replit proxy)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(accounts.router, prefix="/api/accounts", tags=["Accounts"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(investments.router, prefix="/api/investments", tags=["Investments"])
app.include_router(cards.router, prefix="/api/cards", tags=["Cards"])
app.include_router(loans.router, prefix="/api/loans", tags=["Loans"])
app.include_router(beneficiaries.router, prefix="/api/beneficiaries", tags=["Beneficiaries"])
app.include_router(payees.router, prefix="/api/payees", tags=["Payees"])
app.include_router(support.router, prefix="/api/support", tags=["Support"])
app.include_router(admin.router, prefix="/api/admin", tags=["Administration"])

@app.get("/")
async def root():
    return {"message": "Horizon Bank API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/scalar", include_in_schema=False)
def get_scalar_docs():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title="Scalar API",
    )