# WebSocket Real-Time Task Synchronization

This directory contains the WebSocket client implementation for real-time task synchronization across multiple browser tabs and devices.

## Architecture

```
Frontend (React) ←→ WebSocket Service (:8005) ←→ Dapr Pub/Sub ←→ Backend (task events)
```

## Components

### 1. `sync-client.ts` - WebSocket Client

Core WebSocket client with automatic reconnection:

- **Exponential backoff**: 1s → 2s → 4s → 8s → 16s → 30s
- **Max retries**: 10 attempts
- **User isolation**: Connections are isolated by user_id
- **Event handling**: Type-safe message parsing and event dispatching

```typescript
import { WebSocketSyncClient } from './sync-client';

const client = new WebSocketSyncClient('ws://localhost:8005/ws', userId);
client.connect();

client.addMessageListener((message) => {
  console.log('Task update:', message);
});
```

### 2. `use-websocket.ts` - React Hook

React hook for WebSocket connection management:

- **Auto-connect**: Connects on mount, disconnects on unmount
- **Connection state**: Provides connection status and retry count
- **Event listeners**: Manages message event listeners
- **Lifecycle management**: Automatic cleanup on unmount

```typescript
import { useWebSocket } from './use-websocket';

function MyComponent() {
  const { isConnected, status, addListener } = useWebSocket(userId);

  useEffect(() => {
    const listener = (message) => {
      console.log('Received:', message);
    };
    addListener(listener);
    return () => removeListener(listener);
  }, []);

  return <div>Status: {status}</div>;
}
```

## Integration with Task Store

The WebSocket integration is connected to the Zustand task store:

### Task Store Methods

```typescript
// Handle incoming WebSocket messages
handleWebSocketMessage(message: WebSocketMessage): void

// Enable/disable notifications
setWebSocketEnabled(enabled: boolean): void
```

### Event Handling

The task store automatically updates local state when receiving WebSocket events:

- `task.created` → Adds new task to list
- `task.updated` → Updates existing task
- `task.completed` → Marks task as complete
- `task.deleted` → Removes task from list

**Conflict resolution**: Remote state always takes precedence over local state.

## Usage

### 1. Add TaskSyncProvider to your layout

```tsx
// app/tasks/layout.tsx
import { TaskSyncProvider } from '@/components/tasks/task-sync-provider';
import { useAuthStore } from '@/stores/auth-store';

export default function TasksLayout({ children }) {
  const { user } = useAuthStore();

  return (
    <TaskSyncProvider userId={user?.id || null}>
      {children}
    </TaskSyncProvider>
  );
}
```

### 2. Tasks automatically sync in real-time

```tsx
// app/tasks/page.tsx
import { useTaskStore } from '@/stores/task-store';

export default function TasksPage() {
  const { tasks } = useTaskStore();

  // Tasks automatically update when changed in another tab/device
  return (
    <div>
      {tasks.map((task) => (
        <div key={task.id}>{task.title}</div>
      ))}
    </div>
  );
}
```

### 3. Notifications appear automatically

Toast notifications appear for all real-time updates (configured via Sonner):

- ✅ Task created
- 🔄 Task updated
- ✔️ Task completed
- 🗑️ Task deleted

## Environment Configuration

Add to `.env.local`:

```env
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8005/ws
```

## Event Message Format

WebSocket messages follow this structure:

```typescript
interface WebSocketMessage {
  type: 'task_update' | 'ping';
  event?: 'task.created' | 'task.updated' | 'task.deleted' | 'task.completed';
  task?: Task;
  timestamp?: string;
}
```

### Example Messages

**Task Created:**
```json
{
  "type": "task_update",
  "event": "task.created",
  "task": {
    "id": 123,
    "title": "New Task",
    "completed": false,
    ...
  },
  "timestamp": "2025-12-31T12:00:00Z"
}
```

**Heartbeat (Ping):**
```json
{
  "type": "ping",
  "timestamp": null
}
```

## Connection States

| State | Description |
|-------|-------------|
| `disconnected` | Not connected to WebSocket server |
| `connecting` | Attempting to connect |
| `connected` | Successfully connected, receiving updates |
| `error` | Connection error, will retry with backoff |

## Testing

### Manual Testing

1. **Start services:**
   ```bash
   # Terminal 1: Backend
   cd backend && uvicorn src.main:app --reload

   # Terminal 2: WebSocket Service
   cd services/websocket-service && uvicorn src.main:app --port 8005

   # Terminal 3: Frontend
   cd frontend && npm run dev
   ```

2. **Test real-time sync:**
   - Open `http://localhost:3000/tasks` in two browser tabs
   - Create/update/delete a task in one tab
   - Verify it updates in the other tab within 1 second
   - Check that toast notifications appear

3. **Test reconnection:**
   - Stop WebSocket service
   - Observe reconnection attempts with exponential backoff
   - Restart service and verify automatic reconnection

### Connection Status Display (Optional)

```tsx
import { useWebSocket } from '@/lib/websocket/use-websocket';

function ConnectionIndicator() {
  const { status, retryCount } = useWebSocket(userId);

  return (
    <div>
      Status: {status}
      {status === 'connecting' && ` (retry ${retryCount})`}
    </div>
  );
}
```

## Troubleshooting

### WebSocket not connecting

1. Check WebSocket service is running: `curl http://localhost:8005/health`
2. Verify environment variable: `NEXT_PUBLIC_WEBSOCKET_URL`
3. Check browser console for connection errors
4. Ensure user is authenticated (userId is not null)

### Messages not appearing

1. Check WebSocket status is 'connected'
2. Verify task events are being published by backend
3. Check Dapr sidecar is running for WebSocket service
4. Verify Dapr subscription configuration

### Toast notifications not showing

1. Confirm `Toaster` component is in app layout
2. Check `wsEnabled` flag in task store
3. Verify `showTaskNotification` is being called

## Production Considerations

- Use secure WebSocket (wss://) in production
- Configure proper CORS origins
- Add authentication token to WebSocket connection
- Monitor connection metrics (reconnect frequency, error rate)
- Implement connection pooling limits
- Add rate limiting for WebSocket events

## Related Files

- `/services/websocket-service/` - WebSocket service backend
- `/frontend/stores/task-store.ts` - Task state management
- `/frontend/components/tasks/notification-toast.tsx` - Toast notifications
- `/frontend/components/tasks/task-sync-provider.tsx` - Integration component
