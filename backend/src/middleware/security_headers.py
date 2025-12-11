"""Security headers middleware."""
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all HTTP responses.

    Headers added:
    - X-Content-Type-Options: Prevent MIME type sniffing
    - X-Frame-Options: Prevent clickjacking
    - X-XSS-Protection: Enable XSS filter (legacy browsers)
    - Strict-Transport-Security (HSTS): Enforce HTTPS
    - Content-Security-Policy (CSP): Restrict resource loading
    - Referrer-Policy: Control referrer information
    - Permissions-Policy: Control browser features
    """

    def __init__(self, app, enable_hsts: bool = True, enable_csp: bool = True):
        super().__init__(app)
        self.enable_hsts = enable_hsts
        self.enable_csp = enable_csp

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Enable XSS filter (for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # HSTS - Enforce HTTPS (only in production with HTTPS)
        if self.enable_hsts:
            # max-age: 1 year (31536000 seconds)
            # includeSubDomains: Apply to all subdomains
            # preload: Allow inclusion in browser HSTS preload list
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Content Security Policy
        if self.enable_csp:
            # Restrictive CSP for API responses
            # For an API, we mainly want to prevent any content execution
            csp_directives = [
                "default-src 'none'",  # Deny all by default
                "frame-ancestors 'none'",  # No framing allowed
                "base-uri 'self'",  # Restrict base tag
            ]
            response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # Referrer Policy - Control referrer information leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions Policy (formerly Feature-Policy)
        # Disable all unnecessary browser features
        permissions_directives = [
            "geolocation=()",
            "microphone=()",
            "camera=()",
            "payment=()",
            "usb=()",
            "magnetometer=()",
            "gyroscope=()",
            "accelerometer=()",
        ]
        response.headers["Permissions-Policy"] = ", ".join(permissions_directives)

        # Remove server header to avoid version disclosure
        if "server" in response.headers:
            del response.headers["server"]

        return response
