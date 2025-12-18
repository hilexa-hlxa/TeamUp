from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from db.base import Base


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_in_team = Column(String, nullable=False)
    status = Column(String, nullable=False, default="active")  # active | invited
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=True)