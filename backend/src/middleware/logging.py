"""Request logging middleware."""
import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from src.core.logging import get_logger
from src.utils.metrics import metrics_collector

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP requests and responses.

    Logs:
    - Request ID (generated UUID)
    - HTTP method
    - URL path
    - Status code
    - Response time in milliseconds
    - User ID (if authenticated)
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Start timer
        start_time = time.time()

        # Extract user ID from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)

        # Log request
        logger.info(
            f"Request started",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "client_ip": request.client.host if request.client else None,
                "user_id": user_id,
            }
        )

        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log unhandled errors
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                f"Request failed with exception",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round(duration_ms, 2),
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
                exc_info=True
            )
            raise

        # Calculate response time
        duration_ms = (time.time() - start_time) * 1000

        # Get response size if available
        response_size = 0
        if hasattr(response, "body"):
            response_size = len(response.body)

        # Record metrics for Prometheus
        metrics_collector.record_request(
            method=request.method,
            path=request.url.path,
            duration_ms=duration_ms,
            status_code=response.status_code,
            response_size=response_size
        )

        # Log response
        logger.info(
            f"Request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "user_id": user_id,
            }
        )

        # Add request ID to response headers for tracing
        response.headers["X-Request-ID"] = request_id

        return response
