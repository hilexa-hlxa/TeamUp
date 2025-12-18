from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Integer, String, DateTime, Boolean, func, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import ARRAY

from db.base import Base

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
    skills: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String(64)), default=list)

    bio: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # timestamps: created gets server default; updated auto-bumps on change
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )
