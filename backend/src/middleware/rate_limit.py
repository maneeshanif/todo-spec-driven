"""Rate limiting middleware for API endpoints."""
import time
from typing import Callable
from collections import defaultdict
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from src.core.logging import get_logger

logger = get_logger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware to prevent abuse.

    Implements a simple sliding window rate limiter.
    Limits are applied per IP address.

    Configuration:
    - Auth endpoints: 5 requests per minute
    - General endpoints: 100 requests per minute
    """

    def __init__(self, app):
        super().__init__(app)
        # Store: {ip: {endpoint: [(timestamp, count)]}}
        self.request_history = defaultdict(lambda: defaultdict(list))

        # Rate limits (requests per window in seconds)
        self.limits = {
            "/api/auth/login": (5, 60),  # 5 requests per 60 seconds
            "/api/auth/signup": (3, 60),  # 3 requests per 60 seconds (stricter)
            "default": (100, 60),  # 100 requests per 60 seconds for other endpoints
        }

    def get_client_ip(self, request: Request) -> str:
        """Get client IP address from request."""
        # Check for X-Forwarded-For header (when behind proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        # Fallback to direct client IP
        if request.client:
            return request.client.host

        return "unknown"

    def is_rate_limited(self, ip: str, endpoint: str) -> tuple[bool, int, int]:
        """
        Check if request should be rate limited.

        Returns:
            (is_limited, remaining, reset_time)
        """
        # Get rate limit for endpoint
        limit, window = self.limits.get(endpoint, self.limits["default"])

        current_time = time.time()
        cutoff_time = current_time - window

        # Clean up old entries
        history = self.request_history[ip][endpoint]
        self.request_history[ip][endpoint] = [
            (ts, count) for ts, count in history if ts > cutoff_time
        ]

        # Count requests in current window
        request_count = sum(count for _, count in self.request_history[ip][endpoint])

        if request_count >= limit:
            # Calculate when the rate limit will reset
            oldest_request = min(ts for ts, _ in self.request_history[ip][endpoint]) if self.request_history[ip][endpoint] else current_time
            reset_time = int(oldest_request + window - current_time)
            return True, 0, reset_time

        # Add current request
        self.request_history[ip][endpoint].append((current_time, 1))

        remaining = limit - request_count - 1
        return False, remaining, window

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get client IP
        client_ip = self.get_client_ip(request)

        # Get endpoint path
        endpoint = request.url.path

        # Check rate limit
        is_limited, remaining, reset_time = self.is_rate_limited(client_ip, endpoint)

        if is_limited:
            logger.warning(
                f"Rate limit exceeded",
                extra={
                    "client_ip": client_ip,
                    "endpoint": endpoint,
                    "reset_in": reset_time,
                }
            )

            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Try again in {reset_time} seconds.",
                headers={
                    "X-RateLimit-Limit": str(self.limits.get(endpoint, self.limits["default"])[0]),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + reset_time)),
                    "Retry-After": str(reset_time),
                },
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers to response
        limit_value = self.limits.get(endpoint, self.limits["default"])[0]
        response.headers["X-RateLimit-Limit"] = str(limit_value)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time() + reset_time))

        return response


def cleanup_old_entries(middleware: RateLimitMiddleware):
    """
    Periodic cleanup of old rate limit entries.

    Should be called periodically (e.g., every 5 minutes) to prevent memory growth.
    """
    current_time = time.time()

    for ip in list(middleware.request_history.keys()):
        for endpoint in list(middleware.request_history[ip].keys()):
            _, window = middleware.request_history[ip].get(endpoint, middleware.limits["default"])
            cutoff_time = current_time - window

            # Remove old entries
            middleware.request_history[ip][endpoint] = [
                (ts, count)
                for ts, count in middleware.request_history[ip][endpoint]
                if ts > cutoff_time
            ]

            # Remove empty endpoint entries
            if not middleware.request_history[ip][endpoint]:
                del middleware.request_history[ip][endpoint]

        # Remove empty IP entries
        if not middleware.request_history[ip]:
            del middleware.request_history[ip]

    logger.info(f"Cleaned up rate limit history. Active IPs: {len(middleware.request_history)}")
