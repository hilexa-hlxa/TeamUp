from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "student"  # student, mentor, customer, admin
    skills: List[str] = []
    bio: Optional[str] = None

    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

    @field_validator('skills')
    def validate_skills(cls, v):
        if len(v) > 20:
            raise ValueError('Maximum 20 skills allowed')
        for skill in v:
            if not (1 <= len(skill) <= 24):
                raise ValueError('Each skill must be 1-24 characters')
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    avatar_url: Optional[str]
    skills: List[str]
    bio: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    skills: Optional[List[str]] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None