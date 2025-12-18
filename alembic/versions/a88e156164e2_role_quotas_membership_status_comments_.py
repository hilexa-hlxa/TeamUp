"""role quotas, membership status, comments, hackathon link

Revision ID: a88e156164e2
Revises: 004
Create Date: 2025-11-05 10:46:16.466679
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as psql

revision = "a88e156164e2"
down_revision = "004"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column(
        "projects",
        sa.Column("hackathon_id", sa.Integer(),
                  sa.ForeignKey("hackathons.id", ondelete="SET NULL"),
                  nullable=True),
    )

    op.add_column("memberships", sa.Column("status", sa.String(), server_default="approved", nullable=False))
    op.add_column("memberships", sa.Column("invited_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True))
    op.create_index("ix_memberships_project_status", "memberships", ["project_id", "status"])

    op.create_table(
        "project_role_requirements",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("project_id", sa.Integer, sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role_name", sa.String(64), nullable=False),
        sa.Column("required_count", sa.Integer, nullable=False, server_default="1"),
        sa.UniqueConstraint("project_id", "role_name", name="uq_project_role"),
    )

    op.create_table(
        "task_comments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("task_id", sa.Integer, sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.add_column("notifications", sa.Column("payload", psql.JSONB(), nullable=True))

def downgrade():
    op.drop_column("notifications", "payload")
    op.drop_table("task_comments")
    op.drop_table("project_role_requirements")
    op.drop_index("ix_memberships_project_status", table_name="memberships")
    op.drop_column("memberships", "invited_by")
    op.drop_column("memberships", "status")
    op.drop_column("projects", "hackathon_id")
