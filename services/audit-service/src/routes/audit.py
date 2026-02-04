"""Audit API routes for querying audit logs."""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import select, and_, func, desc
from sqlalchemy.exc import SQLAlchemyError

from ..models.audit_log import AuditLog
from ..config import get_settings
from ..logger import audit_logger

settings = get_settings()


# Response schemas
class AuditLogPublic(BaseModel):
    """Public audit log representation."""

    id: int
    user_id: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[dict] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Paginated audit log list response."""

    logs: List[AuditLogPublic]
    total: int = Field(description="Total number of logs matching the filters")
    page: int = Field(description="Current page number (1-indexed)")
    page_size: int = Field(description="Number of items per page")
    has_more: bool = Field(description="Whether there are more results")


router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get(
    "/task/{task_id}",
    response_model=AuditLogListResponse,
    summary="Get audit history for a task",
    description="Query all audit logs for a specific task with optional filtering by action type."
)
async def get_task_audit_history(
    task_id: str,
    action_type: Optional[str] = Query(
        None,
        description="Filter by action type (created, updated, deleted, completed)"
    ),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page (max 100)")
):
    """
    Get audit history for a specific task.

    **Path Parameters:**
    - **task_id**: Task ID to query audit logs for

    **Query Parameters:**
    - **action_type**: Filter by action type (created, updated, deleted, completed)
    - **page**: Page number (default 1)
    - **page_size**: Items per page (default 50, max 100)

    **Returns:**
    - Paginated list of audit logs
    - Includes user information and action details
    - Ordered by created_at descending (most recent first)

    **Errors:**
    - 400: Invalid parameters (e.g., invalid action_type)
    - 500: Database error
    """
    try:
        # Validate action_type if provided
        valid_actions = ["created", "updated", "deleted", "completed"]
        if action_type and action_type not in valid_actions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid action_type. Must be one of: {', '.join(valid_actions)}"
            )

        # Build query filters
        filters = [
            AuditLog.resource_type == "task",
            AuditLog.resource_id == task_id
        ]

        # Add action filter if specified
        if action_type:
            # Map action_type to full action name (e.g., "created" -> "task.created")
            action_filter = f"task.{action_type}"
            filters.append(AuditLog.action == action_filter)

        # Get database session
        async with audit_logger.async_session() as session:
            # Build base query
            query = select(AuditLog).where(and_(*filters))

            # Count total matching records
            count_query = select(func.count(AuditLog.id)).where(and_(*filters))
            count_result = await session.execute(count_query)
            total = count_result.scalar() or 0

            # Apply ordering (most recent first)
            query = query.order_by(desc(AuditLog.created_at))

            # Apply pagination
            offset = (page - 1) * page_size
            query = query.offset(offset).limit(page_size)

            # Execute query
            result = await session.execute(query)
            logs = result.scalars().all()

            # Convert to response format
            log_list = [AuditLogPublic.model_validate(log) for log in logs]

            # Check if there are more results
            has_more = (offset + len(log_list)) < total

            return AuditLogListResponse(
                logs=log_list,
                total=total,
                page=page,
                page_size=page_size,
                has_more=has_more
            )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except SQLAlchemyError as e:
        # Database error
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        # Unexpected error
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/user/{user_id}",
    response_model=AuditLogListResponse,
    summary="Get audit history for a user",
    description="Query all audit logs for a specific user with optional filtering by entity type and date range."
)
async def get_user_audit_history(
    user_id: str,
    entity_type: Optional[str] = Query(
        None,
        description="Filter by entity type (task, tag, reminder)"
    ),
    start_date: Optional[datetime] = Query(
        None,
        description="Filter by start date (inclusive)"
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="Filter by end date (inclusive)"
    ),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page (max 100)")
):
    """
    Get audit history for a specific user.

    **Path Parameters:**
    - **user_id**: User ID to query audit logs for

    **Query Parameters:**
    - **entity_type**: Filter by entity type (task, tag, reminder)
    - **start_date**: Filter by start date (ISO 8601 format)
    - **end_date**: Filter by end date (ISO 8601 format)
    - **page**: Page number (default 1)
    - **page_size**: Items per page (default 50, max 100)

    **Returns:**
    - Paginated list of audit logs
    - Includes action details and timestamps
    - Ordered by created_at descending (most recent first)

    **Errors:**
    - 400: Invalid parameters (e.g., invalid entity_type, end_date before start_date)
    - 500: Database error
    """
    try:
        # Validate entity_type if provided
        valid_entity_types = ["task", "tag", "reminder"]
        if entity_type and entity_type not in valid_entity_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid entity_type. Must be one of: {', '.join(valid_entity_types)}"
            )

        # Validate date range
        if start_date and end_date and end_date < start_date:
            raise HTTPException(
                status_code=400,
                detail="end_date must be after start_date"
            )

        # Build query filters
        filters = [AuditLog.user_id == user_id]

        # Add entity type filter if specified
        if entity_type:
            filters.append(AuditLog.resource_type == entity_type)

        # Add date range filters
        if start_date:
            filters.append(AuditLog.created_at >= start_date)
        if end_date:
            filters.append(AuditLog.created_at <= end_date)

        # Get database session
        async with audit_logger.async_session() as session:
            # Build base query
            query = select(AuditLog).where(and_(*filters))

            # Count total matching records
            count_query = select(func.count(AuditLog.id)).where(and_(*filters))
            count_result = await session.execute(count_query)
            total = count_result.scalar() or 0

            # Apply ordering (most recent first)
            query = query.order_by(desc(AuditLog.created_at))

            # Apply pagination
            offset = (page - 1) * page_size
            query = query.offset(offset).limit(page_size)

            # Execute query
            result = await session.execute(query)
            logs = result.scalars().all()

            # Convert to response format
            log_list = [AuditLogPublic.model_validate(log) for log in logs]

            # Check if there are more results
            has_more = (offset + len(log_list)) < total

            return AuditLogListResponse(
                logs=log_list,
                total=total,
                page=page,
                page_size=page_size,
                has_more=has_more
            )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except SQLAlchemyError as e:
        # Database error
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        # Unexpected error
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
