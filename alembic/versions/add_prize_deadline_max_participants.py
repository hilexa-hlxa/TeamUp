"""add_prize_deadline_max_participants

Revision ID: a1b2c3d4e5f6
Revises: 62d8b6d779a9
Create Date: 2025-12-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '62d8b6d779a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Добавление полей prize, deadline, max_participants в projects и prize, max_participants в hackathons"""
    
    # Добавляем поля в projects
    op.execute("""
        DO $$
        BEGIN
            -- prize
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'projects' AND column_name = 'prize'
            ) THEN
                ALTER TABLE projects ADD COLUMN prize TEXT;
            END IF;
            
            -- deadline
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'projects' AND column_name = 'deadline'
            ) THEN
                ALTER TABLE projects ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;
            END IF;
            
            -- max_participants
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'projects' AND column_name = 'max_participants'
            ) THEN
                ALTER TABLE projects ADD COLUMN max_participants INTEGER;
            END IF;
        END$$;
    """)
    
    # Добавляем поля в hackathons
    op.execute("""
        DO $$
        BEGIN
            -- prize
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'hackathons' AND column_name = 'prize'
            ) THEN
                ALTER TABLE hackathons ADD COLUMN prize TEXT;
            END IF;
            
            -- max_participants
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'hackathons' AND column_name = 'max_participants'
            ) THEN
                ALTER TABLE hackathons ADD COLUMN max_participants INTEGER;
            END IF;
        END$$;
    """)


def downgrade() -> None:
    """Удаление полей prize, deadline, max_participants из projects и prize, max_participants из hackathons"""
    
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'projects' AND column_name = 'prize'
            ) THEN
                ALTER TABLE projects DROP COLUMN prize;
            END IF;
            
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'projects' AND column_name = 'deadline'
            ) THEN
                ALTER TABLE projects DROP COLUMN deadline;
            END IF;
            
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'projects' AND column_name = 'max_participants'
            ) THEN
                ALTER TABLE projects DROP COLUMN max_participants;
            END IF;
            
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'hackathons' AND column_name = 'prize'
            ) THEN
                ALTER TABLE hackathons DROP COLUMN prize;
            END IF;
            
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'hackathons' AND column_name = 'max_participants'
            ) THEN
                ALTER TABLE hackathons DROP COLUMN max_participants;
            END IF;
        END$$;
    """)

