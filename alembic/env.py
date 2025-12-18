import sys
from logging.config import fileConfig
from os.path import dirname, abspath

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

sys.path.insert(0, dirname(dirname(abspath(__file__))))

from db.base import Base  # this pulls in all models above
target_metadata = Base.metadata
from core.config import settings

config = context.config

# Determine which database to use for migrations
# Try PostgreSQL first, fallback to SQLite
db_url = None

# Try to use PostgreSQL if available
if settings.DB_URL and settings.DB_URL.startswith(("postgresql", "postgres")):
    # Test PostgreSQL connection
    try:
        from sqlalchemy import create_engine, text
        test_engine = create_engine(settings.DB_URL, connect_args={"connect_timeout": 5})
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_url = settings.DB_URL
    except Exception:
        # PostgreSQL failed, use SQLite
        db_url = settings.sqlite_url
else:
    # No PostgreSQL URL, use SQLite
    db_url = settings.sqlite_url

config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()