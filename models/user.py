from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Integer, String, DateTime, Boolean, func, text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY

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
                return PG_ARRAY(String(64))
            except:
                return JSON()
        else:
            return JSON()
    except:
        return JSON()

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # unique + indexed for login lookups
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # role: student, mentor, customer, admin
    role: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'student'"))

    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Postgres ARRAY, Python-side default is a callable so you don’t share the same list
    skills: Mapped[Optional[List[str]]] = mapped_column(_get_array_type(), default=list)

    bio: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # timestamps: created gets server default; updated auto-bumps on change
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )
