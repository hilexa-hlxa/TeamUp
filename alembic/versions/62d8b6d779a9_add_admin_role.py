"""add_admin_role

Revision ID: 62d8b6d779a9
Revises: 9f1d1da156b4
Create Date: 2025-12-10 03:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '62d8b6d779a9'
down_revision: Union[str, Sequence[str], None] = '9f1d1da156b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add admin role support - no schema changes needed, role is just a string value"""
    # The role column already exists and accepts any string value
    # We just need to ensure admin role can be used
    # No actual migration needed, but we'll add a comment for documentation
    pass


def downgrade() -> None:
    """No changes to revert"""
    pass
