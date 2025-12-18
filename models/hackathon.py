from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from db.base import Base


class Hackathon(Base):
    __tablename__ = "hackathons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    prize = Column(Text, nullable=True)  # Prize information
    max_participants = Column(Integer, nullable=True)  # Maximum number of participants
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())