# OpenAI ChatKit Reference

Detailed API reference for OpenAI ChatKit React integration.

**Official Documentation**: [openai.github.io/chatkit-js](https://openai.github.io/chatkit-js/)

---

## Installation

### NPM Packages

| Package | Description |
|---------|-------------|
| `@openai/chatkit-react` | React bindings with hooks and components |
| `@openai/chatkit` | TypeScript types for the WebComponent |

```bash
npm install @openai/chatkit-react
```

---

## React Components

### ChatKit Component

The main chat interface component.

```tsx
import { ChatKit } from '@openai/chatkit-react';

<ChatKit
  control={control}
  className="h-[600px] w-[400px]"
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `control` | `ChatKitControl` | Control object from `useChatKit` hook |
| `className` | `string` | CSS classes for styling |
| `style` | `CSSProperties` | Inline styles |

---

## React Hooks

### useChatKit

Main hook for configuring and controlling ChatKit.

```tsx
import { useChatKit } from '@openai/chatkit-react';

const { control } = useChatKit({
  api: {
    url: 'https://your-backend.com/api/chat',
    domainKey: 'your-domain-key',
    async getClientSecret(existingSecret) {
      // Return new or existing secret
      return existingSecret || await fetchNewSecret();
    },
  },
});
```

**Parameters:**

```typescript
interface UseChatKitOptions {
  api: {
    url?: string;           // Backend URL for self-hosted
    domainKey?: string;     // Domain key for OpenAI-hosted
    getClientSecret?: (existing: string | null) => Promise<string>;
  };
}
```

**Returns:**

```typescript
interface UseChatKitResult {
  control: ChatKitControl;  // Pass to ChatKit component
}
```

---

## API Configuration

### OpenAI-Hosted Backend

Use with OpenAI's managed infrastructure:

```tsx
const { control } = useChatKit({
  api: {
    domainKey: 'your-domain-key',
    async getClientSecret(existing) {
      if (existing) return existing;

      const response = await fetch('/api/chatkit/session', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      return data.client_secret;
    },
  },
});
```

### Self-Hosted Backend

Use with your own backend:

```tsx
const { control } = useChatKit({
  api: {
    url: 'http://localhost:8000/api/chatkit/message',
    // No domainKey needed
  },
});
```

---

## CSS Custom Properties

ChatKit exposes CSS custom properties for theming:

| Property | Description | Default |
|----------|-------------|---------|
| `--chatkit-bg` | Background color | `#ffffff` |
| `--chatkit-text` | Text color | `#000000` |
| `--chatkit-primary` | Primary accent color | `#0066cc` |
| `--chatkit-border` | Border color | `#e0e0e0` |
| `--chatkit-input-bg` | Input background | `#f5f5f5` |
| `--chatkit-message-user` | User message background | `#0066cc` |
| `--chatkit-message-assistant` | Assistant message background | `#f0f0f0` |

**Usage:**

```tsx
<ChatKit
  control={control}
  className="
    [--chatkit-bg:#1a1a1a]
    [--chatkit-text:#ffffff]
    [--chatkit-primary:#3b82f6]
  "
/>
```

---

## Widget Types

ChatKit supports rich widgets in messages:

### Text Widget

```json
{
  "type": "text",
  "content": "Hello! How can I help you today?"
}
```

### List Widget

```json
{
  "type": "list",
  "title": "Your Tasks",
  "items": [
    {
      "title": "Buy groceries",
      "subtitle": "Due today",
      "icon": "task"
    },
    {
      "title": "Call doctor",
      "subtitle": "Completed",
      "icon": "check"
    }
  ]
}
```

### Card Widget

```json
{
  "type": "card",
  "title": "Task Created",
  "description": "Your task has been added successfully.",
  "icon": "check",
  "actions": [
    {
      "label": "View Task",
      "action": "view_task",
      "data": { "task_id": 123 }
    }
  ]
}
```

### Button Widget

```json
{
  "type": "button",
  "label": "Add Another Task",
  "action": "add_task"
}
```

### Form Widget

```json
{
  "type": "form",
  "title": "Create Task",
  "fields": [
    {
      "name": "title",
      "label": "Task Title",
      "type": "text",
      "required": true
    },
    {
      "name": "description",
      "label": "Description",
      "type": "textarea"
    }
  ],
  "submit_label": "Create"
}
```

---

## Event Handling

### Widget Action Events

```tsx
const { control } = useChatKit({
  api: { url: '...' },
  onWidgetAction: (action, data) => {
    console.log('Widget action:', action, data);
    // Handle the action
  },
});
```

### Message Events

```tsx
const { control } = useChatKit({
  api: { url: '...' },
  onMessage: (message) => {
    console.log('New message:', message);
  },
  onError: (error) => {
    console.error('ChatKit error:', error);
  },
});
```

---

## Streaming Responses

ChatKit automatically handles streaming. Your backend should return Server-Sent Events (SSE):

```python
from fastapi.responses import StreamingResponse

@router.post("/message")
async def handle_message(request: Request):
    async def generate():
        # Yield text chunks
        yield f"data: {json.dumps({'type': 'text', 'content': 'Hello'})}\n\n"
        yield f"data: {json.dumps({'type': 'text', 'content': ' world!'})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

---

## File Handling

ChatKit supports file uploads:

```tsx
const { control } = useChatKit({
  api: { url: '...' },
  files: {
    enabled: true,
    maxSize: 10 * 1024 * 1024,  // 10MB
    accept: ['image/*', '.pdf', '.doc', '.docx'],
  },
});
```

---

## Mobile Responsiveness

ChatKit is mobile-responsive by default. Use container classes:

```tsx
<div className="h-screen w-full md:max-w-2xl md:mx-auto">
  <ChatKit
    control={control}
    className="h-full w-full"
  />
</div>
```

---

## TypeScript Types

### Message Type

```typescript
interface ChatKitMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  widgets?: ChatKitWidget[];
  timestamp: Date;
}
```

### Widget Type

```typescript
interface ChatKitWidget {
  type: 'text' | 'list' | 'card' | 'button' | 'form';
  title?: string;
  content?: string;
  items?: Array<{ title: string; subtitle?: string }>;
  actions?: Array<{ label: string; action: string }>;
}
```

---

## Best Practices

1. **Token Management** - Refresh client secrets before expiry
2. **Error Handling** - Implement `onError` callback for user feedback
3. **Mobile First** - Design for mobile, enhance for desktop
4. **Streaming** - Use SSE for natural conversation flow
5. **Theming** - Match ChatKit theme to your app's design system
6. **Accessibility** - ChatKit is accessible by default, don't break it

---

## See Also

- [SKILL.md](./SKILL.md) - Quick start guide
- [examples.md](./examples.md) - Complete code examples
- [ChatKit.js Docs](https://openai.github.io/chatkit-js/)
- [GitHub Repository](https://github.com/openai/chatkit-js)
