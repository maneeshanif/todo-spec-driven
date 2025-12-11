"""User model definition."""
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.models.task import Task


class User(SQLModel, table=True):
    """User model for authentication and task ownership."""
    
    __tablename__ = "users"
    
    id: str = Field(primary_key=True)  # UUID from Better Auth
    email: str = Field(max_length=255, unique=True, index=True, nullable=False)
    name: str = Field(max_length=255, nullable=False)
    hashed_password: str = Field(max_length=255, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    
    # Relationships
    tasks: list["Task"] = Relationship(back_populates="user", cascade_delete=True)
