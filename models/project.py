from sqlalchemy import Column, Integer, String, Text, ARRAY, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from db.base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(80), nullable=False)
    description = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="recruiting")  # recruiting, active, completed
    tech_stack = Column(ARRAY(String), default=list)
    progress_percent = Column(Float, default=0.0)
    prize = Column(Text, nullable=True)  # Prize information
    deadline = Column(DateTime(timezone=True), nullable=True)  # Application deadline
    max_participants = Column(Integer, nullable=True)  # Maximum number of participants
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="SET NULL"), nullable=True)
    hackathon = relationship("Hackathon")
    role_requirements = relationship("ProjectRoleRequirement", back_populates="project", cascade="all, delete-orphan")
