from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Investment, User
from ..schemas import InvestmentPortfolioOut, InvestmentSummary

router = APIRouter()


@router.get("/portfolio", response_model=InvestmentPortfolioOut)
def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    holdings = (
        db.query(Investment)
        .filter(Investment.user_id == current_user.id)
        .order_by(Investment.market_value.desc())
        .all()
    )
    total_value = sum(holding.market_value for holding in holdings)
    total_cost = sum(holding.cost_basis for holding in holdings)
    total_gain = sum(holding.total_return for holding in holdings)
    daily_change = sum(holding.daily_change for holding in holdings)
    gain_percentage = (total_gain / total_cost * 100) if total_cost else 0.0

    return {
        "summary": InvestmentSummary(
            total_value=round(total_value, 2),
            total_cost=round(total_cost, 2),
            total_gain=round(total_gain, 2),
            gain_percentage=round(gain_percentage, 2),
            daily_change=round(daily_change, 2),
            currency="USD",
        ),
        "holdings": holdings,
    }