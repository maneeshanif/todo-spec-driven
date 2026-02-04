"""Configuration for Notification Service."""
import os
from functools import lru_cache
from typing import Literal


class Config:
    """Application configuration."""

    # Service configuration
    app_title: str = "Notification Service"
    app_version: str = "1.0.0"
    app_port: int = int(os.getenv("APP_PORT", "8002"))

    # Dapr configuration
    dapr_http_port: str = os.getenv("DAPR_HTTP_PORT", "3500")
    dapr_pubsub_name: str = os.getenv("DAPR_PUBSUB_NAME", "taskpubsub")
    dapr_app_id: str = "notification-service"

    # Topic names
    reminders_topic: str = os.getenv("REMINDERS_TOPIC", "reminders")
    task_updates_topic: str = os.getenv("TASK_UPDATES_TOPIC", "task-updates")

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = os.getenv(
        "LOG_LEVEL", "INFO"
    )

    # Retry configuration
    max_retries: int = int(os.getenv("MAX_RETRIES", "3"))
    retry_delay_seconds: int = int(os.getenv("RETRY_DELAY_SECONDS", "1"))


@lru_cache()
def get_config() -> Config:
    """Get cached configuration instance."""
    return Config()
