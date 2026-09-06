from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Loan, User
from ..schemas import LoanOut

router = APIRouter()


@router.get("/", response_model=list[LoanOut])
def get_loans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Loan)
        .filter(Loan.user_id == current_user.id)
        .order_by(Loan.disbursed_date.desc(), Loan.id.desc())
        .all()
    )