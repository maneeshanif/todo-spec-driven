"""WebSocket connection manager with user isolation."""
import asyncio
import logging
from collections import defaultdict
from typing import Optional
from weakref import WeakSet

from fastapi import WebSocket
from fastapi.websockets import WebSocketState

from .config import settings

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manage WebSocket connections with user isolation.

    Features:
    - User isolation: only broadcast to connections of same user_id
    - Connection tracking: map user_id to list of WebSocket connections
    - Automatic cleanup of disconnected connections
    - Heartbeat/ping-pong for keeping connections alive
    """

    def __init__(self):
        # user_id -> WeakSet of WebSocket connections (auto-cleanup)
        self.active_connections: dict[str, WeakSet[WebSocket]] = defaultdict(
            lambda: WeakSet()
        )
        # WeakSet for tracking all connections (regardless of user)
        self.all_connections: WeakSet[WebSocket] = WeakSet()
        self._lock = asyncio.Lock()
        # Track user_id for each connection (for cleanup)
        self._user_map: dict[int, str] = {}

    async def connect(
        self, websocket: WebSocket, user_id: str, source_client: Optional[str] = None
    ) -> None:
        """
        Accept and store a new WebSocket connection.

        Args:
            websocket: The WebSocket connection to accept
            user_id: The user identifier for isolation
            source_client: Optional client identifier for logging
        """
        await websocket.accept()

        async with self._lock:
            self.active_connections[user_id].add(websocket)
            self.all_connections.add(websocket)
            self._user_map[id(websocket)] = user_id

        connection_count = self.active_connections_count
        user_connection_count = len(self.active_connections[user_id])
        logger.info(
            f"User {user_id} connected via {source_client}. "
            f"User connections: {user_connection_count}, Total connections: {connection_count}"
        )

    def disconnect(self, websocket: WebSocket) -> None:
        """
        Remove a WebSocket connection.

        Args:
            websocket: The WebSocket connection to remove
        """
        connection_id = id(websocket)
        user_id = self._user_map.get(connection_id)

        if user_id and user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)

            # Clean up empty user entries
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                logger.info(f"User {user_id} has no more connections")

        self.all_connections.discard(websocket)
        self._user_map.pop(connection_id, None)

        if user_id:
            logger.info(
                f"User {user_id} disconnected. Total connections: {self.active_connections_count}"
            )

    async def send_personal_message(
        self, message: dict, websocket: WebSocket
    ) -> bool:
        """
        Send a message to a specific WebSocket connection.

        Args:
            message: The message to send (will be JSON serialized)
            websocket: The specific WebSocket connection

        Returns:
            True if sent successfully, False otherwise
        """
        try:
            await websocket.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Failed to send personal message: {e}")
            # Clean up disconnected socket
            self.disconnect(websocket)
            return False

    async def broadcast_to_user(
        self, user_id: str, message: dict, skip_source: Optional[WebSocket] = None
    ) -> int:
        """
        Send message to all connections for a specific user.

        Args:
            user_id: The user identifier
            message: The message to broadcast
            skip_source: Optional WebSocket to skip (to avoid echoing back)

        Returns:
            Number of successful broadcasts
        """
        if user_id not in self.active_connections:
            logger.debug(f"No active connections for user {user_id}")
            return 0

        connections = list(self.active_connections[user_id])
        if not connections:
            logger.debug(f"Connection set for user {user_id} is empty")
            return 0

        success_count = 0
        disconnected = []

        for connection in connections:
            # Skip the source connection if specified
            if skip_source and connection is skip_source:
                continue

            if connection.client_state != WebSocketState.CONNECTED:
                disconnected.append(connection)
                continue

            try:
                await connection.send_json(message)
                success_count += 1
            except Exception as e:
                logger.error(
                    f"Failed to send to user {user_id} connection {id(connection)}: {e}"
                )
                disconnected.append(connection)

        # Clean up disconnected connections
        for conn in disconnected:
            self.disconnect(conn)

        logger.debug(
            f"Broadcast to user {user_id}: {success_count} successful, {len(disconnected)} failed"
        )
        return success_count

    async def broadcast_to_all(self, message: dict) -> int:
        """
        Send message to all connected users.

        Args:
            message: The message to broadcast

        Returns:
            Number of successful broadcasts
        """
        total_success = 0
        for user_id in list(self.active_connections.keys()):
            total_success += await self.broadcast_to_user(user_id, message)
        return total_success

    async def send_heartbeat(self) -> int:
        """
        Send heartbeat (ping) to all connected clients.

        Returns:
            Number of successful pings
        """
        heartbeat_message = {"type": "ping", "timestamp": None}

        success_count = 0
        for websocket in list(self.all_connections):
            if websocket.client_state == WebSocketState.CONNECTED:
                try:
                    await websocket.send_json(heartbeat_message)
                    success_count += 1
                except Exception as e:
                    logger.debug(f"Failed to send heartbeat: {e}")
                    self.disconnect(websocket)

        return success_count

    async def cleanup_stale_connections(self) -> int:
        """
        Remove stale/disconnected connections.

        Returns:
            Number of cleaned up connections
        """
        cleaned = 0
        for websocket in list(self.all_connections):
            if websocket.client_state != WebSocketState.CONNECTED:
                self.disconnect(websocket)
                cleaned += 1
        return cleaned

    async def get_user_connections(self, user_id: str) -> list[WebSocket]:
        """
        Get all active connections for a user.

        Args:
            user_id: The user identifier

        Returns:
            List of WebSocket connections
        """
        if user_id not in self.active_connections:
            return []
        return [ws for ws in self.active_connections[user_id] if ws.client_state == WebSocketState.CONNECTED]

    def get_connection_count_for_user(self, user_id: str) -> int:
        """
        Get the number of active connections for a user.

        Args:
            user_id: The user identifier

        Returns:
            Number of active connections
        """
        if user_id not in self.active_connections:
            return 0
        return sum(
            1 for ws in self.active_connections[user_id] if ws.client_state == WebSocketState.CONNECTED
        )

    @property
    def active_connections_count(self) -> int:
        """Total number of active connections across all users."""
        return sum(len(conns) for conns in self.active_connections.values())

    @property
    def active_users_count(self) -> int:
        """Number of users with at least one active connection."""
        return len(self.active_connections)

    def get_status(self) -> dict:
        """
        Get connection manager status.

        Returns:
            Dictionary with connection statistics
        """
        return {
            "total_connections": self.active_connections_count,
            "active_users": self.active_users_count,
            "connections_per_user": {
                user_id: len(conns) for user_id, conns in self.active_connections.items()
            },
        }


# Global connection manager instance
broadcaster = ConnectionManager()
