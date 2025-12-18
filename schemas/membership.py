# schemas/membership.py
from __future__ import annotations
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class MembershipStatus(str, Enum):
    active = "active"
    invited = "invited"

# Client -> Server: invite request
class MembershipInviteIn(BaseModel):
    user_id: int
    role_in_team: str = Field(min_length=1, max_length=64)
    message: str | None = Field(None, max_length=280)

# Server -> Client: invite/membership record
class MembershipInviteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    user_id: int
    role_in_team: str
    status: str  # active | invited
    created_at: datetime
    invited_by: int | None = None

# Client -> Server: approve/reject/left
class MembershipDecision(BaseModel):
    status: MembershipStatus
    reason: str | None = Field(None, max_length=280)

# Compatibility aliases so old imports don’t explode
MembershipResponse = MembershipInviteOut
MembershipCreate = MembershipInviteIn

# Optional: some routers prefer these names
class MembershipRead(MembershipInviteOut):
    pass

class MembershipUpdate(BaseModel):
    status: MembershipStatus
