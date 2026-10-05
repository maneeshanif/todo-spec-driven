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


def get_gemini_model(model_name: str | None = None):
    """Create the Gemini model used by the OpenAI Agents SDK.

    Gemini 3.x requires a "thought signature" to be sent back with every tool
    call. The plain OpenAI-compatible endpoint (OpenAIChatCompletionsModel)
    drops it, so the second model turn fails with HTTP 400. LiteLLM keeps the
    signature, so we route Gemini through LitellmModel instead.

    Args:
        model_name: Optional model name override. Defaults to settings.GEMINI_MODEL

    Returns:
        LitellmModel: Model configured for Gemini

    Raises:
        ValueError: If GEMINI_API_KEY is not configured
    """
    from agents.extensions.models.litellm_model import LitellmModel

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured. "
            "Please set it in your .env file."
        )

    model = (model_name or settings.GEMINI_MODEL).removeprefix("gemini/")

    return RetryingModel(LitellmModel(model=f"gemini/{model}", api_key=api_key))


_TRANSIENT_MARKERS = ("503", "unavailable", "high demand", "overloaded", "429", "rate limit")
_RETRY_DELAYS = (1.0, 2.0, 4.0, 6.0, 8.0)  # seconds between attempts


def _is_transient(error: Exception) -> bool:
    text = f"{type(error).__name__} {error}".lower()
    return any(marker in text for marker in _TRANSIENT_MARKERS)


def _build_retrying_model_class():
    """Define RetryingModel lazily so importing this module stays cheap."""
    import asyncio
    import logging

    from agents import Model

    logger = logging.getLogger("todobot.model")

    class RetryingModel(Model):
        """Retry a model call when Gemini answers 503 "high demand".

        Only the LLM request is repeated, never the whole agent run, so tools
        that already ran are not executed twice. A retry only happens if the
        failed call produced no output yet.
        """

        def __init__(self, inner: Model):
            self._inner = inner

        async def get_response(self, *args, **kwargs):
            for attempt, delay in enumerate((*_RETRY_DELAYS, None)):
                try:
                    return await self._inner.get_response(*args, **kwargs)
                except Exception as error:
                    if delay is None or not _is_transient(error):
                        raise
                    logger.warning("Gemini busy (attempt %d), retrying in %.0fs", attempt + 1, delay)
                    await asyncio.sleep(delay)

        async def stream_response(self, *args, **kwargs):
            for attempt, delay in enumerate((*_RETRY_DELAYS, None)):
                started = False
                try:
                    async for event in self._inner.stream_response(*args, **kwargs):
                        started = True
                        yield event
                    return
                except Exception as error:
                    if started or delay is None or not _is_transient(error):
                        raise
                    logger.warning("Gemini busy (attempt %d), retrying in %.0fs", attempt + 1, delay)
                    await asyncio.sleep(delay)

    return RetryingModel


def RetryingModel(inner):  # noqa: N802 - behaves like a class
    return _build_retrying_model_class()(inner)


def get_mcp_server_url(user_id: str | None = None) -> str:
    """Get the MCP server URL from settings.

    Args:
        user_id: Optional user ID to include in the URL for per-user context.
                 When provided, appended as query parameter for task isolation.

    Returns:
        str: MCP server URL for Streamable HTTP transport.
              FastMCP HTTP transport serves at the root when no path specified.
    """
    base_url = settings.MCP_SERVER_URL.rstrip("/")
    if user_id:
        # Include user_id as query parameter for task isolation
        return f"{base_url}?user_id={user_id}"
    return base_url


__all__ = [
    "get_gemini_client",
    "get_gemini_model",
    "get_mcp_server_url",
    "GEMINI_BASE_URL",
]
