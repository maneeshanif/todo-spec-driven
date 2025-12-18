"""Conversation service for Phase 3 AI Chatbot.

This service handles all conversation and message operations:
- CRUD for conversations
- Adding and retrieving messages
- Auto-generating conversation titles
"""

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.conversation import Conversation
from src.models.message import Message


def utcnow() -> datetime:
    """Return current UTC time without timezone info."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ConversationService:
    """Service for managing conversations and messages."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session.

        Args:
            session: Async database session
        """
        self.session = session

    async def create_conversation(
        self, user_id: str, title: Optional[str] = None
    ) -> Conversation:
        """Create a new conversation.

        Args:
            user_id: Owner's user ID
            title: Optional conversation title

        Returns:
            Created conversation
        """
        conversation = Conversation(user_id=user_id, title=title)
        self.session.add(conversation)
        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation

    async def get_conversation(
        self, conversation_id: int, user_id: str
    ) -> Optional[Conversation]:
        """Get a conversation by ID if owned by user.

        Args:
            conversation_id: Conversation ID
            user_id: Owner's user ID

        Returns:
            Conversation if found and owned by user, else None
        """
        statement = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        result = await self.session.exec(statement)
        return result.first()

    async def get_or_create(
        self, user_id: str, conversation_id: Optional[int] = None
    ) -> Conversation:
        """Get existing conversation or create a new one.

        Args:
            user_id: Owner's user ID
            conversation_id: Optional existing conversation ID

        Returns:
            Existing or new conversation
        """
        if conversation_id:
            conversation = await self.get_conversation(conversation_id, user_id)
            if conversation:
                return conversation

        # Create new conversation
        return await self.create_conversation(user_id)

    async def list_conversations(
        self, user_id: str, limit: int = 20, offset: int = 0
    ) -> tuple[list[Conversation], int]:
        """List user's conversations with pagination.

        Args:
            user_id: Owner's user ID
            limit: Max conversations to return (default 20)
            offset: Offset for pagination (default 0)

        Returns:
            Tuple of (conversations, total_count)
        """
        # Get total count
        count_stmt = select(func.count(Conversation.id)).where(
            Conversation.user_id == user_id
        )
        total = (await self.session.exec(count_stmt)).one()

        # Get conversations sorted by updated_at DESC
        statement = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.updated_at))
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.exec(statement)
        conversations = result.all()

        return list(conversations), total

    async def get_most_recent(self, user_id: str) -> Optional[Conversation]:
        """Get the most recently updated conversation.

        Used for chat page landing behavior - loads most recent conversation.

        Args:
            user_id: Owner's user ID

        Returns:
            Most recent conversation or None
        """
        statement = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.updated_at))
            .limit(1)
        )
        result = await self.session.exec(statement)
        return result.first()

    async def update_title(
        self, conversation_id: int, user_id: str, title: str
    ) -> Optional[Conversation]:
        """Update conversation title (rename).

        Args:
            conversation_id: Conversation ID
            user_id: Owner's user ID
            title: New title

        Returns:
            Updated conversation or None if not found
        """
        conversation = await self.get_conversation(conversation_id, user_id)
        if not conversation:
            return None

        conversation.title = title
        conversation.updated_at = utcnow()
        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation

    async def delete_conversation(
        self, conversation_id: int, user_id: str
    ) -> bool:
        """Delete a conversation and all its messages.

        Args:
            conversation_id: Conversation ID
            user_id: Owner's user ID

        Returns:
            True if deleted, False if not found
        """
        conversation = await self.get_conversation(conversation_id, user_id)
        if not conversation:
            return False

        await self.session.delete(conversation)
        await self.session.commit()
        return True

    async def add_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        tool_calls: Optional[dict[str, Any]] = None,
    ) -> Message:
        """Add a message to a conversation.

        Also updates the conversation's updated_at timestamp.
        Auto-generates title from first user message if not set.

        Args:
            conversation_id: Conversation ID
            role: Message role (user/assistant/system)
            content: Message content
            tool_calls: Optional tool call data (JSONB)

        Returns:
            Created message
        """
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            tool_calls=tool_calls,
        )
        self.session.add(message)

        # Update conversation timestamp
        conversation = await self.session.get(Conversation, conversation_id)
        if conversation:
            conversation.updated_at = utcnow()

            # Auto-generate title from first user message
            if role == "user" and not conversation.title:
                conversation.title = await self.auto_generate_title(content)

        await self.session.commit()
        await self.session.refresh(message)
        return message

    async def get_messages(
        self, conversation_id: int, limit: int = 50, offset: int = 0
    ) -> tuple[list[Message], int]:
        """Get messages for a conversation with pagination.

        Args:
            conversation_id: Conversation ID
            limit: Max messages to return (default 50)
            offset: Offset for pagination (default 0)

        Returns:
            Tuple of (messages, total_count)
        """
        # Get total count
        count_stmt = select(func.count(Message.id)).where(
            Message.conversation_id == conversation_id
        )
        total = (await self.session.exec(count_stmt)).one()

        # Get messages sorted by created_at ASC (oldest first)
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.exec(statement)
        messages = result.all()

        return list(messages), total

    async def get_messages_for_agent(
        self, conversation_id: int
    ) -> list[dict[str, str]]:
        """Get message history formatted for agent context.

        Returns messages in the format expected by OpenAI Agents SDK.

        Args:
            conversation_id: Conversation ID

        Returns:
            List of message dicts with role and content
        """
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        result = await self.session.exec(statement)
        messages = result.all()

        return [{"role": m.role, "content": m.content} for m in messages]

    async def get_last_message_id(self, conversation_id: int) -> Optional[int]:
        """Get the ID of the last message in a conversation.

        Args:
            conversation_id: Conversation ID

        Returns:
            Last message ID or None
        """
        statement = (
            select(Message.id)
            .where(Message.conversation_id == conversation_id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        result = await self.session.exec(statement)
        return result.first()

    async def auto_generate_title(self, first_message: str) -> str:
        """Auto-generate conversation title from first message.

        Truncates to 50 characters with ellipsis if needed.

        Args:
            first_message: First user message content

        Returns:
            Generated title (max 50 chars)
        """
        # Clean up the message - remove extra whitespace
        title = " ".join(first_message.split())

        # Truncate to 50 characters
        if len(title) > 50:
            title = title[:47] + "..."

        return title

    async def get_message_count(self, conversation_id: int) -> int:
        """Get the number of messages in a conversation.

        Args:
            conversation_id: Conversation ID

        Returns:
            Message count
        """
        statement = select(func.count(Message.id)).where(
            Message.conversation_id == conversation_id
        )
        result = await self.session.exec(statement)
        return result.one()

    async def get_last_message_preview(
        self, conversation_id: int, max_length: int = 100
    ) -> Optional[str]:
        """Get a preview of the last message in a conversation.

        Returns the content of the most recent message, truncated to max_length.
        Used for displaying conversation previews in the sidebar.

        Args:
            conversation_id: Conversation ID
            max_length: Maximum preview length (default 100 chars)

        Returns:
            Truncated message content or None if no messages
        """
        statement = (
            select(Message.content)
            .where(Message.conversation_id == conversation_id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        result = await self.session.exec(statement)
        content = result.first()

        if not content:
            return None

        # Clean and truncate
        preview = " ".join(content.split())  # Normalize whitespace
        if len(preview) > max_length:
            preview = preview[: max_length - 3] + "..."

        return preview


# Dependency injection helper
async def get_conversation_service(session: AsyncSession) -> ConversationService:
    """Get ConversationService instance with session.

    Args:
        session: Async database session from dependency

    Returns:
        ConversationService instance
    """
    return ConversationService(session)
