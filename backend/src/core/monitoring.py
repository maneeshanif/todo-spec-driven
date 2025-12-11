"""Monitoring and error tracking setup."""
import os
from typing import Optional
from src.core.logging import get_logger

logger = get_logger(__name__)


class ErrorTracker:
    """
    Error tracking integration (Sentry, etc.).

    This class provides a unified interface for error tracking services.
    Currently configured for Sentry, but can be extended for other services.
    """

    def __init__(self):
        self.enabled = False
        self.sentry_dsn = os.getenv("SENTRY_DSN")

        if self.sentry_dsn:
            self._init_sentry()

    def _init_sentry(self):
        """Initialize Sentry error tracking."""
        try:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration
            from sentry_sdk.integrations.starlette import StarletteIntegration

            sentry_sdk.init(
                dsn=self.sentry_dsn,
                # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring.
                # Adjust this value in production to reduce costs.
                traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
                # Set profiles_sample_rate to profile 10% of sampled transactions.
                profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.1")),
                environment=os.getenv("ENVIRONMENT", "development"),
                integrations=[
                    StarletteIntegration(),
                    FastApiIntegration(),
                ],
            )

            self.enabled = True
            logger.info("Sentry error tracking initialized")

        except ImportError:
            logger.warning(
                "Sentry SDK not installed. Install with: uv add sentry-sdk[fastapi]"
            )
        except Exception as e:
            logger.error(f"Failed to initialize Sentry: {e}")

    def capture_exception(
        self,
        exception: Exception,
        context: Optional[dict] = None
    ):
        """
        Capture an exception for error tracking.

        Args:
            exception: The exception to capture
            context: Additional context to attach to the error
        """
        if not self.enabled:
            logger.error(
                f"Exception occurred (error tracking disabled): {exception}",
                extra=context or {},
                exc_info=True
            )
            return

        try:
            import sentry_sdk

            if context:
                with sentry_sdk.push_scope() as scope:
                    for key, value in context.items():
                        scope.set_extra(key, value)
                    sentry_sdk.capture_exception(exception)
            else:
                sentry_sdk.capture_exception(exception)

        except Exception as e:
            logger.error(f"Failed to capture exception in Sentry: {e}")

    def capture_message(
        self,
        message: str,
        level: str = "info",
        context: Optional[dict] = None
    ):
        """
        Capture a message for tracking.

        Args:
            message: The message to capture
            level: Severity level (debug, info, warning, error, fatal)
            context: Additional context
        """
        if not self.enabled:
            getattr(logger, level, logger.info)(message, extra=context or {})
            return

        try:
            import sentry_sdk

            if context:
                with sentry_sdk.push_scope() as scope:
                    for key, value in context.items():
                        scope.set_extra(key, value)
                    sentry_sdk.capture_message(message, level=level)
            else:
                sentry_sdk.capture_message(message, level=level)

        except Exception as e:
            logger.error(f"Failed to capture message in Sentry: {e}")


class PerformanceMonitor:
    """
    Performance monitoring for API endpoints.

    Tracks response times, throughput, and other performance metrics.
    """

    def __init__(self):
        self.enabled = os.getenv("ENABLE_PERFORMANCE_MONITORING", "false").lower() == "true"
        self.metrics = {
            "requests": 0,
            "errors": 0,
            "total_duration_ms": 0,
        }

    def record_request(self, duration_ms: float, status_code: int):
        """
        Record a request for performance tracking.

        Args:
            duration_ms: Request duration in milliseconds
            status_code: HTTP status code
        """
        if not self.enabled:
            return

        self.metrics["requests"] += 1
        self.metrics["total_duration_ms"] += duration_ms

        if status_code >= 400:
            self.metrics["errors"] += 1

    def get_stats(self) -> dict:
        """Get current performance statistics."""
        total_requests = self.metrics["requests"]

        return {
            "total_requests": total_requests,
            "total_errors": self.metrics["errors"],
            "error_rate": self.metrics["errors"] / total_requests if total_requests > 0 else 0,
            "avg_response_time_ms": (
                self.metrics["total_duration_ms"] / total_requests
                if total_requests > 0
                else 0
            ),
        }

    def reset_stats(self):
        """Reset performance statistics."""
        self.metrics = {
            "requests": 0,
            "errors": 0,
            "total_duration_ms": 0,
        }


# Global instances
error_tracker = ErrorTracker()
performance_monitor = PerformanceMonitor()


def get_error_tracker() -> ErrorTracker:
    """Get the global error tracker instance."""
    return error_tracker


def get_performance_monitor() -> PerformanceMonitor:
    """Get the global performance monitor instance."""
    return performance_monitor
