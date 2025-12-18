#!/usr/bin/env python3
"""Initialize SQLite database directly from models"""
import sys
from sqlalchemy import create_engine
from core.config import settings
from db.base import Base
from db.session import get_engine

# Import all models to register them
from models import user, project, task, application, membership, hackathon, notification

def init_db():
    """Create all tables in SQLite database"""
    # Use SQLite URL
    sqlite_url = settings.sqlite_url
    print(f"Creating SQLite database at: {sqlite_url}")
    
    # Create engine
    engine = create_engine(sqlite_url, echo=True)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database initialized successfully!")
    print(f"Tables created: {list(Base.metadata.tables.keys())}")

if __name__ == "__main__":
    init_db()
