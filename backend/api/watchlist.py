from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from core.database import get_db
from core.auth import get_current_user
from models.models import User, WatchlistItem

router = APIRouter(prefix="/api/watchlist", tags=["Watchlist"])


class WatchlistItemCreate(BaseModel):
    ticker: str


class WatchlistItemResponse(BaseModel):
    id: int
    ticker: str
    created_at: str


@router.get("", response_model=List[WatchlistItemResponse])
async def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id
    ).all()
    
    return [
        WatchlistItemResponse(
            id=item.id,
            ticker=item.ticker,
            created_at=item.created_at.isoformat() if item.created_at else ""
        )
        for item in items
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    item_data: WatchlistItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticker = item_data.ticker.upper().strip()
    
    existing = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.ticker == ticker
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticker already in watchlist"
        )
    
    new_item = WatchlistItem(
        user_id=current_user.id,
        ticker=ticker
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return {
        "id": new_item.id,
        "ticker": new_item.ticker,
        "message": "Added to watchlist"
    }


@router.delete("/{ticker}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticker = ticker.upper().strip()
    
    item = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.ticker == ticker
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticker not in watchlist"
        )
    
    db.delete(item)
    db.commit()
    
    return None