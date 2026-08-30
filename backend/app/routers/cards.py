from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Card, User
from ..schemas import CardOut

router = APIRouter()


@router.get("/", response_model=list[CardOut])
def get_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Card).filter(Card.user_id == current_user.id).order_by(Card.id).all()


@router.patch("/{card_id}/freeze", response_model=CardOut)
def set_card_frozen(
    card_id: int,
    frozen: bool = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = (
        db.query(Card)
        .filter(Card.id == card_id, Card.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    card.frozen = frozen
    db.commit()
    db.refresh(card)
    return card