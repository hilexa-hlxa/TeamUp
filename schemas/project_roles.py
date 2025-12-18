from pydantic import BaseModel, Field

class RoleRequirementCreate(BaseModel):
    role_name: str = Field(min_length=1, max_length=64)

class RoleRequirementRead(BaseModel):
    id: int
    project_id: int
    role_name: str
    
    class Config:
        from_attributes = True
