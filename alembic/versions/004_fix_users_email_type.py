"""ensure users.email is VARCHAR(255) and unique

Revision ID: 004
Revises: 003
Create Date: 2025-10-30 00:12:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure email is varchar(255)
    op.execute(
        """
        DO $$
        BEGIN
            -- change type if not already varchar
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='email' AND data_type <> 'character varying'
            ) THEN
                ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(255) USING email::text;
            END IF;
        END$$;
        """
    )

    # Ensure unique index on email
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_indexes WHERE tablename='users' AND indexname='ix_users_email'
            ) THEN
                -- drop and recreate as unique to be safe
                DROP INDEX IF EXISTS ix_users_email;
            END IF;
            CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email);
        END$$;
        """
    )


def downgrade() -> None:
    # Non-destructive: no type downgrade or index removal
    pass




