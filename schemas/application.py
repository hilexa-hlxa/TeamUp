from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# Client -> Server
class ApplicationCreate(BaseModel):
    type: str = Field(pattern="^(project|hackathon)$")  # project | hackathon
    target_id: int  # id проекта или хакатона
    message: Optional[str] = Field(None, max_length=1000)

# Client -> Server (partial update)
class ApplicationUpdate(BaseModel):
    message: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(pending|approved|rejected)$")

# Server -> Client
class ApplicationResponse(BaseModel):
    id: int
    type: str
    target_id: int
    applicant_id: int
    message: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    # Nested data
    applicant: Optional[dict] = None
    project: Optional[dict] = None
    hackathon: Optional[dict] = None

    class Config:
        from_attributes = True  # Pydantic v2: builds from ORM objects
