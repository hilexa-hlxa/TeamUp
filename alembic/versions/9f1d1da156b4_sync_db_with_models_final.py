"""sync_db_with_models_final

Revision ID: 9f1d1da156b4
Revises: 65625c686bfe
Create Date: 2025-12-09 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f1d1da156b4'
down_revision: Union[str, Sequence[str], None] = '65625c686bfe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Синхронизация БД с моделями проекта - финальная версия"""
    
    # 1. Удалить лишнюю колонку prize_pool из hackathons (не используется в модели)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'hackathons' AND column_name = 'prize_pool'
            ) THEN
                ALTER TABLE hackathons DROP COLUMN prize_pool;
            END IF;
        END$$;
    """)
    
    # 2. Убедиться, что все created_at NOT NULL (если еще не исправлено)
    op.execute("""
        DO $$
        BEGIN
            -- users.created_at
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'created_at' AND is_nullable = 'YES'
            ) THEN
                ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;
            END IF;
            
            -- applications.created_at
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'applications' AND column_name = 'created_at' AND is_nullable = 'YES'
            ) THEN
                ALTER TABLE applications ALTER COLUMN created_at SET NOT NULL;
            END IF;
            
            -- memberships.created_at
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'memberships' AND column_name = 'created_at' AND is_nullable = 'YES'
            ) THEN
                ALTER TABLE memberships ALTER COLUMN created_at SET NOT NULL;
            END IF;
            
            -- hackathon_participants.created_at
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'hackathon_participants' AND column_name = 'created_at' AND is_nullable = 'YES'
            ) THEN
                ALTER TABLE hackathon_participants ALTER COLUMN created_at SET NOT NULL;
            END IF;
            
            -- task_comments.created_at - оставляем nullable (в модели nullable=True не указано явно, но по умолчанию)
            -- Не трогаем, оставляем как есть
        END$$;
    """)
    
    # 3. Создать индекс для project_required_roles если отсутствует
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_project_required_roles_id 
        ON project_required_roles (id)
    """)
    
    # 4. Убедиться, что уникальное ограничение для project_required_roles существует
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'uq_project_role'
            ) THEN
                ALTER TABLE project_required_roles 
                ADD CONSTRAINT uq_project_role UNIQUE (project_id, role_name);
            END IF;
        END$$;
    """)


def downgrade() -> None:
    """Откат изменений"""
    
    # Восстановить prize_pool (если нужно)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'hackathons' AND column_name = 'prize_pool'
            ) THEN
                ALTER TABLE hackathons ADD COLUMN prize_pool VARCHAR;
            END IF;
        END$$;
    """)
    
    # Убрать NOT NULL с created_at (не рекомендуется, но для отката)
    # Оставляем как есть, так как это может сломать данные
