# Frontend Guidelines - Todo Web Application Phase 2

**Project**: Todo Web Application - Frontend  
**Phase**: Phase 2 - Full-Stack Web Application  
**Technology**: Next.js 16+ (App Router) + TypeScript + Shadcn/ui

---

## 🔗 Coupling with Root CLAUDE.md

This file extends the root `../CLAUDE.md`. Always read the root file first for:
- Project overview and phase information
- Available agents and skills
- Spec-driven development workflow
- PHR and ADR requirements

---

## Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16+ | React framework with App Router |
| TypeScript | 5.0+ | Type-safe JavaScript |
| React | 19 | UI library |
| Tailwind CSS | 4.0 | Utility-first CSS |
| Shadcn/ui | Latest | Component library |
| Framer Motion | 11+ | Animations |
| Better Auth | Latest | Authentication |

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Landing page (/)
│   │   ├── (auth)/              # Auth route group
│   │   │   ├── login/page.tsx   # Login page
│   │   │   └── signup/page.tsx  # Signup page
│   │   └── (dashboard)/         # Protected route group
│   │       ├── layout.tsx       # Dashboard layout
│   │       └── tasks/page.tsx   # Main tasks page
│   ├── components/
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── auth/                # Authentication components
│   │   ├── tasks/               # Task-related components
│   │   └── layout/              # Layout components
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   ├── auth.ts              # Better Auth config
│   │   ├── types.ts             # TypeScript types
│   │   └── utils.ts             # Utilities (cn, etc.)
│   ├── hooks/
│   │   ├── use-auth.ts          # Auth hook
│   │   └── use-tasks.ts         # Tasks data hook
│   └── styles/
│       └── globals.css          # Global styles
├── public/                       # Static assets
├── tests/                        # Tests
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── components.json              # Shadcn/ui config
└── .env.local.example
```

---

## Available Agents

Call these specialized agents for frontend tasks:

| Agent | Command | When to Use |
|-------|---------|-------------|
| **Frontend UI Builder** | `@frontend-ui-builder` | Building components, pages, implementing UI specs |

---

## Available Skills

Use these skills for setup and configuration:

| Skill | Command | When to Use |
|-------|---------|-------------|
| **Next.js Setup** | Reference `nextjs-setup` | Initialize project, configure Next.js |
| **Shadcn/ui Setup** | Reference `shadcn-ui-setup` | Add UI components |
| **Better Auth** | Reference `better-auth-integration` | Implement authentication |

---

## Development Patterns

### Server Components (Default)

Use Server Components by default for:
- Data fetching
- Static content
- SEO-critical pages

```tsx
// app/tasks/page.tsx - Server Component
import { api } from '@/lib/api'

export default async function TasksPage() {
  const tasks = await api.getTasks() // Server-side fetch
  return <TaskList tasks={tasks} />
}
```

### Client Components

Add `"use client"` only when needed for:
- Event handlers (onClick, onChange)
- Browser APIs
- State (useState, useReducer)
- Effects (useEffect)

```tsx
"use client"

import { useState } from 'react'

export function TaskItem({ task }) {
  const [isEditing, setIsEditing] = useState(false)
  // ...
}
```

### API Client

All backend calls should use the centralized API client:

```tsx
import { api } from '@/lib/api'

// Fetch tasks
const tasks = await api.getTasks(userId)

// Create task
const newTask = await api.createTask(userId, { title: 'New Task' })

// Update task
await api.updateTask(userId, taskId, { title: 'Updated' })

// Delete task
await api.deleteTask(userId, taskId)

// Toggle complete
await api.toggleTaskComplete(userId, taskId)
```

---

## Component Guidelines

### Shadcn/ui Components

Import from `@/components/ui`:

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
```

### Framer Motion Animations

Use for task list animations:

```tsx
import { motion, AnimatePresence } from 'framer-motion'

<AnimatePresence>
  {tasks.map(task => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      <TaskItem task={task} />
    </motion.div>
  ))}
</AnimatePresence>
```

### Form Handling

Use React Hook Form with Zod validation:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
})

const form = useForm({
  resolver: zodResolver(taskSchema),
})
```

---

## Styling Rules

1. **Use Tailwind CSS classes** - No inline styles
2. **Use `cn()` utility** for conditional classes
3. **Follow existing component patterns**
4. **Mobile-first responsive design**

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  "p-4 rounded-lg",
  isCompleted && "opacity-50 line-through"
)}>
```

---

## Authentication Flow

### Protected Routes

Use middleware for route protection:

```tsx
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  if (!token && request.nextUrl.pathname.startsWith('/tasks')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

### Auth Context

Use the auth provider:

```tsx
import { useAuth } from '@/components/providers/auth-provider'

function Component() {
  const { user, isAuthenticated, signOut } = useAuth()
  // ...
}
```

---

## Testing Strategy

| Type | Tool | Coverage Goal |
|------|------|---------------|
| Unit | Jest + RTL | Components |
| Integration | Jest | Hooks, API client |
| E2E | Playwright | Critical user flows |

**Target Coverage**: 70%

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000
```

---

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Test
npm run test

# Lint
npm run lint

# Add Shadcn component
npx shadcn-ui@latest add button
```

---

## Specifications

Always reference specs before implementing:

| Spec | Path | Content |
|------|------|---------|
| UI Components | `../specs/ui/components.md` | Component requirements |
| Pages | `../specs/ui/pages.md` | Page structure |
| Features | `../specs/features/` | Feature requirements |
| API | `../specs/api/rest-endpoints.md` | API contracts |

---

## Quality Checklist

Before considering frontend work complete:

- [ ] Server Components used by default
- [ ] Client Components only where needed
- [ ] Responsive design (320px+)
- [ ] Accessibility (keyboard nav, ARIA)
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Animations smooth (60fps)
- [ ] TypeScript strict mode passing
- [ ] Tests written and passing
- [ ] No console errors/warnings
