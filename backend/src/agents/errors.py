"""Custom exception classes for AI agent errors.

This module provides:
- Custom exception hierarchy for AI-related errors
- User-friendly error message conversion
- Error classification for appropriate HTTP responses
"""

from enum import Enum
from typing import Optional


class ErrorCode(str, Enum):
    """Error codes for AI agent failures."""

    # Model API errors
    RATE_LIMIT = "rate_limit"
    AUTH_ERROR = "auth_error"
    CONNECTION_ERROR = "connection_error"
    MODEL_UNAVAILABLE = "model_unavailable"

    # Agent execution errors
    TIMEOUT = "timeout"
    TOOL_ERROR = "tool_error"
    INVALID_RESPONSE = "invalid_response"

    # Generic errors
    AGENT_ERROR = "agent_error"
    UNKNOWN = "unknown_error"


class AgentError(Exception):
    """Base exception for all agent-related errors.

    Attributes:
        code: Error code for categorization
        user_message: User-friendly message to display
        internal_message: Technical message for logging
    """

    def __init__(
        self,
        code: ErrorCode = ErrorCode.AGENT_ERROR,
        user_message: str = "Something went wrong on my end. Please try again.",
        internal_message: Optional[str] = None,
    ):
        self.code = code
        self.user_message = user_message
        self.internal_message = internal_message or user_message
        super().__init__(self.internal_message)


class ModelError(AgentError):
    """Exception for AI model API errors (rate limits, auth, connection)."""

    def __init__(
        self,
        code: ErrorCode = ErrorCode.MODEL_UNAVAILABLE,
        user_message: str = "I'm having trouble connecting right now. Please try again in a moment.",
        internal_message: Optional[str] = None,
    ):
        super().__init__(code, user_message, internal_message)


class RateLimitError(ModelError):
    """Exception for rate limit errors from the AI model."""

    def __init__(self, internal_message: Optional[str] = None):
        super().__init__(
            code=ErrorCode.RATE_LIMIT,
            user_message="I'm getting a lot of requests right now. Please wait a moment and try again.",
            internal_message=internal_message,
        )


class AuthenticationError(ModelError):
    """Exception for authentication errors with the AI model."""

    def __init__(self, internal_message: Optional[str] = None):
        super().__init__(
            code=ErrorCode.AUTH_ERROR,
            user_message="I'm having trouble connecting to my brain. Please try again later.",
            internal_message=internal_message,
        )


class ConnectionError(ModelError):
    """Exception for connection errors with the AI model."""

    def __init__(self, internal_message: Optional[str] = None):
        super().__init__(
            code=ErrorCode.CONNECTION_ERROR,
            user_message="I'm having trouble connecting right now. Please try again in a moment.",
            internal_message=internal_message,
        )


class ToolError(AgentError):
    """Exception for tool execution errors."""

    def __init__(
        self,
        tool_name: str,
        user_message: str = "I had trouble completing that action. Please try again.",
        internal_message: Optional[str] = None,
    ):
        self.tool_name = tool_name
        super().__init__(
            code=ErrorCode.TOOL_ERROR,
            user_message=user_message,
            internal_message=internal_message or f"Tool '{tool_name}' execution failed",
        )


class TimeoutError(AgentError):
    """Exception for agent timeout errors."""

    def __init__(self, internal_message: Optional[str] = None):
        super().__init__(
            code=ErrorCode.TIMEOUT,
            user_message="That took too long to process. Try a simpler request.",
            internal_message=internal_message,
        )


class InvalidResponseError(AgentError):
    """Exception for invalid or malformed agent responses."""

    def __init__(self, internal_message: Optional[str] = None):
        super().__init__(
            code=ErrorCode.INVALID_RESPONSE,
            user_message="I got confused with that request. Could you try rephrasing it?",
            internal_message=internal_message,
        )


class ModelBehaviorError(AgentError):
    """Exception for model behavior errors (e.g., malformed JSON tool calls).

    This occurs when the LLM generates invalid tool call arguments,
    such as concatenating multiple JSON objects together.
    """

    def __init__(self, internal_message: Optional[str] = None):
        # Provide a helpful user message that suggests trying again
        user_msg = (
            "I got a bit mixed up trying to do multiple things at once. "
            "Please try asking for one thing at a time, or try again! 🔄"
        )
        super().__init__(
            code=ErrorCode.INVALID_RESPONSE,
            user_message=user_msg,
            internal_message=internal_message,
        )


def classify_exception(exc: Exception) -> AgentError:
    """Convert a raw exception to an appropriate AgentError.

    This function examines exception messages and types to classify
    errors and return user-friendly error objects.

    Args:
        exc: The original exception

    Returns:
        AgentError subclass with appropriate user message
    """
    exc_str = str(exc).lower()
    exc_type = type(exc).__name__.lower()

    # Check for rate limit errors
    if any(
        indicator in exc_str
        for indicator in ["rate limit", "rate_limit", "ratelimit", "quota", "429", "too many requests"]
    ):
        return RateLimitError(internal_message=str(exc))

    # Check for authentication errors
    if any(
        indicator in exc_str
        for indicator in ["auth", "unauthorized", "forbidden", "401", "403", "api key", "apikey", "invalid key"]
    ):
        return AuthenticationError(internal_message=str(exc))

    # Check for connection errors
    if any(
        indicator in exc_str
        for indicator in ["connection", "timeout", "connect", "network", "unreachable", "dns"]
    ) or any(
        indicator in exc_type
        for indicator in ["connection", "timeout", "network"]
    ):
        # Distinguish between connection and timeout
        if "timeout" in exc_str or "timeout" in exc_type:
            return TimeoutError(internal_message=str(exc))
        return ConnectionError(internal_message=str(exc))

    # Check for timeout errors
    if any(
        indicator in exc_str
        for indicator in ["timeout", "timed out", "deadline", "exceeded"]
    ) or any(
        indicator in exc_type
        for indicator in ["timeout", "asyncio.timeout"]
    ):
        return TimeoutError(internal_message=str(exc))

    # Check for model-specific errors
    if any(
        indicator in exc_str
        for indicator in ["model", "service unavailable", "503", "500", "overloaded"]
    ):
        return ModelError(
            code=ErrorCode.MODEL_UNAVAILABLE,
            user_message="I'm temporarily unavailable. Please try again in a moment.",
            internal_message=str(exc),
        )

    # Default to generic agent error
    return AgentError(
        code=ErrorCode.UNKNOWN,
        user_message="Something went wrong on my end. Please try again.",
        internal_message=str(exc),
    )


def get_user_friendly_message(exc: Exception) -> str:
    """Get a user-friendly error message from any exception.

    Args:
        exc: The exception to convert

    Returns:
        User-friendly error message string
    """
    if isinstance(exc, AgentError):
        return exc.user_message

    classified = classify_exception(exc)
    return classified.user_message


def get_error_code(exc: Exception) -> str:
    """Get the error code from any exception.

    Args:
        exc: The exception to get code from

    Returns:
        Error code string
    """
    if isinstance(exc, AgentError):
        return exc.code.value

    classified = classify_exception(exc)
    return classified.code.value


__all__ = [
    # Error codes
    "ErrorCode",
    # Exception classes
    "AgentError",
    "ModelError",
    "RateLimitError",
    "AuthenticationError",
    "ConnectionError",
    "ToolError",
    "TimeoutError",
    "InvalidResponseError",
    # Utility functions
    "classify_exception",
    "get_user_friendly_message",
    "get_error_code",
]
