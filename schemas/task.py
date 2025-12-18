from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date


class TaskCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None

    @field_validator('title')
    def validate_title(cls, v):
        if not (1 <= len(v) <= 120):
            raise ValueError('Title must be 1-120 characters')
        return v

    @field_validator('due_date')
    def validate_due_date(cls, v):
        if v and v < date.today():
            raise ValueError('Due date must be today or later')
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str]
    status: str
    assignee_id: Optional[int]
    due_date: Optional[date]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True