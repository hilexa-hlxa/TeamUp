from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


class ProjectCreate(BaseModel):
    title: str
    description: str
    tech_stack: List[str] = []
    prize: Optional[str] = None
    deadline: Optional[datetime] = None
    max_participants: Optional[int] = None

    @field_validator('title')
    def validate_title(cls, v):
        if not (4 <= len(v) <= 80):
            raise ValueError('Title must be 4-80 characters')
        return v


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    prize: Optional[str] = None
    deadline: Optional[datetime] = None
    max_participants: Optional[int] = None


class ProjectResponse(BaseModel):
    id: int
    title: str
    description: str
    created_by: int
    status: str
    tech_stack: List[str]
    progress_percent: float
    prize: Optional[str] = None
    deadline: Optional[datetime] = None
    max_participants: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
