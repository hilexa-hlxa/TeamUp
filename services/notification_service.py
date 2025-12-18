from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from models.notification import Notification
from ws.manager import manager
from fastapi import BackgroundTasks


class NotificationService:
    @staticmethod
    def create(
        db: Session, 
        user_id: int, 
        type: str,  # invite, application_status, task_done
        payload: Optional[Dict[str, Any]] = None,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=type,
            payload=payload or {}
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Send WebSocket notification if user is connected
        # This will be handled by background task if provided
        if background_tasks:
            background_tasks.add_task(
                NotificationService._send_websocket_notification,
                user_id=user_id,
                notification={
                    "id": notification.id,
                    "type": notification.type,
                    "payload": notification.payload,
                    "is_read": notification.is_read,
                    "created_at": notification.created_at.isoformat() if notification.created_at else None
                }
            )

        return notification

    @staticmethod
    async def _send_websocket_notification(user_id: int, notification: dict):
        """Helper method to send WebSocket notification"""
        await manager.send_notification(user_id, notification)

    @staticmethod
    def list_by_user(db: Session, user_id: int, unread_only: bool = False) -> List[Notification]:
        query = db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        return query.order_by(Notification.created_at.desc()).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> Notification:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()

        if notification:
            notification.is_read = True
            db.commit()
            db.refresh(notification)

        return notification