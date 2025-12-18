"""initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def _get_array_type():
    """Get ARRAY type compatible with current database"""
    bind = op.get_bind()
    if bind.dialect.name == 'sqlite':
        return sa.JSON()
    else:
        return postgresql.ARRAY(sa.String())


def upgrade() -> None:
    bind = op.get_bind()
    # Users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('skills', _get_array_type(), server_default='[]' if bind.dialect.name == 'sqlite' else '{}'),
        sa.Column('bio', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Projects
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(80), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='recruiting'),
        sa.Column('required_roles', _get_array_type(), nullable=False),
        sa.Column('tech_stack', _get_array_type(), server_default='[]' if bind.dialect.name == 'sqlite' else '{}'),
        sa.Column('progress_percent', sa.Float(), server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_projects_id', 'projects', ['id'])

    # Tasks
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='todo'),
        sa.Column('assignee_id', sa.Integer(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assignee_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tasks_id', 'tasks', ['id'])

    # Applications
    op.create_table(
        'applications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('desired_role', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_applications_id', 'applications', ['id'])

    # Memberships
    op.create_table(
        'memberships',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_memberships_id', 'memberships', ['id'])

    # Hackathons
    op.create_table(
        'hackathons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('prize_pool', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_hackathons_id', 'hackathons', ['id'])

    # Notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notifications_id', 'notifications', ['id'])


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('hackathons')
    op.drop_table('memberships')
    op.drop_table('applications')
    op.drop_table('tasks')
    op.drop_table('projects')
    op.drop_table('users')