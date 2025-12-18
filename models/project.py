from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, func, JSON
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from sqlalchemy.orm import relationship
from db.base import Base

def _get_array_type():
    """Get appropriate array type based on database"""
    try:
        from core.config import settings
        from sqlalchemy import create_engine, text
        
        if settings.DB_URL and settings.DB_URL.startswith(("postgresql", "postgres")):
            try:
                engine = create_engine(settings.DB_URL, connect_args={"connect_timeout": 2})
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                return PG_ARRAY(String)
            except:
                return JSON()
        else:
            return JSON()
    except:
        return JSON()


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(80), nullable=False)
    description = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="recruiting")  # recruiting, active, completed
    tech_stack = Column(_get_array_type(), default=list)
    progress_percent = Column(Float, default=0.0)
    prize = Column(Text, nullable=True)  # Prize information
    deadline = Column(DateTime(timezone=True), nullable=True)  # Application deadline
    max_participants = Column(Integer, nullable=True)  # Maximum number of participants
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="SET NULL"), nullable=True)
    hackathon = relationship("Hackathon")
    role_requirements = relationship("ProjectRoleRequirement", back_populates="project", cascade="all, delete-orphan")
