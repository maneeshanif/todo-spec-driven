"""Error handling utilities following RFC 7807 Problem Details."""
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from pydantic import BaseModel


class ProblemDetail(BaseModel):
    """RFC 7807 Problem Details for HTTP APIs."""
    type: str
    title: str
    status: int
    detail: Optional[str] = None
    instance: Optional[str] = None
    errors: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "type": "https://api.todo.com/errors/validation-error",
                "title": "Validation Error",
                "status": 422,
                "detail": "Invalid request body",
                "instance": "/api/auth/signup",
                "errors": {
                    "email": "Invalid email format"
                }
            }
        }


class AppException(HTTPException):
    """Base application exception with RFC 7807 support."""
    
    def __init__(
        self,
        status_code: int,
        title: str,
        detail: Optional[str] = None,
        error_type: Optional[str] = None,
        instance: Optional[str] = None,
        errors: Optional[Dict[str, Any]] = None,
    ):
        self.problem = ProblemDetail(
            type=error_type or f"https://api.todo.com/errors/{title.lower().replace(' ', '-')}",
            title=title,
            status=status_code,
            detail=detail,
            instance=instance,
            errors=errors,
        )
        super().__init__(status_code=status_code, detail=detail)


class ValidationError(AppException):
    """Validation error (422)."""
    
    def __init__(self, detail: str, errors: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            title="Validation Error",
            detail=detail,
            errors=errors,
        )


class NotFoundError(AppException):
    """Resource not found error (404)."""
    
    def __init__(self, resource: str, detail: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            title=f"{resource} Not Found",
            detail=detail or f"The requested {resource.lower()} was not found",
        )


class UnauthorizedError(AppException):
    """Unauthorized error (401)."""
    
    def __init__(self, detail: str = "Authentication required"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            title="Unauthorized",
            detail=detail,
        )


class ForbiddenError(AppException):
    """Forbidden error (403)."""
    
    def __init__(self, detail: str = "Access forbidden"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            title="Forbidden",
            detail=detail,
        )


class ConflictError(AppException):
    """Conflict error (409)."""
    
    def __init__(self, resource: str, detail: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            title=f"{resource} Conflict",
            detail=detail or f"The {resource.lower()} already exists",
        )
