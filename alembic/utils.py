"""Helper utilities for SQLite compatibility in migrations"""
from sqlalchemy.dialects import postgresql
from sqlalchemy import types as sa_types
import sqlalchemy as sa

def convert_array_to_json_for_sqlite(column_def):
    """Convert PostgreSQL ARRAY columns to JSON for SQLite compatibility"""
    # This is a helper - actual conversion happens in migration files
    pass

def get_array_type():
    """Get appropriate array type based on database"""
    from core.config import settings
    from sqlalchemy import create_engine, text
    
    # Check if we're using SQLite
    if settings.DB_URL and settings.DB_URL.startswith(("postgresql", "postgres")):
        try:
            engine = create_engine(settings.DB_URL, connect_args={"connect_timeout": 2})
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return postgresql.ARRAY(sa.String())
        except:
            return sa.JSON()
    elif not settings.DB_URL or "sqlite" in settings.sqlite_url.lower():
        return sa.JSON()
    else:
        return postgresql.ARRAY(sa.String())
