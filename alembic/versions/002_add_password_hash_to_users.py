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
    bind = op.get_bind()
    # Add column only if it doesn't already exist
    if bind.dialect.name == 'sqlite':
        # SQLite: Try to add column, ignore if it exists
        try:
            op.add_column('users', sa.Column('password_hash', sa.String(255), nullable=False, server_default=''))
        except Exception:
            # Column might already exist, check first
            inspector = sa.inspect(bind)
            columns = [col['name'] for col in inspector.get_columns('users')]
            if 'password_hash' not in columns:
                op.add_column('users', sa.Column('password_hash', sa.String(255), nullable=False, server_default=''))
    else:
        # PostgreSQL: Use DO block
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
                    ALTER TABLE users ALTER COLUMN password_hash DROP DEFAULT;
                END IF;
            END$$;
            """
        )


def downgrade() -> None:
    bind = op.get_bind()
    # Drop column only if it exists
    if bind.dialect.name == 'sqlite':
        # SQLite doesn't support DROP COLUMN directly, would need table recreation
        # For now, just skip
        pass
    else:
        # PostgreSQL: Use DO block
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




