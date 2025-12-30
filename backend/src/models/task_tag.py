"""TaskTag junction model for many-to-many relationship between tasks and tags."""
from sqlmodel import SQLModel, Field, Column
import sqlalchemy as sa


class TaskTag(SQLModel, table=True):
    """Many-to-many mapping between tasks and tags.

    This junction table allows tasks to have multiple tags,
    and tags to be associated with multiple tasks.

    Cascading deletes:
    - When a task is deleted, all task-tag associations are removed
    - When a tag is deleted, all task-tag associations are removed
    """

    __tablename__ = "task_tags"

    task_id: int = Field(
        sa_column=Column(
            sa.Integer,
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            primary_key=True
        ),
        description="Reference to task"
    )
    tag_id: int = Field(
        sa_column=Column(
            sa.Integer,
            sa.ForeignKey("tags.id", ondelete="CASCADE"),
            primary_key=True
        ),
        description="Reference to tag"
    )
