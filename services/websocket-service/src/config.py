"""Configuration for WebSocket Service."""
from pydantic_settings import BaseSettings
from functools import lru_cache
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Service configuration
    app_name: str = "WebSocket Service"
    app_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8005

    # Dapr configuration
    dapr_http_port: int = 3500
    dapr_grpc_port: int = 50001
    dapr_pubsub_name: str = "taskpubsub"
    dapr_topic: str = "task-updates"

    # JWT authentication
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"

    # WebSocket configuration
    heartbeat_interval: int = 30  # seconds
    connection_timeout: int = 300  # seconds
    max_connections_per_user: int = 10

    # Logging
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
