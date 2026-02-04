# WebSocket Real-Time Task Synchronization - Implementation Guide

## Overview

This document describes the WebSocket integration for real-time task synchronization across multiple browser tabs and devices in the Todo application.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React/Next.js)                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Task Store (Zustand)                                         │  │
│  │  - Local task state                                           │  │
│  │  - WebSocket message handler                                  │  │
│  │  - Conflict resolution (prefer remote)                        │  │
│  └────────────────────▲──────────────────────────────────────────┘  │
│                       │                                              │
│  ┌────────────────────┴──────────────────────────────────────────┐  │
│  │  WebSocket Hook (use-websocket.ts)                            │  │
│  │  - Connection management                                       │  │
│  │  - Auto-connect/disconnect                                     │  │
│  │  - Event listener registration                                 │  │
│  └────────────────────▲──────────────────────────────────────────┘  │
│                       │                                              │
│  ┌────────────────────┴──────────────────────────────────────────┐  │
│  │  WebSocket Client (sync-client.ts)                            │  │
│  │  - Native WebSocket connection                                 │  │
│  │  - Exponential backoff reconnection                            │  │
│  │  - Message parsing and routing                                 │  │
│  └────────────────────▲──────────────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────────────┘
                         │ ws://localhost:8005/ws/{user_id}
┌────────────────────────┴────────────────────────────────────────────┐
│              WebSocket Service (:8005) - FastAPI                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Connection Manager (broadcaster.py)                          │  │
│  │  - User-isolated connections                                  │  │
│  │  - Broadcast to user's clients                                │  │
│  │  - Heartbeat/ping-pong                                        │  │
│  └────────────────────▲──────────────────────────────────────────┘  │
│                       │                                              │
│  ┌────────────────────┴──────────────────────────────────────────┐  │
│  │  Dapr Subscription Handler (consumer.py)                      │  │
│  │  - Subscribe to "task-updates" topic                          │  │
│  │  - Parse CloudEvents                                          │  │
│  │  - Broadcast to user's connections                            │  │
│  └────────────────────▲──────────────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────────────┘
                         │ Dapr Pub/Sub (task-updates topic)
┌────────────────────────┴────────────────────────────────────────────┐
│                    Backend (:8000) - FastAPI                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Event Publisher (event_publisher.py)                         │  │
│  │  - Publish task events on CRUD operations                     │  │
│  │  - Events: task.created, task.updated, task.deleted           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Backend Event Publishing

**Location**: `backend/src/services/event_publisher.py`

The backend publishes task events to Dapr Pub/Sub on all CRUD operations:

```python
# Task created
await publish_event("task-updates", {
    "event_type": "task.created",
    "user_id": task.user_id,
    "task": task_dict
})
```

**Event Types**:
- `task.created` - New task created
- `task.updated` - Task modified
- `task.completed` - Task marked as complete
- `task.deleted` - Task removed

### 2. WebSocket Service

**Location**: `services/websocket-service/`

Microservice that:
- Accepts WebSocket connections from frontend clients
- Subscribes to Dapr "task-updates" topic
- Broadcasts events to user's connected clients
- Maintains user-isolated connection pools

**Key Files**:
- `src/main.py` - FastAPI app with WebSocket endpoint
- `src/broadcaster.py` - Connection manager with user isolation
- `src/consumer.py` - Dapr subscription handler
- `src/routes.py` - WebSocket route handler
- `components/subscription.yaml` - Dapr subscription config

### 3. Frontend WebSocket Client

**Location**: `frontend/lib/websocket/`

TypeScript WebSocket client with:
- Automatic reconnection with exponential backoff
- Connection state management
- Event listener system
- User isolation by user_id

**Key Files**:
- `sync-client.ts` - Core WebSocket client class
- `use-websocket.ts` - React hook for connection management
- `README.md` - Comprehensive documentation

### 4. Task Store Integration

**Location**: `frontend/stores/task-store.ts`

Zustand store methods:
- `handleWebSocketMessage(message)` - Process incoming events
- `setWebSocketEnabled(enabled)` - Enable/disable sync

**Event Handling Logic**:
```typescript
switch (event) {
  case 'task.created':
    // Add if not present
    if (!tasks.some(t => t.id === task.id)) {
      tasks = [task, ...tasks];
    }
    break;

  case 'task.updated':
    // Update existing (prefer remote)
    tasks = tasks.map(t => t.id === task.id ? task : t);
    break;

  case 'task.deleted':
    // Remove from list
    tasks = tasks.filter(t => t.id !== task.id);
    break;
}
```

### 5. Toast Notifications

**Location**: `frontend/components/tasks/notification-toast.tsx`

Uses Sonner library to show toast notifications for:
- Task created (green)
- Task updated (blue)
- Task deleted (orange)
- Task completed (green)

Auto-dismisses after 3 seconds, clickable to navigate to tasks page.

### 6. Integration Component

