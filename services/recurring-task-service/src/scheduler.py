"""
Recurring Task Scheduler

Calculates next occurrence dates for recurring tasks and invokes
the backend API to create the next task using Dapr Service Invocation.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

import httpx
from dateutil.relativedelta import relativedelta

from .config import get_settings

logger = logging.getLogger(__name__)


class RecurringTaskScheduler:
    """Scheduler for recurring task next occurrences."""

    # Pattern to relativedelta mapping
    PATTERN_MAP = {
        "daily": {"days": 1},
        "weekly": {"weeks": 1},
        "monthly": {"months": 1},
    }

    def __init__(self):
        """Initialize scheduler with configuration."""
        self.settings = get_settings()
        self.dapr_http_port = self.settings.dapr_http_port
        self.backend_app_id = self.settings.backend_app_id
        self.timeout = self.settings.service_invocation_timeout

    def calculate_next_occurrence(
        self,
        current_date: datetime,
        pattern: str
    ) -> datetime:
        """Calculate the next occurrence date based on pattern.

        Args:
            current_date: The current task date (due_date or created_at)
            pattern: Recurring pattern (daily, weekly, monthly)

        Returns:
            datetime: Next occurrence date

        Raises:
            ValueError: If pattern is not supported
        """
        if pattern not in self.PATTERN_MAP:
            raise ValueError(
                f"Unsupported recurring pattern: {pattern}. "
                f"Supported patterns: {list(self.PATTERN_MAP.keys())}"
            )

        delta_args = self.PATTERN_MAP[pattern]

        if pattern == "monthly":
            # Use relativedelta for month handling (handles month end correctly)
            next_date = current_date + relativedelta(**delta_args)
        else:
            # Use timedelta for daily/weekly
            next_date = current_date + timedelta(**delta_args)

        logger.info(
            "Calculated next occurrence",
            extra={
                "current_date": current_date.isoformat(),
                "pattern": pattern,
                "next_date": next_date.isoformat()
            }
        )

        return next_date

    def _build_service_invocation_url(self, method_name: str) -> str:
        """Build Dapr service invocation URL.

        Args:
            method_name: Backend method to invoke (e.g., /api/tasks)

        Returns:
            str: Full Dapr service invocation URL
        """
        return (
            f"http://localhost:{self.dapr_http_port}"
            f"/v1.0/invoke/{self.backend_app_id}/method{method_name}"
        )

    async def create_next_occurrence(
        self,
        task_data: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """Create the next occurrence of a recurring task.

        1. Calculate next occurrence date
        2. Build task payload for new occurrence
        3. Invoke backend API via Dapr Service Invocation

        Args:
            task_data: Original task data
            user_id: User ID from event

        Returns:
            dict: Response from backend service

        Raises:
            httpx.HTTPError: If service invocation fails
            ValueError: If pattern is invalid
        """
        try:
            # Get recurring pattern
            recurring_pattern = task_data.get("recurring_pattern")
            if not recurring_pattern or recurring_pattern == "none":
                logger.info("Task is not recurring, skipping creation")
                return {"status": "skipped", "reason": "not_recurring"}

            # Calculate next occurrence date
            base_date = task_data.get("due_date") or task_data.get("created_at")
            if not base_date:
                base_date = datetime.utcnow()
            else:
                base_date = datetime.fromisoformat(base_date.replace("Z", "+00:00"))

            next_due_date = self.calculate_next_occurrence(
                current_date=base_date,
                pattern=recurring_pattern
            )

            # Build new task payload
            new_task_payload = {
                "title": task_data.get("title"),
                "description": task_data.get("description"),
                "priority": task_data.get("priority", "medium"),
                "recurring_pattern": recurring_pattern,
                "due_date": next_due_date.isoformat(),
                # Include tags if present
                "tags": task_data.get("tags", []),
            }

            logger.info(
                "Invoking backend to create next occurrence",
                extra={
                    "original_task_id": task_data.get("id"),
                    "user_id": user_id,
                    "new_task_title": new_task_payload["title"],
                    "next_due_date": next_due_date.isoformat()
                }
            )

            # Invoke backend API via Dapr Service Invocation
            url = self._build_service_invocation_url("/api/tasks")

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    json=new_task_payload,
                    headers={
                        "Content-Type": "application/json",
                        "X-User-ID": user_id  # Pass user context
                    }
                )

                # Handle non-2xx responses
                if response.status_code >= 400:
                    error_detail = response.text
                    logger.error(
                        f"Backend returned error: {response.status_code}",
                        extra={
                            "status_code": response.status_code,
                            "error_detail": error_detail,
                            "user_id": user_id
                        }
                    )
                    # Try to parse JSON error
                    try:
                        return response.json()
                    except Exception:
                        return {
                            "status": "error",
                            "status_code": response.status_code,
                            "detail": error_detail
                        }

                logger.info(
                    "Successfully created next occurrence",
                    extra={
                        "status_code": response.status_code,
                        "response": response.json() if response.headers.get("content-type") == "application/json" else response.text
                    }
                )

                return response.json()

        except httpx.TimeoutException:
            logger.error(
                "Backend service invocation timed out",
                extra={
                    "user_id": user_id,
                    "timeout": self.timeout
                }
            )
            raise

        except httpx.HTTPError as e:
            logger.error(
                f"HTTP error invoking backend: {str(e)}",
                extra={"error": str(e)},
                exc_info=True
            )
            raise

        except Exception as e:
            logger.error(
                f"Unexpected error creating next occurrence: {str(e)}",
                extra={"error": str(e)},
                exc_info=True
            )
            raise
