# WebSocket Real-time Examples

## Example 1: Complete WebSocket Service

```python
# services/websocket/src/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp
from contextlib import asynccontextmanager
import json
import logging

from .connection import ConnectionManager
from .auth import verify_token

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("WebSocket service starting...")
    yield
    logger.info("WebSocket service shutting down...")

app = FastAPI(title="WebSocket Service", lifespan=lifespan)
dapr_app = DaprApp(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    """Main WebSocket endpoint for real-time updates."""
    # Verify JWT token
    user_id = await verify_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    # Connect and register
    await manager.connect(websocket, user_id)
    logger.info(f"User {user_id} connected via WebSocket")

    try:
        while True:
            # Receive and handle messages
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": message.get("timestamp")})
            elif message.get("type") == "subscribe":
                # Handle topic subscriptions
                topic = message.get("topic")
                await manager.subscribe(user_id, topic)
            elif message.get("type") == "unsubscribe":
                topic = message.get("topic")
                await manager.unsubscribe(user_id, topic)

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"User {user_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)

# Dapr subscriptions for broadcasting
@dapr_app.subscribe(pubsub="taskpubsub", topic="task-updates")
async def handle_task_update(event: dict):
    """Broadcast task updates to connected clients."""
    user_id = event.get("user_id")
    event_type = event.get("event_type")
    task_data = event.get("task")

    logger.info(f"Broadcasting {event_type} to user {user_id}")

    await manager.broadcast_to_user(user_id, {
        "type": "task_update",
        "event": event_type,
        "task": task_data,
        "timestamp": event.get("timestamp")
    })

@dapr_app.subscribe(pubsub="taskpubsub", topic="reminder-events")
async def handle_reminder(event: dict):
    """Broadcast reminder notifications."""
    user_id = event.get("user_id")

    if event.get("event_type") == "reminder.triggered":
        await manager.broadcast_to_user(user_id, {
            "type": "reminder",
            "task_id": event.get("task_id"),
            "message": event.get("message"),
            "timestamp": event.get("timestamp")
        })

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "active_connections": manager.active_connections_count,
        "active_users": manager.active_users_count
    }

@app.get("/stats")
async def stats():
    return {
        "connections": manager.active_connections_count,
        "users": manager.active_users_count,
        "connections_per_user": manager.get_connection_stats()
    }
```

## Example 2: Advanced Connection Manager

```python
# services/websocket/src/connection.py
from fastapi import WebSocket
from collections import defaultdict
import asyncio
import logging
from datetime import datetime
from typing import Set

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Advanced WebSocket connection manager with topic subscriptions."""

    def __init__(self):
        # user_id -> list of WebSocket connections
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)
        # user_id -> set of subscribed topics
        self.subscriptions: dict[str, Set[str]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept and store a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self.active_connections[user_id].append(websocket)

        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })

        logger.info(f"User {user_id} connected. Total: {self.active_connections_count}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                # Clean up subscriptions
                if user_id in self.subscriptions:
                    del self.subscriptions[user_id]

        logger.info(f"User {user_id} disconnected. Total: {self.active_connections_count}")

    async def subscribe(self, user_id: str, topic: str):
        """Subscribe user to a topic."""
        async with self._lock:
            self.subscriptions[user_id].add(topic)
        logger.info(f"User {user_id} subscribed to {topic}")

    async def unsubscribe(self, user_id: str, topic: str):
        """Unsubscribe user from a topic."""
        async with self._lock:
            self.subscriptions[user_id].discard(topic)
        logger.info(f"User {user_id} unsubscribed from {topic}")

    async def broadcast_to_user(self, user_id: str, message: dict):
        """Send message to all connections for a specific user."""
        if user_id not in self.active_connections:
            logger.debug(f"No connections for user {user_id}")
            return

        disconnected = []
        for connection in self.active_connections[user_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send to user {user_id}: {e}")
                disconnected.append(connection)

        # Clean up failed connections
        for conn in disconnected:
            self.disconnect(conn, user_id)

    async def broadcast_to_topic(self, topic: str, message: dict):
        """Send message to all users subscribed to a topic."""
        async with self._lock:
            subscribed_users = [
                user_id for user_id, topics in self.subscriptions.items()
                if topic in topics
            ]

        for user_id in subscribed_users:
            await self.broadcast_to_user(user_id, message)

    async def broadcast_to_all(self, message: dict):
        """Send message to all connected users."""
        for user_id in list(self.active_connections.keys()):
            await self.broadcast_to_user(user_id, message)

    @property
    def active_connections_count(self) -> int:
        return sum(len(conns) for conns in self.active_connections.values())

    @property
    def active_users_count(self) -> int:
        return len(self.active_connections)

    def get_connection_stats(self) -> dict:
        return {
            user_id: len(conns)
            for user_id, conns in self.active_connections.items()
        }
```

## Example 3: React WebSocket Hook