**Location**: `frontend/components/tasks/task-sync-provider.tsx`

Provider component that:
- Initializes WebSocket connection
- Connects to task store
- Manages lifecycle (mount/unmount)

**Usage**:
```tsx
// app/tasks/layout.tsx
import { TaskSyncProvider } from '@/components/tasks/task-sync-provider';

export default function TasksLayout({ children }) {
  const { user } = useAuthStore();

  return (
    <TaskSyncProvider userId={user?.id || null}>
      {children}
    </TaskSyncProvider>
  );
}
```

## Message Flow

### Task Creation Flow

```
1. User creates task in Browser Tab A
   ↓
2. Frontend calls POST /api/{user_id}/tasks
   ↓
3. Backend creates task in database
   ↓
4. Backend publishes "task.created" event to Dapr
   ↓
5. Dapr routes event to "task-updates" topic
   ↓
6. WebSocket Service receives event via subscription
   ↓
7. WebSocket Service broadcasts to all user's connections
   ↓
8. Browser Tab B receives WebSocket message
   ↓
9. Frontend updates task store with new task
   ↓
10. React re-renders task list (new task appears)
   ↓
11. Toast notification: "Task created: Buy groceries"
```

### Real-Time Update Flow

```
Browser Tab A                WebSocket Service              Browser Tab B
     │                              │                            │
     │────── Create Task ──────────▶│                            │
     │                              │                            │
     │                              │──── Broadcast ───────────▶│
     │                              │                            │
     │                              │                            │──▶ Update UI
     │                              │                            │──▶ Show Toast
```

## Connection Management

### Reconnection Strategy

**Exponential Backoff**:
```
Attempt 1: 1 second
Attempt 2: 2 seconds
Attempt 3: 4 seconds
Attempt 4: 8 seconds
Attempt 5: 16 seconds
Attempt 6+: 30 seconds (capped)
```

**Max Attempts**: 10

After 10 failed attempts, connection stops retrying.

### Heartbeat

WebSocket service sends ping messages every 30 seconds to keep connections alive:

```json
{
  "type": "ping",
  "timestamp": null
}
```

Clients can optionally respond with pong (not required).

## Event Message Format

### Task Update Event

```typescript
interface WebSocketMessage {
  type: 'task_update';
  event: 'task.created' | 'task.updated' | 'task.deleted' | 'task.completed';
  task: Task;
  timestamp: string; // ISO 8601
}
```

**Example**:
```json
{
  "type": "task_update",
  "event": "task.created",
  "task": {
    "id": 123,
    "user_id": "user-456",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "priority": "medium",
    "created_at": "2025-12-31T12:00:00Z",
    "updated_at": "2025-12-31T12:00:00Z"
  },
  "timestamp": "2025-12-31T12:00:01Z"
}
```

## Configuration

### Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8005/ws
```

**WebSocket Service** (`.env`):
```env
HOST=0.0.0.0
PORT=8005
DAPR_HTTP_PORT=3500
DAPR_PUBSUB_NAME=taskpubsub
DAPR_TOPIC=task-updates
HEARTBEAT_INTERVAL=30
```

### Dapr Subscription Config

**File**: `services/websocket-service/components/subscription.yaml`

```yaml
apiVersion: dapr.io/v1alpha1
kind: Subscription
metadata:
  name: websocket-task-updates-subscription
  namespace: todo-app
spec:
  topic: task-updates
  routes:
    - task-updates
  pubsubname: taskpubsub
  scopes:
    - websocket-service
```

## Testing

### Manual Testing

1. **Start all services**:
   ```bash
   # Terminal 1: Backend
   cd backend
   uvicorn src.main:app --reload

   # Terminal 2: WebSocket Service
   cd services/websocket-service
   uvicorn src.main:app --port 8005 --reload

   # Terminal 3: Frontend
   cd frontend
   npm run dev
   ```

2. **Test real-time sync**:
   - Open `http://localhost:3000/tasks` in two browser tabs
   - Create a task in Tab A
   - Verify it appears in Tab B within 1 second
   - Check toast notification appears
   - Update task in Tab B
   - Verify update appears in Tab A
   - Delete task in Tab A
   - Verify it disappears from Tab B

3. **Test reconnection**:
   - Open browser console (F12)
   - Stop WebSocket service (Ctrl+C)
   - Observe reconnection attempts in console
   - Restart WebSocket service
   - Verify automatic reconnection
   - Create task and verify sync works

### Integration Testing

```bash
# Start services with Dapr
dapr run --app-id backend --app-port 8000 -- uvicorn src.main:app
dapr run --app-id websocket-service --app-port 8005 -- uvicorn src.main:app

# Test event flow
curl -X POST http://localhost:8000/api/{user_id}/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "priority": "high"}'

# Check WebSocket service logs for received event
# Check frontend browser console for WebSocket message
```

## Monitoring

### Connection Status

Check active connections:
```bash
curl http://localhost:8005/status
```

