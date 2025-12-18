from sqlalchemy import Column, Integer, DateTime, ForeignKey, func
from db.base import Base


class HackathonParticipant(Base):
    __tablename__ = "hackathon_participants"

    id = Column(Integer, primary_key=True, index=True)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

