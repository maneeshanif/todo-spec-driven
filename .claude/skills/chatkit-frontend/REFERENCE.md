# ChatKit Frontend Reference

Complete API reference for OpenAI ChatKit React integration.

**Official Documentation**:
- [ChatKit.js Docs](https://openai.github.io/chatkit-js/)
- [API Reference](https://openai.github.io/chatkit-js/api/)

---

## Package Installation

```bash
npm install @openai/chatkit-react
```

---

## React Components

### ChatKit

The main chat interface component.

```tsx
import { ChatKit } from '@openai/chatkit-react';

<ChatKit
  control={control}           // Required: from useChatKit()
  className="h-full w-full"   // Optional: CSS classes
  style={{ height: '600px' }} // Optional: inline styles
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `control` | `ChatKitControl` | Yes | Control object from `useChatKit` hook |
| `className` | `string` | No | CSS classes for styling |
| `style` | `CSSProperties` | No | Inline styles |

---

## React Hooks

### useChatKit

Main hook for configuring and controlling ChatKit.

```tsx
import { useChatKit } from '@openai/chatkit-react';

const { control } = useChatKit(options);
```

**Full Options:**

```typescript
interface UseChatKitOptions {
  // API Configuration (Required)
  api: CustomApiConfig | HostedApiConfig;

  // Theme Configuration
  theme?: {
    colorScheme?: 'light' | 'dark' | 'system';
    radius?: 'sharp' | 'round' | 'pill';
    color?: {
      accent?: { primary: string; level: number };
      grayscale?: { hue: number; tint: number; shade: number };
    };
  };

  // Start Screen
  startScreen?: {
    greeting?: string;
    prompts?: string[];
  };

  // Header
  header?: {
    enabled?: boolean;
    title?: string;
    rightAction?: {
      icon: string;
      onClick: () => void;
    };
  };

  // Composer (Input)
  composer?: {
    placeholder?: string;
  };

  // History (Built-in sidebar)
  history?: {
    enabled?: boolean;
    showDelete?: boolean;
    showRename?: boolean;
  };

  // Disclaimer
  disclaimer?: {
    enabled?: boolean;
    text?: string;
  };

  // Thread Item Actions
  threadItemActions?: {
    feedback?: boolean;
    retry?: boolean;
  };

  // Event Handlers
  onClientTool?: (invocation: ToolInvocation) => Promise<ToolResult>;
  onMessage?: (message: Message) => void;
  onError?: (error: { error: Error }) => void;
}
```

---

## API Configuration

### CustomApiConfig (Self-Hosted)

For self-hosted backend:

```typescript
interface CustomApiConfig {
  url: string;              // Backend URL (e.g., 'http://localhost:8000/chatkit')
  domainKey: string;        // Domain key (use 'local-dev' for development)
  fetch?: typeof fetch;     // Optional custom fetch
  uploadStrategy?: FileUploadStrategy;
}
```

**Example:**

```tsx
const { control } = useChatKit({
  api: {
    url: `${process.env.NEXT_PUBLIC_API_URL}/chatkit`,
    domainKey: process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY || 'local-dev',
  },
});
```

### HostedApiConfig (OpenAI-Hosted)

For OpenAI-hosted deployment:

```typescript
interface HostedApiConfig {
  domainKey: string;
  getClientSecret: (existingSecret: string | null) => Promise<string>;
}
```

**Example:**

```tsx
const { control } = useChatKit({
  api: {
    domainKey: 'your-domain-key',
    async getClientSecret(existing) {
      if (existing) return existing;
      const res = await fetch('/api/chatkit/session');
      return (await res.json()).client_secret;
    },
  },
});
```

---

## Theme Configuration

### Color Scheme

```tsx
theme: {
  colorScheme: 'light',  // 'light' | 'dark' | 'system'
}
```

### Border Radius

```tsx
theme: {
  radius: 'round',  // 'sharp' | 'round' | 'pill'
}
```

### Custom Colors

```tsx
theme: {
  color: {
    accent: {
      primary: '#0066cc',  // Primary accent color
      level: 2,            // Intensity (1-3)
    },
    grayscale: {
      hue: 220,    // Color hue for grays
      tint: 6,     // Light mode tint
      shade: -4,   // Dark mode shade
    },
  },
}
```

### CSS Custom Properties

ChatKit exposes CSS custom properties for styling:

| Property | Description | Default |
|----------|-------------|---------|
| `--chatkit-bg` | Background color | `#ffffff` |
| `--chatkit-text` | Text color | `#000000` |
| `--chatkit-primary` | Primary accent | `#0066cc` |
| `--chatkit-border` | Border color | `#e0e0e0` |
| `--chatkit-input-bg` | Input background | `#f5f5f5` |
| `--chatkit-message-user` | User message bg | `#0066cc` |
| `--chatkit-message-assistant` | Assistant message bg | `#f0f0f0` |

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

## Start Screen Configuration

```tsx
startScreen: {
  greeting: 'Hello! How can I help you today?',
  prompts: [
    'Show my tasks',
    'Add a new task',
    'What tasks are due today?',
  ],
}
```

---

## Header Configuration

```tsx
header: {
  enabled: true,
  title: 'Task Assistant',
  rightAction: {
    icon: 'settings',  // Icon name
    onClick: () => openSettings(),
  },
}
```

**Available Icons:**
- `settings`
- `light-mode`
- `dark-mode`
- `menu`
- `close`

---

## Composer Configuration

```tsx
composer: {
  placeholder: 'Ask about your tasks...',
}
```

---

## History Configuration

Built-in conversation history sidebar:

```tsx
history: {
  enabled: true,        // Show/hide history sidebar
  showDelete: true,     // Allow deleting conversations
  showRename: true,     // Allow renaming conversations
}
```

**Note:** For custom sidebar, set `enabled: false` and use your own `ConversationSidebar` component.

---

## Event Handlers

### onClientTool

Handle client-side tool invocations:

```tsx
onClientTool: async (invocation) => {
  const { name, params } = invocation;

  switch (name) {
    case 'switch_theme':
      setTheme(params.theme);
      return { success: true };

    case 'navigate':
      router.push(params.path);
      return { success: true };

    default:
      return { success: false };
  }
}
```

**ToolInvocation Type:**

```typescript
interface ToolInvocation {
  name: string;
  params: Record<string, unknown>;
}

interface ToolResult {
  success: boolean;
  data?: unknown;
}
```

### onMessage

Handle new messages:

```tsx
onMessage: (message) => {
  console.log('New message:', message);
  // Refresh conversation list
  refreshConversations();
}
```

**Message Type:**

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  widgets?: Widget[];
  timestamp: Date;
}
```

### onError

Handle errors:

```tsx
onError: ({ error }) => {
  console.error('ChatKit error:', error);
  toast.error('Something went wrong');
}
```

---

## Widget Types

ChatKit supports rich widgets in messages:

### Text Widget

```json
{
  "type": "text",
  "content": "Here are your tasks:"
}
```

### List Widget

```json
{
  "type": "list",
  "title": "Your Tasks",
  "items": [
    { "title": "Buy groceries", "subtitle": "Due today", "icon": "task" },
    { "title": "Call doctor", "subtitle": "Completed", "icon": "check" }
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
    { "label": "View Task", "action": "view_task", "data": { "task_id": 123 } }
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
    { "name": "title", "label": "Task Title", "type": "text", "required": true },
    { "name": "description", "label": "Description", "type": "textarea" }
  ],
  "submit_label": "Create"
}
```

---

## TypeScript Types

### ChatKitControl

```typescript
interface ChatKitControl {
  // Internal control methods
  // Passed to ChatKit component
}
```

### Message

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  widgets?: Widget[];
  timestamp: Date;
}
```

### Widget

```typescript
interface Widget {
  type: 'text' | 'list' | 'card' | 'button' | 'form';
  title?: string;
  content?: string;
  items?: Array<{ title: string; subtitle?: string; icon?: string }>;
  actions?: Array<{ label: string; action: string; data?: unknown }>;
  fields?: Array<{ name: string; label: string; type: string; required?: boolean }>;
}
```

---

## Backend SSE Format

ChatKit expects Server-Sent Events in this format:

### Text Events

```
data: {"type": "text", "content": "Hello"}\n\n
data: {"type": "text", "content": " world"}\n\n
```

### Done Event

```
data: [DONE]\n\n
```

Or:

```
data: {"type": "done"}\n\n
```

### Tool Call Events

```
data: {"type": "tool_call", "name": "add_task", "args": {"title": "Buy groceries"}}\n\n
data: {"type": "tool_result", "result": {"success": true, "task_id": 123}}\n\n
```

---

## File Handling

Enable file uploads:

```tsx
const { control } = useChatKit({
  api: { url: '/chatkit', domainKey: 'local-dev' },
  // File handling is enabled by default
  // Configure uploadStrategy for custom upload handling
});
```

---

## Mobile Responsiveness

ChatKit is mobile-responsive by default:

```tsx
<div className="h-screen w-full md:max-w-2xl md:mx-auto">
  <ChatKit control={control} className="h-full w-full" />
</div>
```

---

## See Also

- [SKILL.md](./SKILL.md) - Quick start guide
- [examples.md](./examples.md) - Complete code examples
- [ChatKit.js Docs](https://openai.github.io/chatkit-js/)
