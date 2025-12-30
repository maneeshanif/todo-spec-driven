"""Application configuration using Pydantic settings."""
from pydantic_settings import BaseSettings
from pydantic import PostgresDsn
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: PostgresDsn

    # JWT Configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    # Application
    APP_NAME: str = "Todo Web Application"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Phase 3: AI Chatbot Configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # MCP Server Configuration
    # FastMCP HTTP transport serves at root path (no /mcp suffix)
    MCP_SERVER_URL: str = "http://localhost:8001"
    MCP_SERVER_PORT: int = 8001

    # Phase 5: Dapr Configuration
    DAPR_HTTP_PORT: str = "3500"
    DAPR_HOST: str = "localhost"
    DAPR_PUBSUB_NAME: str = "kafka-pubsub"  # Dapr pub/sub component name

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
