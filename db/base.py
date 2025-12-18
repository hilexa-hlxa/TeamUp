from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import types as sa_types
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from sqlalchemy.dialects import sqlite

Base = declarative_base()

def get_array_type():
    """Get ARRAY type compatible with current database"""
    # This will be called at runtime when creating tables
    # For now, return a type that works with both
    # We'll handle conversion in the session initialization
    try:
        from core.config import settings
        from sqlalchemy import create_engine, text, inspect
        
        # Check which database we're using
        if settings.DB_URL and settings.DB_URL.startswith(("postgresql", "postgres")):
            try:
                engine = create_engine(settings.DB_URL, connect_args={"connect_timeout": 2})
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                return PG_ARRAY(sa_types.String)
            except:
                return sa_types.JSON()
        else:
            return sa_types.JSON()
    except:
        # Default to JSON for safety
        return sa_types.JSON()