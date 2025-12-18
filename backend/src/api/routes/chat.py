"""Chat routes for Phase 3 AI Chatbot.

This module provides:
- POST /chat - Send a message (non-streaming)
- POST /chat/stream - Send a message (SSE streaming)
- GET /conversations - List user's conversations
- GET /conversations/{id} - Get conversation with messages
- PUT /conversations/{id} - Rename conversation
- DELETE /conversations/{id} - Delete conversation

Uses native MCP integration via MCPServerStreamableHttp.
The runner functions handle agent creation and MCP server connection internally.
"""

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlmodel.ext.asyncio.session import AsyncSession
from sse_starlette.sse import EventSourceResponse

from src.core.database import get_session
from src.core.auth_deps import get_current_user
from src.schemas.chat import ChatRequest, ChatResponse, ToolCall
from src.schemas.conversation import (
    ConversationResponse,
    ConversationListResponse,
    ConversationUpdate,
)
from src.schemas.message import MessageResponse
from src.services.conversation_service import ConversationService
# NEW: Import runner functions directly - they handle agent + MCP internally
from src.agents.runner import run_agent, run_agent_streamed
from src.agents.errors import (
    AgentError,
    ModelError,
    ToolError,
    TimeoutError as AgentTimeoutError,
    get_user_friendly_message,
    get_error_code,
)
from src.utils.sse import (
    create_token_event,
    create_tool_call_event,
    create_tool_result_event,
    create_done_event,
    create_error_event,
    create_thinking_event,
    create_agent_updated_event,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post(
    "",
    response_model=ChatResponse,
    summary="Send a chat message",
    description="Send a message to the AI assistant and receive a complete response.",
)
async def send_message(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Send a message to the AI chatbot.

    Creates or continues a conversation, processes the message through
    the AI agent, and returns the complete response with any tool calls.

    - **conversation_id**: Optional existing conversation ID
    - **message**: The user's message (required, 1-4000 chars)

    Returns the AI response with conversation context.
    """
    user_id = current_user["id"]
    conversation_service = ConversationService(session)

    try:
        # Get or create conversation
        conversation = await conversation_service.get_or_create(
            user_id=user_id,
            conversation_id=request.conversation_id,
        )

        # Get message history for context
        history = await conversation_service.get_messages_for_agent(conversation.id)

        # Store user message
        await conversation_service.add_message(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
        )

        # Run agent with native MCP integration
        # The runner handles agent creation and MCP server connection internally
        response = await run_agent(
            user_id=user_id,
            message=request.message,
            history=history,
        )

        # Convert tool calls to schema format
        tool_calls_schema = None
        if response.tool_calls:
            tool_calls_schema = [
                ToolCall(
                    id=tc.get("call_id", ""),
                    tool=tc.get("tool", ""),
                    arguments=tc.get("args", {}),
                    result=tc.get("result"),
                )
                for tc in response.tool_calls
            ]

        # Store assistant response
        assistant_message = await conversation_service.add_message(
            conversation_id=conversation.id,
            role="assistant",
            content=response.content,
            tool_calls=(
                {"calls": [tc.model_dump() for tc in tool_calls_schema]}
                if tool_calls_schema
                else None
            ),
        )

        return ChatResponse(
            conversation_id=conversation.id,
            message_id=assistant_message.id,
            response=response.content,
            tool_calls=tool_calls_schema,
        )

    except AgentTimeoutError as e:
        logger.error(f"Chat timeout [{e.code.value}]: {e.internal_message}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=e.user_message,
        )
    except ModelError as e:
        logger.error(f"Chat model error [{e.code.value}]: {e.internal_message}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.user_message,
        )
    except ToolError as e:
        logger.error(f"Chat tool error [{e.code.value}]: {e.internal_message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=e.user_message,
        )
    except AgentError as e:
        logger.error(f"Chat agent error [{e.code.value}]: {e.internal_message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=e.user_message,
        )
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        user_message = get_user_friendly_message(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=user_message,
        )


@router.post(
    "/stream",
    summary="Send a chat message with streaming",
    description="Send a message and receive the response via Server-Sent Events.",
)
async def send_message_stream(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Send a message and stream the response via SSE.

    Events emitted (for hybrid UI like Grok):
    - `thinking`: Agent is processing/reasoning (show spinner)
    - `token`: Text content chunks
    - `tool_call`: Tool invocation with name, arguments (show tool indicator)
    - `tool_result`: Result from tool execution (show result)
    - `agent_updated`: Agent changed (multi-agent scenarios)
    - `done`: Completion with conversation_id and message_id
    - `error`: Error message if something goes wrong
    """
    user_id = current_user["id"]
    conversation_service = ConversationService(session)

    async def generate():
        try:
            # Get or create conversation
            conversation = await conversation_service.get_or_create(
                user_id=user_id,
                conversation_id=request.conversation_id,
            )

            # Get message history
            history = await conversation_service.get_messages_for_agent(conversation.id)

            # Store user message
            await conversation_service.add_message(
                conversation_id=conversation.id,
                role="user",
                content=request.message,
            )

            # Track full response and tool calls
            full_response = ""
            tool_calls: list[dict] = []

            # Stream agent execution with native MCP integration
            # The runner handles agent creation and MCP server connection internally
            async for event in run_agent_streamed(
                user_id=user_id,
                message=request.message,
                history=history,
            ):
                # Thinking event - agent is processing
                if event.type == "thinking":
                    yield create_thinking_event(
                        content=event.content or "Processing...",
                        agent=event.data.get("agent", "TodoBot") if event.data else "TodoBot",
                    )

                # Token event - text content chunk
                elif event.type == "token" and event.content:
                    full_response += event.content
                    yield create_token_event(event.content)

                # Tool call event - tool is being invoked
                elif event.type == "tool_call" and event.data:
                    tool_calls.append(event.data)
                    yield create_tool_call_event(
                        tool=event.data.get("tool", ""),
                        args=event.data.get("args", {}),
                        call_id=event.data.get("call_id", ""),
                    )

                # Tool result event - tool returned result
                elif event.type == "tool_result" and event.data:
                    yield create_tool_result_event(
                        call_id=event.data.get("call_id", ""),
                        output=event.data.get("output"),
                    )

                # Agent updated event - agent changed (multi-agent)
                elif event.type == "agent_updated":
                    yield create_agent_updated_event(
                        agent=event.data.get("agent", "") if event.data else "",
                        content=event.content or "",
                    )

                # Done event - use content as full_response if we didn't stream tokens
                elif event.type == "done":
                    if event.content and not full_response:
                        full_response = event.content

                # Error event
                elif event.type == "error":
                    error_code = event.data.get("code", "stream_error") if event.data else "stream_error"
                    yield create_error_event(
                        message=event.content or "Something went wrong on my end. Please try again.",
                        code=error_code,
                    )

            # Store assistant response
            assistant_message = await conversation_service.add_message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_response,
                tool_calls={"calls": tool_calls} if tool_calls else None,
            )

            # Send done event
            yield create_done_event(
                conversation_id=conversation.id,
                message_id=assistant_message.id,
            )

        except AgentTimeoutError as e:
            logger.error(f"Stream timeout [{e.code.value}]: {e.internal_message}")
            yield create_error_event(
                message=e.user_message,
                code=e.code.value,
            )
        except ModelError as e:
            logger.error(f"Stream model error [{e.code.value}]: {e.internal_message}")
            yield create_error_event(
                message=e.user_message,
                code=e.code.value,
            )
        except ToolError as e:
            logger.error(f"Stream tool error [{e.code.value}]: {e.internal_message}")
            yield create_error_event(
                message=e.user_message,
                code=e.code.value,
            )
        except AgentError as e:
            logger.error(f"Stream agent error [{e.code.value}]: {e.internal_message}")
            yield create_error_event(
                message=e.user_message,
                code=e.code.value,
            )
        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            user_message = get_user_friendly_message(e)
            error_code = get_error_code(e)
            yield create_error_event(
                message=user_message,
                code=error_code,
            )

    return EventSourceResponse(generate())


@router.get(
    "/conversations",
    response_model=ConversationListResponse,
    summary="List conversations",
    description="Get all conversations for the current user.",
)
async def list_conversations(
    page: int = 1,
    page_size: int = 20,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """List user's conversations with pagination.

    - **page**: Page number (default 1)
    - **page_size**: Items per page (default 20, max 100)

    Returns conversations sorted by most recently updated.
    """
    user_id = current_user["id"]
    conversation_service = ConversationService(session)

    # Calculate offset
    offset = (page - 1) * page_size

    conversations, total = await conversation_service.list_conversations(
        user_id=user_id,
        limit=page_size,
        offset=offset,
    )

    # Convert conversations manually to avoid lazy-loading issues
    # The messages relationship cannot be accessed outside the async context
    conversation_responses = []
    for c in conversations:
        # Get message count and preview for each conversation
        message_count = await conversation_service.get_message_count(c.id)
        preview = await conversation_service.get_last_message_preview(c.id)
        conversation_responses.append(
            ConversationResponse(
                id=c.id,
                user_id=c.user_id,
                title=c.title,
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=message_count,
                preview=preview,  # Preview of last message
                messages=None,  # Don't load messages for list view
            )
        )

    return ConversationListResponse(
        conversations=conversation_responses,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    summary="Get conversation",
    description="Get a conversation with its messages.",
)
async def get_conversation(
    conversation_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific conversation with messages.

    Returns 404 if conversation not found or not owned by user.
    """
    user_id = current_user["id"]
    conversation_service = ConversationService(session)

    conversation = await conversation_service.get_conversation(
        conversation_id=conversation_id,
        user_id=user_id,
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )

    # Get messages
    messages, total_messages = await conversation_service.get_messages(conversation_id)

    # Build response manually to avoid lazy-loading issues
    # Convert messages manually as well
    message_responses = [
        MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            tool_calls=m.tool_calls,
            created_at=m.created_at,
        )
        for m in messages
    ]

    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=total_messages,
        messages=message_responses,
    )


@router.put(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    summary="Rename conversation",
    description="Update a conversation's title.",
)
async def rename_conversation(
    conversation_id: int,
    update_data: ConversationUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Rename a conversation.

    - **title**: New title for the conversation

    Returns the updated conversation.
    """
    user_id = current_user["id"]
    conversation_service = ConversationService(session)

    conversation = await conversation_service.update_title(
        conversation_id=conversation_id,
        user_id=user_id,
        title=update_data.title,
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )

    # Build response manually to avoid lazy-loading issues
    message_count = await conversation_service.get_message_count(conversation_id)
    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=message_count,
        messages=None,
    )


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete conversation",
    description="Delete a conversation and all its messages.",
)
async def delete_conversation(
    conversation_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Delete a conversation.

    Returns 204 No Content on success.
    Returns 404 if conversation not found.
    """
    user_id = current_user["id"]
    conversation_service = ConversationService(session)

    deleted = await conversation_service.delete_conversation(
        conversation_id=conversation_id,
        user_id=user_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
