"""FastAPI application entry point."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from src.core.config import settings
from src.core.errors import AppException
from src.core.logging import setup_logging, get_logger
from src.api import api_router
from src.middleware.logging import RequestLoggingMiddleware
from src.middleware.rate_limit import RateLimitMiddleware
from src.middleware.security_headers import SecurityHeadersMiddleware
# CSRF middleware available but disabled by default for JWT-based API
# from src.middleware.csrf import CSRFProtectionMiddleware

# Setup structured logging
setup_logging(level="INFO")
logger = get_logger(__name__)

# Create FastAPI app instance
app = FastAPI(
    title="Todo API",
    description="RESTful API for Todo Web Application",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS (must be first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security headers middleware
app.add_middleware(
    SecurityHeadersMiddleware,
    enable_hsts=True,  # Enable HSTS for production
    enable_csp=True,   # Enable Content Security Policy
)

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Add request logging middleware (should be last to log everything)
app.add_middleware(RequestLoggingMiddleware)

# CSRF protection middleware (disabled by default for JWT-based authentication)
# Only enable if using cookie-based sessions
# app.add_middleware(CSRFProtectionMiddleware)


# Global exception handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle application exceptions with RFC 7807 format."""
    logger.warning(
        f"Application exception: {exc.problem.title}",
        extra={
            "status_code": exc.problem.status,
            "path": str(request.url),
            "detail": exc.problem.detail,
        }
    )
    return JSONResponse(
        status_code=exc.problem.status,
        content=exc.problem.model_dump(exclude_none=True),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(
        f"Unexpected error: {str(exc)}",
        extra={
            "path": str(request.url),
            "error_type": type(exc).__name__,
        },
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "type": "https://api.todo.com/errors/internal-error",
            "title": "Internal Server Error",
            "status": 500,
            "detail": "An unexpected error occurred",
        },
    )


# Include API routes
app.include_router(api_router)


@app.get("/health")
async def health():
    """Simple health check endpoint for Docker/Kubernetes liveness probe."""
    return {
        "status": "healthy",
        "service": "todo-api",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "todo-api",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Todo API",
        "docs": "/api/docs",
        "health": "/api/health"
    }
