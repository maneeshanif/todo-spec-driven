"""Authentication middleware for JWT token validation."""
from typing import Callable
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from src.core.security import verify_token


async def auth_middleware(request: Request, call_next: Callable):
    """
    Middleware to validate JWT tokens on protected routes.
    
    Validates Authorization header and attaches user_id to request state.
    Routes under /api/auth are excluded from validation.
    
    Args:
        request: FastAPI Request object
        call_next: Next middleware/route handler
        
    Returns:
        Response from next handler or error response
    """
    # Skip auth for public routes
    if request.url.path.startswith("/api/auth") or request.url.path in ["/", "/health"]:
        return await call_next(request)
    
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Missing or invalid Authorization header"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    
    if payload is None:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid or expired token"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Attach user_id to request state for downstream handlers
    request.state.user_id = payload.get("sub")
    
    return await call_next(request)
