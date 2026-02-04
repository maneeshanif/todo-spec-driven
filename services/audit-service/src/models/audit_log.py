"""Audit log model for tracking user actions."""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, JSON, Column
from sqlalchemy import Index


class AuditLog(SQLModel, table=True):
    """
    Audit log for tracking user actions and security events.

    Stores immutable records of all significant user actions for:
    - Security auditing
    - Compliance requirements
    - Debugging and troubleshooting
    - User activity analysis
    """

    __tablename__ = "audit_logs"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Who performed the action
    user_id: Optional[str] = Field(
        default=None,
        index=True,
        description="User who performed the action (null for system actions)"
    )

    # What action was performed
    action: str = Field(
        max_length=100,
        index=True,
        description="Action type (e.g., task.created, task.updated, task.deleted, auth.login)"
    )

    # Which resource was affected
    resource_type: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Type of resource affected (e.g., task, user)"
    )

    resource_id: Optional[str] = Field(
        default=None,
        description="ID of the resource affected"
    )

    # Request context
    request_id: Optional[str] = Field(
        default=None,
        description="Request ID for correlation with logs"
    )

    ip_address: Optional[str] = Field(
        default=None,
        max_length=45,
        description="IP address of the request (IPv4 or IPv6)"
    )

    user_agent: Optional[str] = Field(
        default=None,
        max_length=500,
        description="User agent string from request"
    )

    # Action details
    details: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON),
        description="JSON object with action-specific details"
    )

    # Status
    status: str = Field(
        max_length=20,
        default="success",
        description="Action status (success, failure, error)"
    )

    error_message: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Error message if action failed"
    )

    # Timing
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        index=True,
        description="When the action occurred"
    )

    # Indexes for common queries
    __table_args__ = (
        # Index for querying user activity
        Index('ix_audit_logs_user_created', 'user_id', 'created_at'),

        # Index for querying by action type
        Index('ix_audit_logs_action_created', 'action', 'created_at'),

        # Index for querying resource changes
        Index('ix_audit_logs_resource', 'resource_type', 'resource_id'),
    )
