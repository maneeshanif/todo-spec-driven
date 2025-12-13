"""User model definition."""
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import TYPE_CHECKING, List
import uuid

if TYPE_CHECKING:
    from src.models.task import Task
    from src.models.category import TaskCategory


class User(SQLModel, table=True):
    """User model for authentication and task ownership."""

    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True, nullable=False)
    name: str = Field(max_length=255, nullable=False)
    hashed_password: str = Field(max_length=255, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    tasks: List["Task"] = Relationship(back_populates="user", cascade_delete=True)
    categories: List["TaskCategory"] = Relationship(back_populates="user", cascade_delete=True)
