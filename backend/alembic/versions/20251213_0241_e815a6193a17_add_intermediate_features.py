"""add_intermediate_features

Revision ID: e815a6193a17
Revises: 2faf4c113dc4
Create Date: 2025-12-13 02:41:43.264165

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'e815a6193a17'
down_revision: Union[str, None] = '2faf4c113dc4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add priority column to tasks
    op.add_column('tasks', sa.Column('priority', sa.String(length=20), server_default='medium', nullable=False))
    op.create_index('ix_tasks_priority', 'tasks', ['priority'])

    # Add due_date column to tasks
    op.add_column('tasks', sa.Column('due_date', sa.DateTime(), nullable=True))
    op.create_index('ix_tasks_due_date', 'tasks', ['due_date'])

    # Add recurring task columns
    op.add_column('tasks', sa.Column('is_recurring', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('tasks', sa.Column('recurrence_pattern', sa.String(length=50), nullable=True))
    op.add_column('tasks', sa.Column('recurrence_data', sa.JSON(), nullable=True))
    op.add_column('tasks', sa.Column('parent_recurring_id', sa.Integer(), nullable=True))

    # Create task_categories table
    op.create_table(
        'task_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('color', sa.String(length=20), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_user_category_name')
    )
    op.create_index('ix_task_categories_user_id', 'task_categories', ['user_id'])

    # Create task_category_mappings table (many-to-many)
    op.create_table(
        'task_category_mappings',
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['task_categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('task_id', 'category_id')
    )


def downgrade() -> None:
    # Drop task_category_mappings table
    op.drop_table('task_category_mappings')

    # Drop task_categories table
    op.drop_index('ix_task_categories_user_id', table_name='task_categories')
    op.drop_table('task_categories')

    # Remove recurring columns from tasks
    op.drop_column('tasks', 'parent_recurring_id')
    op.drop_column('tasks', 'recurrence_data')
    op.drop_column('tasks', 'recurrence_pattern')
    op.drop_column('tasks', 'is_recurring')

    # Remove due_date from tasks
    op.drop_index('ix_tasks_due_date', table_name='tasks')
    op.drop_column('tasks', 'due_date')

    # Remove priority from tasks
    op.drop_index('ix_tasks_priority', table_name='tasks')
    op.drop_column('tasks', 'priority')