Response:
```json
{
  "service": "WebSocket Service",
  "version": "1.0.0",
  "status": "running",
  "connections": 5,
  "active_users": 3,
  "connections_per_user": {
    "user-1": 2,
    "user-2": 2,
    "user-3": 1
  }
}
```

### Health Checks

```bash
# WebSocket service health
curl http://localhost:8005/health

# WebSocket service readiness
curl http://localhost:8005/ready
```

## Troubleshooting

### Issue: WebSocket not connecting

**Symptoms**: Frontend shows "disconnected" status

**Checks**:
1. Verify WebSocket service is running:
   ```bash
   curl http://localhost:8005/health
   ```
2. Check environment variable:
   ```bash
   echo $NEXT_PUBLIC_WEBSOCKET_URL
   ```
3. Inspect browser console for errors
4. Verify user is authenticated (userId not null)

**Solution**: Ensure all services are running and environment variables are set.

---

### Issue: Messages not syncing

**Symptoms**: Task updates don't appear in other tabs

**Checks**:
1. Verify WebSocket status is "connected"
2. Check backend is publishing events:
   ```bash
   # Check backend logs for "Publishing event" messages
   ```
3. Verify Dapr subscription is active:
   ```bash
   dapr list
   ```
4. Check WebSocket service logs for received events

**Solution**: Verify Dapr sidecar is running and subscription is configured correctly.

---

### Issue: Too many reconnection attempts

**Symptoms**: Console flooded with reconnection messages

**Checks**:
1. Verify WebSocket service is stable
2. Check network connectivity
3. Review WebSocket service logs for errors

**Solution**: Fix underlying service issues or increase backoff delays.

---

### Issue: Toast notifications not showing

**Symptoms**: Updates sync but no notifications appear

**Checks**:
1. Verify `Toaster` component is in app layout
2. Check `wsEnabled` flag in task store
3. Inspect browser console for errors

**Solution**: Ensure Sonner is properly configured in root layout.

## Performance Considerations

### Connection Limits

- **Frontend**: 1 connection per tab per user
- **Backend**: Default limit of 100 concurrent connections per user
- **Total**: Scales horizontally with multiple WebSocket service instances

### Message Size

- Average message size: ~500 bytes
- Peak throughput: ~1000 messages/second per service instance

### Latency

- Local development: <50ms
- Production (same region): <100ms
- Production (cross-region): <200ms

## Security Considerations

### Production Checklist

- [ ] Use secure WebSocket (wss://) in production
- [ ] Add JWT token authentication to WebSocket handshake
- [ ] Configure CORS origins whitelist
- [ ] Implement rate limiting (max 100 messages/minute per user)
- [ ] Add connection throttling (max 5 connections per user)
- [ ] Enable TLS for all service communication
- [ ] Implement message signing/verification
- [ ] Add audit logging for all WebSocket events
- [ ] Configure firewall rules to restrict WebSocket port

### Authentication Flow

```
1. Frontend obtains JWT token from auth service
2. Frontend includes token in WebSocket URL query: ws://host/ws/{user_id}?token={jwt}
3. WebSocket service validates JWT before accepting connection
4. WebSocket service extracts user_id from JWT
5. Connection is isolated by validated user_id
```

## Production Deployment

### Kubernetes Configuration

```yaml
# WebSocket service deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: websocket-service
spec:
  replicas: 3
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
    spec:
      containers:
      - name: websocket-service
        image: your-registry/websocket-service:latest
        ports:
        - containerPort: 8005
        env:
        - name: DAPR_HTTP_PORT
          value: "3500"
        - name: DAPR_PUBSUB_NAME
          value: "taskpubsub"
        - name: DAPR_TOPIC
          value: "task-updates"
```

### Load Balancing

Use sticky sessions to ensure all connections from a user go to the same instance:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: websocket-service
spec:
  type: LoadBalancer
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
  ports:
  - port: 8005
    targetPort: 8005
```

## Future Enhancements

- [ ] Add message compression for large payloads
- [ ] Implement message queuing for offline clients
- [ ] Add connection recovery with state synchronization
- [ ] Implement presence detection (user online/offline)
- [ ] Add typing indicators for collaborative editing
- [ ] Implement cursor position sharing
- [ ] Add conflict resolution with operational transformation
- [ ] Implement message acknowledgments
- [ ] Add client-side message caching
- [ ] Implement progressive enhancement (fallback to polling)

## References

- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Dapr Pub/Sub](https://docs.dapr.io/developing-applications/building-blocks/pubsub/)
- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)
- [Sonner Toast Library](https://sonner.emilkowal.ski/)
- [Zustand State Management](https://zustand-demo.pmnd.rs/)

## Support

For issues or questions:
1. Check this documentation
2. Review WebSocket service logs
3. Inspect browser console
4. Check Dapr logs: `dapr logs --app-id websocket-service`
5. Open an issue in the repository
