from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Date, func
from db.base import Base
from sqlalchemy.orm import relationship


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="todo")  # todo, in_progress, done
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
