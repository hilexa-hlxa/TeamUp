from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str  # invite, application_status, task_done
    payload: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True