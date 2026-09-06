from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Beneficiary, User
from ..schemas import BeneficiaryOut

router = APIRouter()


@router.get("/", response_model=list[BeneficiaryOut])
def get_beneficiaries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Beneficiary)
        .filter(Beneficiary.user_id == current_user.id)
        .order_by(Beneficiary.created_at.desc(), Beneficiary.id.desc())
        .all()
    )