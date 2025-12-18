from pydantic import BaseModel
from datetime import datetime

class TaskCommentCreate(BaseModel):
    body: str

class TaskCommentRead(BaseModel):
    id: int
    task_id: int
    author_id: int
    body: str
    created_at: datetime
    class Config:
        from_attributes = True
