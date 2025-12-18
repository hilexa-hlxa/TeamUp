from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from api.deps import get_current_user
from models.user import User
from schemas.notification import NotificationResponse
from services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return NotificationService.list_by_user(db, current_user.id, unread_only)

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return NotificationService.mark_as_read(db, notification_id, current_user.id)
