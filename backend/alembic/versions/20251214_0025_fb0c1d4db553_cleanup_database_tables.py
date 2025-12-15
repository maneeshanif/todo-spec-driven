"""cleanup_database_tables

Revision ID: fb0c1d4db553
Revises: 823e89cc07f2
Create Date: 2025-12-14 00:25:42.454889

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'fb0c1d4db553'
down_revision: Union[str, None] = '823e89cc07f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Clean up database by removing unused tables.
    Keep only: tasks, task_categories, task_category_mappings, user, session, account, verification, alembic_version
    Drop: audit_logs (optional/not critical), users (already removed)
    """
    # Drop audit_logs table if it exists (not critical for core functionality)
    op.execute("""
        DROP TABLE IF EXISTS audit_logs CASCADE;
    """)
    
    # Verify users table is gone (should already be dropped from previous migration)
    op.execute("""
        DROP TABLE IF EXISTS users CASCADE;
    """)
    
    print("✅ Database cleanup complete - removed audit_logs and verified users table removal")


def downgrade() -> None:
    """Recreate audit_logs table if needed."""
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=50), nullable=True),
        sa.Column('resource_id', sa.String(), nullable=True),
        sa.Column('request_id', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('error_message', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
