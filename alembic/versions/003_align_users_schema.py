"""align users table with current model

Revision ID: 003
Revises: 002
Create Date: 2025-10-30 00:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add full_name if missing, backfill from name + ' ' + surname when available
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='full_name'
            ) THEN
                ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NOT NULL DEFAULT '';
                UPDATE users SET full_name =
                    COALESCE(NULLIF(TRIM(CONCAT_WS(' ', name, surname)), ''), full_name);
                ALTER TABLE users ALTER COLUMN full_name DROP DEFAULT;
            END IF;
        END$$;
        """
    )

    # role
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='role'
            ) THEN
                ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';
            END IF;
        END$$;
        """
    )

    # avatar_url
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='avatar_url'
            ) THEN
                ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
            END IF;
        END$$;
        """
    )

    # skills as text[]
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='skills'
            ) THEN
                ALTER TABLE users ADD COLUMN skills VARCHAR(64)[] DEFAULT '{}';
            END IF;
        END$$;
        """
    )

    # bio already exists in legacy schema; ensure it is VARCHAR
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='bio'
            ) THEN
                -- no-op; keep existing type unless incompatible
                NULL;
            END IF;
        END$$;
        """
    )

    # timestamps
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='created_at'
            ) THEN
                ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='updated_at'
            ) THEN
                ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ NULL;
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    # Non-destructive: keep data; only drop columns if present
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
                ALTER TABLE users DROP COLUMN updated_at;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
                ALTER TABLE users DROP COLUMN created_at;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='skills') THEN
                ALTER TABLE users DROP COLUMN skills;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
                ALTER TABLE users DROP COLUMN avatar_url;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
                ALTER TABLE users DROP COLUMN role;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='full_name') THEN
                ALTER TABLE users DROP COLUMN full_name;
            END IF;
        END$$;
        """
    )


