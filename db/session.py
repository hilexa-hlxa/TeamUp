from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DisconnectionError
from core.config import settings
import structlog
import os

logger = structlog.get_logger()

# Global state for database connection
_engine = None
_SessionLocal = None
_using_sqlite = False
_postgres_available = True


def _test_connection(engine) -> bool:
    """Test if database connection works"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except (OperationalError, DisconnectionError, Exception) as e:
        logger.warning("database_connection_test_failed", error=str(e))
        return False


def _init_engine():
    """Initialize database engine with PostgreSQL fallback to SQLite"""
    global _engine, _SessionLocal, _using_sqlite, _postgres_available
    
    # Try PostgreSQL first if DB_URL is set
    if settings.DB_URL and settings.DB_URL.startswith(("postgresql", "postgres")):
        try:
            logger.info("attempting_postgresql_connection")
            postgres_engine = create_engine(
                settings.DB_URL,
                pool_pre_ping=True,
                pool_recycle=300,
                connect_args={"connect_timeout": 5}
            )
            
            # Test connection
            if _test_connection(postgres_engine):
                _engine = postgres_engine
                _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
                _using_sqlite = False
                _postgres_available = True
                logger.info("postgresql_connection_successful", db_url=settings.DB_URL[:50] + "...")
                return
            else:
                logger.warning("postgresql_connection_test_failed_fallback_to_sqlite")
        except Exception as e:
            logger.error("postgresql_connection_error", error=str(e), fallback="sqlite")
    
    # Fallback to SQLite
    _postgres_available = False
    sqlite_url = settings.sqlite_url
    
    # Ensure directory exists for SQLite file
    sqlite_path = settings.SQLITE_DB_PATH
    if "/" in sqlite_path or "\\" in sqlite_path:
        os.makedirs(os.path.dirname(sqlite_path), exist_ok=True)
    
    logger.info("using_sqlite_fallback", path=sqlite_path)
    _engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False},  # SQLite requires this
        pool_pre_ping=True
    )
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    _using_sqlite = True
    
    # Test SQLite connection
    if not _test_connection(_engine):
        logger.error("sqlite_connection_failed")
        raise RuntimeError("Failed to connect to both PostgreSQL and SQLite")
    
    # Ensure tables exist for SQLite
    try:
        from sqlalchemy import inspect
        inspector = inspect(_engine)
        existing_tables = inspector.get_table_names()
        
        # Check if users table exists (indicator that tables are initialized)
        if 'users' not in existing_tables:
            logger.info("creating_tables_from_models_for_sqlite")
            from db.base import Base
            # Import all models to register them
            from models import user, project, task, application, membership, hackathon, notification, project_role_requirement, task_comment, hackathon_participant
            Base.metadata.create_all(bind=_engine)
            logger.info("sqlite_tables_created", tables=list(Base.metadata.tables.keys()))
    except Exception as e:
        logger.warning("failed_to_create_sqlite_tables", error=str(e))


def _try_reconnect_postgres():
    """Try to reconnect to PostgreSQL if we're using SQLite"""
    global _engine, _SessionLocal, _using_sqlite, _postgres_available
    
    if _using_sqlite and settings.DB_URL and settings.DB_URL.startswith(("postgresql", "postgres")):
        try:
            logger.info("attempting_postgresql_reconnect")
            postgres_engine = create_engine(
                settings.DB_URL,
                pool_pre_ping=True,
                pool_recycle=300,
                connect_args={"connect_timeout": 5}
            )
            
            if _test_connection(postgres_engine):
                _engine = postgres_engine
                _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
                _using_sqlite = False
                _postgres_available = True
                logger.info("postgresql_reconnection_successful")
                return True
        except Exception as e:
            logger.debug("postgresql_reconnect_failed", error=str(e))
    
    return False


# Initialize on import
_init_engine()


def get_db():
    """Get database session with automatic fallback handling"""
    global _engine, _SessionLocal, _using_sqlite
    
    # If using SQLite, try to reconnect to PostgreSQL periodically
    if _using_sqlite:
        _try_reconnect_postgres()
    
    db = _SessionLocal()
    try:
        yield db
    except (OperationalError, DisconnectionError) as e:
        logger.error("database_session_error", error=str(e))
        db.close()
        
        # Try to reinitialize if connection lost
        if not _using_sqlite:
            logger.warning("postgresql_connection_lost_switching_to_sqlite")
            _init_engine()
            db = _SessionLocal()
            yield db
        else:
            raise
    finally:
        db.close()


def is_using_sqlite() -> bool:
    """Check if currently using SQLite fallback"""
    return _using_sqlite


def get_engine():
    """Get the current database engine"""
    return _engine