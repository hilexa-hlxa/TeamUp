"""add password_hash to users if missing

Revision ID: 002
Revises: 001
Create Date: 2025-10-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add column only if it doesn't already exist
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'password_hash'
            ) THEN
                ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '';
                -- remove default after backfilling existing rows if any
                ALTER TABLE users ALTER COLUMN password_hash DROP DEFAULT;
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    # Drop column only if it exists
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'password_hash'
            ) THEN
                ALTER TABLE users DROP COLUMN password_hash;
            END IF;
        END$$;
        """
    )




