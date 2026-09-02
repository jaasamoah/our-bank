from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Complaint, User
from ..schemas import ComplaintCreate, ComplaintOut

router = APIRouter()


@router.get("/", response_model=list[ComplaintOut])
def get_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Complaint)
        .filter(Complaint.user_id == current_user.id)
        .order_by(Complaint.created_at.desc())
        .all()
    )


@router.post("/", response_model=ComplaintOut, status_code=201)
def create_complaint(
    payload: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = payload.subject.strip()
    message = payload.message.strip()
    if not subject or not message:
        raise HTTPException(status_code=400, detail="Add a subject and message")
    complaint = Complaint(user_id=current_user.id, subject=subject, message=message)
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint