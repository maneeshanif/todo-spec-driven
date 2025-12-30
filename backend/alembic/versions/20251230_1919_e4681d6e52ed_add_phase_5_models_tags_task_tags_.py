"""Add Phase 5 models: tags, task_tags, reminders

Revision ID: e4681d6e52ed
Revises: 5512fd3c7cb8
Create Date: 2025-12-30 19:19:35.788102

Phase 5 adds:
- Tags table for task categorization
- TaskTags junction table for many-to-many relationship
- Reminders table for scheduled notifications
- New fields to Tasks table (reminder_at, next_occurrence)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e4681d6e52ed'
down_revision: Union[str, None] = '5512fd3c7cb8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ReminderStatus enum
    reminder_status = postgresql.ENUM('pending', 'sent', 'failed', name='reminderstatus', create_type=False)
    reminder_status.create(op.get_bind(), checkfirst=True)

    # Add new columns to tasks table
    op.add_column('tasks', sa.Column('reminder_at', sa.DateTime(), nullable=True))
    op.add_column('tasks', sa.Column('next_occurrence', sa.DateTime(), nullable=True))
    op.create_index('ix_tasks_reminder_at', 'tasks', ['reminder_at'])
    op.create_index('ix_tasks_next_occurrence', 'tasks', ['next_occurrence'])

    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('color', sa.String(7), nullable=False, server_default='#808080'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], name='tags_user_id_fkey', ondelete='CASCADE', use_alter=True),
        sa.UniqueConstraint('user_id', 'name', name='uq_tags_user_name'),
    )
    op.create_index('idx_tags_user_id', 'tags', ['user_id'])

    # Create task_tags junction table
    op.create_table(
        'task_tags',
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], name='task_tags_task_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], name='task_tags_tag_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('task_id', 'tag_id'),
    )
    op.create_index('idx_task_tags_tag_id', 'task_tags', ['tag_id'])

    # Create reminders table
    op.create_table(
        'reminders',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('remind_at', sa.DateTime(), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'sent', 'failed', name='reminderstatus', create_type=False), nullable=False, server_default='pending'),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('dapr_job_name', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], name='reminders_task_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], name='reminders_user_id_fkey', ondelete='CASCADE', use_alter=True),
    )
    op.create_index('ix_reminders_task_id', 'reminders', ['task_id'])
    op.create_index('ix_reminders_user_id', 'reminders', ['user_id'])
    op.create_index('ix_reminders_remind_at', 'reminders', ['remind_at'])
    op.create_index('ix_reminders_status', 'reminders', ['status'])


def downgrade() -> None:
    # Drop reminders table
    op.drop_index('ix_reminders_status', 'reminders')
    op.drop_index('ix_reminders_remind_at', 'reminders')
    op.drop_index('ix_reminders_user_id', 'reminders')
    op.drop_index('ix_reminders_task_id', 'reminders')
    op.drop_table('reminders')

    # Drop task_tags table
    op.drop_index('idx_task_tags_tag_id', 'task_tags')
    op.drop_table('task_tags')

    # Drop tags table
    op.drop_index('idx_tags_user_id', 'tags')
    op.drop_table('tags')

    # Remove new columns from tasks table
    op.drop_index('ix_tasks_next_occurrence', 'tasks')
    op.drop_index('ix_tasks_reminder_at', 'tasks')
    op.drop_column('tasks', 'next_occurrence')
    op.drop_column('tasks', 'reminder_at')

    # Drop ReminderStatus enum
    reminder_status = postgresql.ENUM('pending', 'sent', 'failed', name='reminderstatus')
    reminder_status.drop(op.get_bind(), checkfirst=True)
