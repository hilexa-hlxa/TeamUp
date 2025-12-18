from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB as PG_JSONB

def _get_json_type():
    """Get JSON type compatible with database"""
    try:
        from core.config import settings
        from sqlalchemy import create_engine, text
        
        if settings.DB_URL and settings.DB_URL.startswith(("postgresql", "postgres")):
            try:
                engine = create_engine(settings.DB_URL, connect_args={"connect_timeout": 2})
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                return PG_JSONB
            except:
                return JSON
        else:
            return JSON
    except:
        return JSON
from db.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # invite, application_status, task_done
    payload = Column(_get_json_type(), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
