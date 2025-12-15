"""drop_old_users_table

Revision ID: 823e89cc07f2
Revises: 53134e7b7865
Create Date: 2025-12-14 00:08:42.468682

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '823e89cc07f2'
down_revision: Union[str, None] = '53134e7b7865'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop old users table and update foreign keys to reference Better Auth user table."""
    # Drop foreign key constraints from tables that reference users
    op.drop_constraint('tasks_user_id_fkey', 'tasks', type_='foreignkey')
    op.drop_constraint('task_categories_user_id_fkey', 'task_categories', type_='foreignkey')
    
    # Delete all existing data since user IDs will be different with Better Auth
    op.execute('DELETE FROM task_category_mappings')
    op.execute('DELETE FROM task_categories')
    op.execute('DELETE FROM tasks')
    op.execute('DELETE FROM audit_logs')
    
    # Drop the old users table
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
    
    # Add foreign keys to Better Auth user table
    op.create_foreign_key(
        'tasks_user_id_fkey',
        'tasks', 'user',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'task_categories_user_id_fkey',
        'task_categories', 'user',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    """Recreate old users table if needed."""
    # Drop the Better Auth foreign keys
    op.drop_constraint('tasks_user_id_fkey', 'tasks', type_='foreignkey')
    op.drop_constraint('task_categories_user_id_fkey', 'task_categories', type_='foreignkey')
    
    # Recreate old users table
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    
    # Restore original foreign keys
    op.create_foreign_key(
        'tasks_user_id_fkey',
        'tasks', 'users',
        ['user_id'], ['id']
    )
    op.create_foreign_key(
        'task_categories_user_id_fkey',
        'task_categories', 'users',
        ['user_id'], ['id']
    )
