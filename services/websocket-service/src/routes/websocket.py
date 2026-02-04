"""WebSocket endpoint for real-time task synchronization."""
import json
import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from jose import jwt, JWTError

from ..broadcaster import broadcaster
from ..config import settings

router = APIRouter(tags=["websocket"])
logger = logging.getLogger(__name__)


async def verify_jwt_token(token: str) -> Optional[str]:
    """
    Verify JWT token and extract user_id.

    Args:
        token: The JWT token to verify

    Returns:
        The user_id if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("Token valid but missing 'sub' claim")
            return None
        return str(user_id)
    except JWTError as e:
        logger.warning(f"JWT error: {e}")
        return None


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: Optional[str] = Query(default=None, alias="token"),
):
    """
    WebSocket endpoint for real-time task updates.

    The client connects with:
    - user_id in URL path (for routing)
    - token in query params for authentication

    Message Types:
    - Client -> Server:
        - {"type": "ping"}: Heartbeat ping
        - {"type": "subscribe", "topic": "..."}: Subscribe to updates (future)
    - Server -> Client:
        - {"type": "pong"}: Heartbeat pong response
        - {"type": "task_update", "event": "...", "task": {...}}: Task update
        - {"type": "error", "message": "..."}: Error message

    Reconnection Logic:
    - Clients should reconnect on disconnect using exponential backoff
    - Maximum reconnect attempts recommended: 5-10
    - Reconnect delay: 2^attempt * 1000ms

    Args:
        websocket: The WebSocket connection
        user_id: The user identifier from URL path
        token: JWT token for authentication (optional for development)
    """
    # Authentication check
    authenticated_user_id = None

    # Skip auth if in development mode (empty secret)
    if settings.jwt_secret and settings.jwt_secret != "your-secret-key-change-in-production":
        if not token:
            logger.warning(f"WebSocket connection rejected for user {user_id}: No token provided")
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION, reason="Authentication required"
            )
            return

        authenticated_user_id = await verify_jwt_token(token)
        if not authenticated_user_id:
            logger.warning(f"WebSocket connection rejected for user {user_id}: Invalid token")
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token"
            )
            return

        # Verify the authenticated user_id matches the path user_id
        if authenticated_user_id != user_id:
            logger.warning(
                f"WebSocket connection rejected: Token user {authenticated_user_id} != Path user {user_id}"
            )
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION, reason="User ID mismatch"
            )
            return
    else:
        logger.warning(f"Skipping JWT verification (development mode) for user {user_id}")

    source_client = f"{websocket.client.host}:{websocket.client.port}" if websocket.client else "unknown"

    # Connect to broadcaster
    await broadcaster.connect(websocket, user_id, source_client)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                message_type = message.get("type")

                logger.debug(f"Received message from user {user_id}: {message_type}")

                # Handle different message types
                if message_type == "ping":
                    # Respond to heartbeat ping
                    await websocket.send_json({"type": "pong"})

                elif message_type == "pong":
                    # Client pong received (client initiated heartbeat)
                    logger.debug(f"Received pong from user {user_id}")

                elif message_type == "subscribe":
                    # Future: Handle topic subscriptions
                    topic = message.get("topic")
                    logger.info(f"User {user_id} requested subscription to topic: {topic}")
                    await websocket.send_json({"type": "subscribed", "topic": topic})

                else:
                    logger.warning(f"Unknown message type: {message_type}")
                    await websocket.send_json(
                        {"type": "error", "message": f"Unknown message type: {message_type}"}
                    )

            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from user {user_id}: {data}")
                await websocket.send_json(
                    {"type": "error", "message": "Invalid JSON format"}
                )

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}", exc_info=True)
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason=str(e))
    finally:
        # Always disconnect on exit
        broadcaster.disconnect(websocket)
