"""Gemini model configuration for OpenAI Agents SDK.

This module provides model configuration for the OpenAI Agents SDK
using Gemini's OpenAI-compatible endpoint via AsyncOpenAI.

The native MCP integration in OpenAI Agents SDK means we DON'T need
@function_tool wrappers - the agent connects directly to MCP servers!
"""

from openai import AsyncOpenAI
from agents import OpenAIChatCompletionsModel

from src.core.config import settings

# Gemini's OpenAI-compatible endpoint
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


def get_gemini_client() -> AsyncOpenAI:
    """Create AsyncOpenAI client configured for Gemini API.

    Returns:
        AsyncOpenAI: Client configured for Gemini's OpenAI-compatible endpoint

    Raises:
        ValueError: If GEMINI_API_KEY is not configured
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured. "
            "Please set it in your .env file."
        )

    return AsyncOpenAI(
        api_key=api_key,
        base_url=GEMINI_BASE_URL,
    )


def get_gemini_model(model_name: str | None = None) -> OpenAIChatCompletionsModel:
    """Create OpenAIChatCompletionsModel wrapper for Gemini.

    This uses Gemini's OpenAI-compatible endpoint which works
    with the OpenAI Agents SDK's OpenAIChatCompletionsModel wrapper.

    Args:
        model_name: Optional model name override. Defaults to settings.GEMINI_MODEL

    Returns:
        OpenAIChatCompletionsModel: Model configured for Gemini
    """
    client = get_gemini_client()
    model = model_name or settings.GEMINI_MODEL

    return OpenAIChatCompletionsModel(
        model=model,
        openai_client=client,
    )


def get_mcp_server_url() -> str:
    """Get the MCP server URL from settings.

    Returns:
        str: MCP server URL for Streamable HTTP transport.
              FastMCP HTTP transport serves at the root when no path specified.
    """
    return settings.MCP_SERVER_URL.rstrip("/")


__all__ = [
    "get_gemini_client",
    "get_gemini_model",
    "get_mcp_server_url",
    "GEMINI_BASE_URL",
]
