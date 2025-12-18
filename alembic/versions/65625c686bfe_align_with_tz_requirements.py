"""align_with_tz_requirements

Revision ID: 65625c686bfe
Revises: a88e156164e2
Create Date: 2025-12-09 08:40:27.333770

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as psql


# revision identifiers, used by Alembic.
revision: str = '65625c686bfe'
down_revision: Union[str, Sequence[str], None] = 'a88e156164e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to match TZ requirements."""
    
    # 1. Users: full_name -> name, role default -> 'student'
    # Safe rename: check if full_name exists first
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'full_name'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'name'
            ) THEN
                ALTER TABLE users RENAME COLUMN full_name TO name;
            END IF;
        END$$;
    """)
    op.alter_column('users', 'role', server_default="'student'")
    
    # 2. Projects: owner_id -> created_by, remove required_roles ARRAY
    op.alter_column('projects', 'owner_id', new_column_name='created_by', existing_type=sa.Integer())
    op.drop_column('projects', 'required_roles')
    
    # 3. Applications: add type, target_id, applicant_id; remove project_id, user_id, desired_role
    op.add_column('applications', sa.Column('type', sa.String(), nullable=False, server_default="'project'"))
    op.add_column('applications', sa.Column('target_id', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('applications', sa.Column('applicant_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, server_default='0'))
    
    # Migrate data: copy project_id -> target_id, user_id -> applicant_id, set type='project'
    op.execute("""
        UPDATE applications 
        SET target_id = project_id, 
            applicant_id = user_id,
            type = 'project'
        WHERE project_id IS NOT NULL
    """)
    
    # Drop old columns and constraints
    op.drop_constraint('applications_project_id_fkey', 'applications', type_='foreignkey')
    op.drop_constraint('applications_user_id_fkey', 'applications', type_='foreignkey')
    op.drop_column('applications', 'project_id')
    op.drop_column('applications', 'user_id')
    op.drop_column('applications', 'desired_role')
    
    # Add unique partial index for pending applications (PostgreSQL specific)
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_application_pending 
        ON applications (type, target_id, applicant_id) 
        WHERE status = 'pending'
    """)
    
    # 4. Memberships: role -> role_in_team, joined_at -> created_at, status default -> 'active'
    op.alter_column('memberships', 'role', new_column_name='role_in_team', existing_type=sa.String())
    op.alter_column('memberships', 'joined_at', new_column_name='created_at', existing_type=sa.DateTime(timezone=True))
    op.alter_column('memberships', 'status', server_default="'active'")
    
    # 5. Hackathons: start_date/end_date -> start_at/end_at, add created_by
    op.alter_column('hackathons', 'start_date', new_column_name='start_at', existing_type=sa.Date())
    op.alter_column('hackathons', 'end_date', new_column_name='end_at', existing_type=sa.Date())
    
    # Change start_at and end_at to DateTime
    op.alter_column('hackathons', 'start_at', type_=sa.DateTime(timezone=True), existing_type=sa.Date())
    op.alter_column('hackathons', 'end_at', type_=sa.DateTime(timezone=True), existing_type=sa.Date())
    
    # Add created_by column as nullable first
    op.add_column('hackathons', sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True))
    
    # Update existing hackathons: set created_by to first user if exists, or leave NULL
    op.execute("""
        UPDATE hackathons 
        SET created_by = (SELECT id FROM users ORDER BY id LIMIT 1)
        WHERE created_by IS NULL
    """)
    
    # Now make it NOT NULL (only if we have users)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
                ALTER TABLE hackathons ALTER COLUMN created_by SET NOT NULL;
            END IF;
        END$$;
    """)
    
    # 6. Create hackathon_participants table
    op.create_table(
        'hackathon_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('hackathon_id', sa.Integer(), sa.ForeignKey('hackathons.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_hackathon_participants_id', 'hackathon_participants', ['id'])
    
    # 7. Notifications: remove title, message; keep type and payload
    op.drop_column('notifications', 'title')
    op.drop_column('notifications', 'message')
    
    # 8. Rename project_role_requirements -> project_required_roles, remove required_count
    op.rename_table('project_role_requirements', 'project_required_roles')
    op.drop_column('project_required_roles', 'required_count')


def downgrade() -> None:
    """Downgrade schema."""
    
    # 8. Restore project_required_roles
    op.add_column('project_required_roles', sa.Column('required_count', sa.Integer(), nullable=False, server_default='1'))
    op.rename_table('project_required_roles', 'project_role_requirements')
    
    # 7. Restore notifications
    op.add_column('notifications', sa.Column('message', sa.Text(), nullable=False, server_default=''))
    op.add_column('notifications', sa.Column('title', sa.String(), nullable=False, server_default=''))
    
    # 6. Drop hackathon_participants
    op.drop_index('ix_hackathon_participants_id', table_name='hackathon_participants')
    op.drop_table('hackathon_participants')
    
    # 5. Restore hackathons
    op.drop_column('hackathons', 'created_by')
    op.alter_column('hackathons', 'end_at', type_=sa.Date(), existing_type=sa.DateTime(timezone=True))
    op.alter_column('hackathons', 'start_at', type_=sa.Date(), existing_type=sa.DateTime(timezone=True))
    op.alter_column('hackathons', 'end_at', new_column_name='end_date', existing_type=sa.Date())
    op.alter_column('hackathons', 'start_at', new_column_name='start_date', existing_type=sa.Date())
    
    # 4. Restore memberships
    op.alter_column('memberships', 'status', server_default="'approved'")
    op.alter_column('memberships', 'created_at', new_column_name='joined_at', existing_type=sa.DateTime(timezone=True))
    op.alter_column('memberships', 'role_in_team', new_column_name='role', existing_type=sa.String())
    
    # 3. Restore applications
    op.add_column('applications', sa.Column('desired_role', sa.String(), nullable=False, server_default=''))
    op.add_column('applications', sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, server_default='0'))
    op.add_column('applications', sa.Column('project_id', sa.Integer(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, server_default='0'))
    
    op.execute("""
        UPDATE applications 
        SET project_id = target_id, 
            user_id = applicant_id
        WHERE type = 'project'
    """)
    
    # Drop the partial unique index
    op.execute("DROP INDEX IF EXISTS uq_application_pending")
    op.drop_column('applications', 'applicant_id')
    op.drop_column('applications', 'target_id')
    op.drop_column('applications', 'type')
    
    # 2. Restore projects
    op.add_column('projects', sa.Column('required_roles', psql.ARRAY(sa.String()), nullable=False, server_default='{}'))
    op.alter_column('projects', 'created_by', new_column_name='owner_id', existing_type=sa.Integer())
    
    # 1. Restore users
    op.alter_column('users', 'role', server_default="'user'")
    op.alter_column('users', 'name', new_column_name='full_name', existing_type=sa.String(255))
