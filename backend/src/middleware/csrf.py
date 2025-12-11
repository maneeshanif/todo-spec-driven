"""CSRF protection middleware."""
import secrets
from typing import Callable
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from src.core.logging import get_logger

logger = get_logger(__name__)


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF (Cross-Site Request Forgery) protection middleware.

    For JWT-based APIs, CSRF protection is less critical since we're not using
    cookies for authentication. However, if cookies are used in the future,
    this middleware provides protection.

    How it works:
    1. GET requests receive a CSRF token in response header
    2. POST/PUT/PATCH/DELETE requests must include the token
    3. Token is validated before processing the request

    Note: This is a basic implementation. For production, consider using
    a library like fastapi-csrf-protect or Django's CSRF implementation.
    """

    def __init__(self, app):
        super().__init__(app)
        # In-memory token store (use Redis in production for multi-instance deployments)
        self.tokens = set()
        self.enabled = True  # Can be disabled via environment variable

    def generate_token(self) -> str:
        """Generate a new CSRF token."""
        token = secrets.token_urlsafe(32)
        self.tokens.add(token)
        return token

    def validate_token(self, token: str) -> bool:
        """Validate a CSRF token."""
        return token in self.tokens

    def should_check_csrf(self, request: Request) -> bool:
        """
        Determine if CSRF check is needed for this request.

        CSRF check is NOT needed for:
        - Safe methods (GET, HEAD, OPTIONS)
        - Requests with JWT token (already authenticated via bearer token)
        - Health check endpoints
        - API documentation endpoints
        """
        # Safe HTTP methods don't need CSRF protection
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return False

        # Exempt certain paths
        exempt_paths = [
            "/api/health",
            "/api/docs",
            "/api/redoc",
            "/api/openapi.json",
        ]

        if request.url.path in exempt_paths:
            return False

        # If using JWT authentication (Authorization header), CSRF is not needed
        # because tokens are not automatically sent by browsers like cookies
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return False

        return True

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.enabled:
            return await call_next(request)

        # For GET requests, generate and send CSRF token
        if request.method == "GET":
            response = await call_next(request)
            csrf_token = self.generate_token()
            response.headers["X-CSRF-Token"] = csrf_token
            return response

        # For state-changing requests, validate CSRF token
        if self.should_check_csrf(request):
            csrf_token = request.headers.get("X-CSRF-Token")

            if not csrf_token:
                logger.warning(
                    "CSRF token missing",
                    extra={
                        "method": request.method,
                        "path": request.url.path,
                        "client_ip": request.client.host if request.client else None,
                    }
                )
                raise HTTPException(
                    status_code=403,
                    detail="CSRF token missing. Include X-CSRF-Token header."
                )

            if not self.validate_token(csrf_token):
                logger.warning(
                    "Invalid CSRF token",
                    extra={
                        "method": request.method,
                        "path": request.url.path,
                        "client_ip": request.client.host if request.client else None,
                    }
                )
                raise HTTPException(
                    status_code=403,
                    detail="Invalid CSRF token."
                )

        # Process request
        response = await call_next(request)
        return response


# Note: For JWT-based authentication (as in this app), CSRF protection
# is typically not needed since we're using the Authorization header
# rather than cookies. This middleware is provided for completeness
# and can be enabled if cookie-based sessions are added in the future.