```tsx
// frontend/lib/websocket/use-websocket.ts
import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useTaskStore } from "@/stores/task-store";
import { toast } from "sonner";

type MessageHandler = (message: WebSocketMessage) => void;

interface WebSocketMessage {
  type: string;
  event?: string;
  task?: Task;
  message?: string;
  timestamp?: string;
}

interface UseWebSocketOptions {
  onMessage?: MessageHandler;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const { token, isAuthenticated } = useAuthStore();
  const { updateTask, addTask, removeTask, refreshTasks } = useTaskStore();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectCount = useRef(0);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws?token=${token}`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("[WS] Connected");
        setIsConnected(true);
        setConnectionError(null);
        reconnectCount.current = 0;

        // Start heartbeat
        heartbeatInterval.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
              type: "ping",
              timestamp: Date.now()
            }));
          }
        }, 30000);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
          onMessage?.(message);
        } catch (e) {
          console.error("[WS] Failed to parse message:", e);
        }
      };

      ws.current.onclose = (event) => {
        console.log("[WS] Disconnected:", event.code, event.reason);
        setIsConnected(false);

        // Clear heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }

        // Attempt reconnection
        if (reconnectCount.current < reconnectAttempts && isAuthenticated) {
          const delay = reconnectInterval * Math.pow(2, reconnectCount.current);
          console.log(`[WS] Reconnecting in ${delay}ms...`);
          reconnectCount.current++;
          setTimeout(connect, delay);
        } else if (reconnectCount.current >= reconnectAttempts) {
          setConnectionError("Connection lost. Please refresh the page.");
        }
      };

      ws.current.onerror = (error) => {
        console.error("[WS] Error:", error);
        setConnectionError("Connection error occurred");
      };
    } catch (e) {
      console.error("[WS] Failed to connect:", e);
      setConnectionError("Failed to establish connection");
    }
  }, [token, isAuthenticated, onMessage, reconnectAttempts, reconnectInterval]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case "connected":
        console.log("[WS] Welcome message received");
        break;

      case "pong":
        // Heartbeat response
        break;

      case "task_update":
        handleTaskUpdate(message);
        break;

      case "reminder":
        handleReminder(message);
        break;

      default:
        console.log("[WS] Unknown message type:", message.type);
    }
  }, []);

  const handleTaskUpdate = useCallback((message: WebSocketMessage) => {
    if (!message.task) return;

    switch (message.event) {
      case "task.created":
        addTask(message.task);
        toast.success("New task added");
        break;

      case "task.updated":
        updateTask(message.task);
        break;

      case "task.deleted":
        removeTask(message.task.id);
        toast.info("Task deleted");
        break;

      case "task.completed":
        updateTask({ ...message.task, status: "completed" });
        toast.success("Task completed!");
        break;
    }
  }, [addTask, updateTask, removeTask]);

  const handleReminder = useCallback((message: WebSocketMessage) => {
    toast.info(message.message || "Task reminder!", {
      action: {
        label: "View",
        onClick: () => {
          // Navigate to task
          window.location.href = `/tasks/${message.task_id}`;
        }
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    if (ws.current) {
      ws.current.close(1000, "User initiated disconnect");
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionError,
    sendMessage,
    reconnect: connect,
    disconnect
  };
}
```

## Example 4: WebSocket Provider with Context

```tsx
// frontend/providers/websocket-provider.tsx
"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useWebSocket } from "@/lib/websocket/use-websocket";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebSocketContextType {
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  connectionError: null,
  reconnect: () => {},
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isConnected, connectionError, reconnect } = useWebSocket();

  return (
    <WebSocketContext.Provider value={{ isConnected, connectionError, reconnect }}>
      {children}
      {connectionError && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg flex items-center gap-3">
          <WifiOff className="h-5 w-5" />
          <span>{connectionError}</span>
          <Button size="sm" variant="secondary" onClick={reconnect}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      )}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketStatus() {
  return useContext(WebSocketContext);
}

// Connection status indicator component
export function ConnectionIndicator() {
  const { isConnected } = useWebSocketStatus();
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Show status briefly on connection change
    setShowStatus(true);
    const timer = setTimeout(() => setShowStatus(false), 3000);
    return () => clearTimeout(timer);
  }, [isConnected]);

  if (!showStatus) return null;

  return (
    <div className={`
      fixed bottom-4 left-4 px-3 py-2 rounded-full text-sm
      transition-all duration-300 flex items-center gap-2
      ${isConnected
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}
    `}>
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Disconnected</span>
        </>
      )}
    </div>
  );
}
```

## Example 5: Kubernetes WebSocket Service Deployment

```yaml
# k8s/websocket-service/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: websocket-service
  namespace: todo-app
  labels:
    app: websocket-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: websocket-service
  template:
    metadata:
      labels:
        app: websocket-service
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "websocket-service"
        dapr.io/app-port: "8005"
        dapr.io/enable-api-logging: "true"
    spec:
      containers:
        - name: websocket-service
          image: evolution-todo/websocket-service:latest
          ports:
            - containerPort: 8005
              name: http
          env:
            - name: BETTER_AUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: todo-secrets
                  key: better-auth-secret
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /health
              port: 8005
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8005
            initialDelaySeconds: 10
            periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: websocket-service
  namespace: todo-app
spec:
  selector:
    app: websocket-service
  ports:
    - port: 8005
      targetPort: 8005
      name: http
---
# Ingress for WebSocket (requires sticky sessions)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: websocket-ingress
  namespace: todo-app
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/upstream-hash-by: "$remote_addr"
    nginx.ingress.kubernetes.io/websocket-services: "websocket-service"
spec:
  ingressClassName: nginx
  rules:
    - host: todo.yourdomain.com
      http:
        paths:
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: websocket-service
                port:
                  number: 8005
```
