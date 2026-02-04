# WebSocket Real-Time Sync - Usage Guide

Quick guide to enable real-time task synchronization in your application.

## Quick Start

### 1. Add Environment Variable

Create/update `frontend/.env.local`:

```env
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8005/ws
```

### 2. Wrap Your Layout with TaskSyncProvider

Add the `TaskSyncProvider` component to your tasks layout:

```tsx
// app/tasks/layout.tsx
'use client';

import { TaskSyncProvider } from '@/components/tasks/task-sync-provider';
import { useAuthStore } from '@/stores/auth-store';

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  return (
    <TaskSyncProvider userId={user?.id || null}>
      {children}
    </TaskSyncProvider>
  );
}
```

### 3. That's It!

Your tasks will now sync in real-time across all browser tabs and devices.

## What You Get

- **Real-time updates**: Tasks sync instantly across tabs
- **Toast notifications**: Visual feedback for all changes
- **Automatic reconnection**: Survives network issues
- **User isolation**: Users only see their own updates

## Testing

1. Open `http://localhost:3000/tasks` in two browser tabs
2. Create a task in Tab A
3. Watch it appear in Tab B automatically
4. See the toast notification

## Advanced Usage

### Custom WebSocket Integration

If you need more control, use the hook directly:

```tsx
'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket/use-websocket';
import { useTaskStore } from '@/stores/task-store';

export function MyCustomComponent() {
  const { user } = useAuthStore();
  const { handleWebSocketMessage } = useTaskStore();
  const {
    isConnected,
    status,
    retryCount,
    addListener,
    removeListener
  } = useWebSocket(user?.id || null);

  useEffect(() => {
    const listener = (message) => {
      console.log('Received:', message);
      handleWebSocketMessage(message);
    };

    addListener(listener);
    return () => removeListener(listener);
  }, [addListener, removeListener, handleWebSocketMessage]);

  return (
    <div>
      <span>Connection: {status}</span>
      {status === 'connecting' && <span> (retry {retryCount})</span>}
    </div>
  );
}
```

### Connection Status Indicator

Display connection status to users:

```tsx
'use client';

import { useWebSocket } from '@/lib/websocket/use-websocket';
import { useAuthStore } from '@/stores/auth-store';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const { user } = useAuthStore();
  const { status, retryCount } = useWebSocket(user?.id || null);

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Wifi className="h-4 w-4" />
        <span className="text-sm">Live</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <WifiOff className="h-4 w-4 animate-pulse" />
        <span className="text-sm">Connecting... (retry {retryCount})</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm">Connection failed</span>
      </div>
    );
  }

  return null;
}
```

### Custom Notification Handling

Override default toast notifications:

```tsx
'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket/use-websocket';
import { useTaskStore } from '@/stores/task-store';
import { toast } from 'sonner';

export function CustomNotifications() {
  const { user } = useAuthStore();
  const { addListener, removeListener } = useWebSocket(user?.id || null);

  useEffect(() => {
    const listener = (message) => {
      if (message.type === 'task_update' && message.task) {
        // Custom notification logic
        switch (message.event) {
          case 'task.created':
            toast.success(`New task: ${message.task.title}`, {
              description: 'A new task was added',
              action: {
                label: 'View',
                onClick: () => router.push(`/tasks/${message.task.id}`)
              }
            });
            break;
          // Add more custom cases...
        }
      }
    };

    addListener(listener);
    return () => removeListener(listener);
  }, [addListener, removeListener]);

  return null;
}
```

### Disable Sync Conditionally

Control when sync is enabled:

```tsx
'use client';

import { TaskSyncProvider } from '@/components/tasks/task-sync-provider';
import { useAuthStore } from '@/stores/auth-store';

export default function ConditionalSyncLayout({ children }) {
  const { user, preferences } = useAuthStore();

  // Only enable sync if user has opted in
  const syncEnabled = preferences?.realTimeSync === true;

  return (
    <TaskSyncProvider userId={user?.id || null} enabled={syncEnabled}>
      {children}
    </TaskSyncProvider>
  );
}
```

## Troubleshooting

### WebSocket Not Connecting

**Check environment variable:**
```bash
# In frontend directory
cat .env.local | grep WEBSOCKET
```

**Verify service is running:**
```bash
curl http://localhost:8005/health
```

**Check browser console:**
- Open DevTools (F12)
- Look for WebSocket connection errors
- Verify userId is not null

### Updates Not Syncing

**Verify connection status:**
```tsx
const { status } = useWebSocket(userId);
console.log('WebSocket status:', status);
```

**Check backend is publishing events:**
- Look for "Publishing event" in backend logs
- Verify task CRUD operations trigger events

**Check Dapr subscription:**
```bash
dapr list
# Ensure websocket-service is running with Dapr
```

### Too Many Reconnections

The client will retry up to 10 times with exponential backoff (1s → 30s). If you see constant reconnections:

1. Check WebSocket service stability
2. Verify network connectivity
3. Review service logs for errors

## Production Considerations

### Use Secure WebSocket

Update environment variable for production:

```env
# Production
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-domain.com/ws
```

### Add Authentication

For production, add JWT authentication:

```typescript
// Custom implementation with auth token
const wsUrl = `${WEBSOCKET_URL}/${userId}?token=${authToken}`;
const client = new WebSocketSyncClient(wsUrl, userId);
```

### Monitor Connections

Check active connections:

```bash
curl https://your-domain.com/status
```

## Performance Tips

- WebSocket client is lightweight (~500 bytes per message)
- Reconnection uses exponential backoff to avoid server overload
- User isolation ensures scalability
- Heartbeat keeps connections alive efficiently

## Examples

See complete examples in:
- `/frontend/lib/websocket/README.md` - Full documentation
- `/docs/WEBSOCKET-INTEGRATION.md` - Implementation guide
- `/frontend/components/tasks/task-sync-provider.tsx` - Integration component

## Support

For issues:
1. Check browser console for WebSocket errors
2. Verify environment variables
3. Check service health endpoints
4. Review documentation in `/docs/WEBSOCKET-INTEGRATION.md`
