"""
Configuration settings for Recurring Task Service.

All configuration values can be overridden via environment variables.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Service configuration
    dapr_app_id: str = "recurring-task-service"
    port: int = 8003

    # Dapr configuration
    dapr_http_port: int = 3500
    dapr_grpc_port: int = 50001

    # Backend service (for task creation via Service Invocation)
    backend_app_id: str = "backend"

    # Pub/Sub configuration
    pubsub_name: str = "taskpubsub"
    task_events_topic: str = "task-events"

    # Service invocation timeout (seconds)
    service_invocation_timeout: int = 30

    # Logging
    log_level: str = "INFO"


# Global settings instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """Get or create the global settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
