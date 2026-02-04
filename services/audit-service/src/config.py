"""Configuration settings for the Audit Service."""
import os
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Service configuration
    service_name: str = "audit-service"
    service_version: str = "1.0.0"
    port: int = 8004

    # Database configuration
    database_url: str

    # Dapr configuration
    dapr_http_port: int = 3504
    dapr_grpc_port: int = 50004
    pubsub_name: str = "taskpubsub"
    topic_name: str = "task-events"

    # CORS configuration
    cors_origins: list[str] = ["*"]
    cors_credentials: bool = True
    cors_methods: list[str] = ["*"]
    cors_headers: list[str] = ["*"]

    # Logging configuration
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @classmethod
    def get_database_url(cls) -> str:
        """Get the database URL for async connection."""
        return os.getenv("DATABASE_URL", "")


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()
