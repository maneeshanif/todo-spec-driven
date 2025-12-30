"""Dapr HTTP API client for job scheduling and pub/sub.

This module provides utilities for interacting with the Dapr sidecar HTTP API.
Dapr Jobs API is used for scheduling one-time reminder notifications.

Reference: https://docs.dapr.io/reference/api/jobs_api/
"""
import httpx
import os
from datetime import datetime, timezone
from typing import Dict, Optional
from src.core.logging import get_logger

logger = get_logger(__name__)

DAPR_HTTP_PORT = os.environ.get("DAPR_HTTP_PORT", "3500")
DAPR_HOST = os.environ.get("DAPR_HOST", "localhost")
DAPR_BASE_URL = f"http://{DAPR_HOST}:{DAPR_HTTP_PORT}"


class DaprClient:
    """Client for Dapr HTTP API."""

    @staticmethod
    async def is_available() -> bool:
        """Check if Dapr sidecar is available.

        Returns:
            True if Dapr is running and reachable, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                response = await client.get(f"{DAPR_BASE_URL}/v1.0/healthz")
                is_healthy = response.status_code == 200
                if is_healthy:
                    logger.info("Dapr sidecar is available")
                else:
                    logger.warning(f"Dapr health check failed: {response.status_code}")
                return is_healthy
        except Exception as e:
            logger.info(f"Dapr sidecar not available: {e}")
            return False

    @staticmethod
    async def schedule_job(job_name: str, schedule_time: datetime, data: dict) -> bool:
        """Schedule a one-time job using Dapr Jobs API.

        The job will trigger the callback endpoint at the specified time.

        Args:
            job_name: Unique job identifier (e.g., "reminder-123")
            schedule_time: When to trigger the job (UTC)
            data: Job payload data (will be sent to callback)

        Returns:
            True if job scheduled successfully, False if Dapr unavailable or error occurred
        """
        if not await DaprClient.is_available():
            logger.warning(f"Cannot schedule job '{job_name}': Dapr unavailable")
            return False

        try:
            # Format schedule time as ISO 8601 with timezone
            # Dapr expects RFC3339 format
            if schedule_time.tzinfo is None:
                # Assume UTC if no timezone
                schedule_time = schedule_time.replace(tzinfo=timezone.utc)

            schedule_str = schedule_time.isoformat()

            # Dapr Jobs API payload
            # Reference: https://docs.dapr.io/reference/api/jobs_api/#request-body
            payload = {
                "data": data,
                "dueTime": schedule_str,
                "repeats": 0,  # One-time job (no repeats)
                # Optional: set TTL to auto-delete job after execution
                "ttl": "1h"  # Job metadata expires 1 hour after execution
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                # POST /v1.0-alpha1/jobs/{jobName}
                response = await client.post(
                    f"{DAPR_BASE_URL}/v1.0-alpha1/jobs/{job_name}",
                    json=payload
                )

                if response.status_code in (200, 201, 204):
                    logger.info(
                        f"Successfully scheduled Dapr job '{job_name}' for {schedule_str}",
                        extra={"job_name": job_name, "due_time": schedule_str}
                    )
                    return True
                else:
                    logger.error(
                        f"Failed to schedule Dapr job '{job_name}': {response.status_code} - {response.text}",
                        extra={"job_name": job_name, "status": response.status_code}
                    )
                    return False

        except Exception as e:
            logger.error(
                f"Error scheduling Dapr job '{job_name}': {e}",
                extra={"job_name": job_name},
                exc_info=True
            )
            return False

    @staticmethod
    async def cancel_job(job_name: str) -> bool:
        """Cancel a scheduled job.

        Args:
            job_name: Job identifier to cancel

        Returns:
            True if job cancelled successfully, False if Dapr unavailable or job not found
        """
        if not await DaprClient.is_available():
            logger.warning(f"Cannot cancel job '{job_name}': Dapr unavailable")
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # DELETE /v1.0-alpha1/jobs/{jobName}
                response = await client.delete(
                    f"{DAPR_BASE_URL}/v1.0-alpha1/jobs/{job_name}"
                )

                if response.status_code in (200, 204):
                    logger.info(
                        f"Successfully cancelled Dapr job '{job_name}'",
                        extra={"job_name": job_name}
                    )
                    return True
                elif response.status_code == 404:
                    logger.warning(
                        f"Dapr job '{job_name}' not found (may have already executed)",
                        extra={"job_name": job_name}
                    )
                    return False
                else:
                    logger.error(
                        f"Failed to cancel Dapr job '{job_name}': {response.status_code} - {response.text}",
                        extra={"job_name": job_name, "status": response.status_code}
                    )
                    return False

        except Exception as e:
            logger.error(
                f"Error cancelling Dapr job '{job_name}': {e}",
                extra={"job_name": job_name},
                exc_info=True
            )
            return False

    @staticmethod
    async def publish_event(pubsub_name: str, topic: str, data: dict) -> bool:
        """Publish an event to a Dapr pub/sub topic.

        Args:
            pubsub_name: Name of the pub/sub component (e.g., "kafka-pubsub")
            topic: Topic name (e.g., "reminders")
            data: Event payload

        Returns:
            True if published successfully, False otherwise
        """
        if not await DaprClient.is_available():
            logger.warning(f"Cannot publish to topic '{topic}': Dapr unavailable")
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # POST /v1.0/publish/{pubsubName}/{topic}
                response = await client.post(
                    f"{DAPR_BASE_URL}/v1.0/publish/{pubsub_name}/{topic}",
                    json=data
                )

                if response.status_code in (200, 204):
                    logger.info(
                        f"Successfully published event to topic '{topic}'",
                        extra={"topic": topic, "pubsub": pubsub_name}
                    )
                    return True
                else:
                    logger.error(
                        f"Failed to publish to topic '{topic}': {response.status_code} - {response.text}",
                        extra={"topic": topic, "status": response.status_code}
                    )
                    return False

        except Exception as e:
            logger.error(
                f"Error publishing to topic '{topic}': {e}",
                extra={"topic": topic},
                exc_info=True
            )
            return False
