---
name: shadcn-ui-setup
description: Install and configure Shadcn/ui component library with Radix UI primitives, set up components, and manage the component registry. Use when adding Shadcn/ui to a Next.js project or installing specific UI components for Phase 2.
allowed-tools: Bash, Write, Read, Edit
---

# Shadcn/ui Setup and Component Management

Quick reference for installing, configuring, and using Shadcn/ui components in Next.js projects.

## What is Shadcn/ui?

Shadcn/ui is NOT a traditional component library. It's a collection of **copy-paste components** built on top of Radix UI primitives. When you add a component, the actual source code is copied into your project, giving you full control.

**Benefits**:
- Full control over component code
- No dependency bloat
- Customizable with Tailwind CSS
- Accessible by default (Radix UI)
- Type-safe with TypeScript

## Quick Start

### 1. Initialize Shadcn/ui

```bash
cd frontend

# Interactive setup (recommended)
npx shadcn-ui@latest init

# You'll be prompted for:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate (or your preference)
# - Global CSS: src/styles/globals.css
# - CSS variables: Yes
# - Tailwind config: tailwind.config.ts
# - Import alias: @/components
# - React Server Components: Yes
```

This creates:
- `components.json` - Configuration file
- `src/components/ui/` - Component directory
- `src/lib/utils.ts` - Utility functions (cn helper)
- Updates `tailwind.config.ts` and `globals.css`

### 2. Configuration File

After init, `components.json` looks like:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## Installing Components

### Core Components for Phase 2

```bash
# Essential form components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add label
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add form

# Layout components
npx shadcn-ui@latest add card
npx shadcn-ui@latest add separator

# Feedback components
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add skeleton

# Navigation
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar

# Optional utility components
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add badge
```

### Install Multiple at Once

```bash
npx shadcn-ui@latest add button input textarea label checkbox form card dialog toast
```

## Component Usage Examples

### Button Component

```typescript
import { Button } from '@/components/ui/button'

export function ButtonExample() {
  return (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button disabled>Disabled</Button>
    </div>
  )
}
```

### Card Component

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function TaskCard({ task }: { task: Task }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
        <CardDescription>
          Created {new Date(task.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{task.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Edit</Button>
        <Button variant="destructive">Delete</Button>
      </CardFooter>
    </Card>
  )
}
```

### Form with Input and Validation

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
})

type TaskFormValues = z.infer<typeof taskSchema>

export function TaskForm({ onSubmit }: { onSubmit: (data: TaskFormValues) => void }) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter task description" {...field} />
              </FormControl>
              <FormDescription>
                Optional description for your task
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create Task</Button>
      </form>
    </Form>
  )
}
```

### Dialog (Modal) Component

```typescript
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TaskForm } from './task-form'

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (data: TaskFormValues) => {
    // Create task
    await createTask(data)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your todo list
          </DialogDescription>
        </DialogHeader>
        <TaskForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}
```

### Toast Notifications

First, set up the Toaster in your root layout:

```typescript
// app/layout.tsx
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

Then use the toast hook:

```typescript
'use client'

import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

export function TaskActions() {
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      await deleteTask(taskId)
      toast({
        title: 'Task deleted',
        description: 'Your task has been successfully deleted',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
      })
    }
  }

  return <Button variant="destructive" onClick={handleDelete}>Delete</Button>
}
```

### Checkbox Component

```typescript
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export function TaskItem({ task }: { task: Task }) {
  const [isCompleted, setIsCompleted] = useState(task.completed)

  const handleToggle = async (checked: boolean) => {
    setIsCompleted(checked)
    await toggleTask(task.id)
  }

  return (
    <div className="flex items-center space-x-3">
      <Checkbox
        id={`task-${task.id}`}
        checked={isCompleted}
        onCheckedChange={handleToggle}
      />
      <Label
        htmlFor={`task-${task.id}`}
        className={isCompleted ? 'line-through text-muted-foreground' : ''}
      >
        {task.title}
      </Label>
    </div>
  )
}
```

## Customizing Components

### Modifying Existing Components

All component source code is in `src/components/ui/`. You can edit directly:

```typescript
// src/components/ui/button.tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        // Add custom variant
        custom: 'bg-purple-500 text-white hover:bg-purple-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        // Add custom size
        xl: 'h-14 rounded-md px-10 text-lg',
      },
    },
  }
)
```

### Creating Custom Theme Colors

Update `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        // Custom color palette
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... more shades
          900: '#0c4a6e',
        },
      },
    },
  },
}
```

Update `globals.css`:

```css
@layer base {
  :root {
    --brand: 217 91% 60%;
    --brand-foreground: 0 0% 100%;
  }
}
```

## Advanced Patterns

### Composing Components

```typescript
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { motion } from 'framer-motion'

export function AnimatedTaskCard({ task }: { task: Task }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox checked={task.completed} />
            <span>{task.title}</span>
          </div>
          <Button variant="ghost" size="sm">Edit</Button>
        </div>
      </Card>
    </motion.div>
  )
}
```

### Server Component Integration

```typescript
// app/tasks/page.tsx (Server Component)
import { getTasks } from '@/lib/api'
import { TaskList } from '@/components/tasks/task-list'

export default async function TasksPage() {
  const tasks = await getTasks()

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>
      <TaskList initialTasks={tasks} />
    </div>
  )
}
```

## Component Reference for Phase 2

| Component | Use Case | Priority |
|-----------|----------|----------|
| Button | All actions (submit, cancel, delete) | High |
| Input | Text fields (title, email, password) | High |
| Textarea | Multiline text (description) | High |
| Checkbox | Task completion toggle | High |
| Label | Form field labels | High |
| Form | Integrated form handling | High |
| Card | Task display container | High |
| Dialog | Modals (create/edit task) | High |
| Toast | Success/error notifications | High |
| Avatar | User profile display | Medium |
| Dropdown Menu | User menu, task actions | Medium |
| Separator | Visual dividers | Low |
| Skeleton | Loading states | Low |

## Troubleshooting

**Component not found after installation**:
```bash
# Reinstall component
npx shadcn-ui@latest add button --overwrite
```

**Style conflicts**:
- Check `globals.css` imports order
- Verify Tailwind CSS variables are defined
- Clear `.next` cache and restart

**TypeScript errors**:
- Ensure `@/components` alias is configured in `tsconfig.json`
- Run `npm install` to install new peer dependencies

## Best Practices

1. **Don't modify core variants** - Create new variants instead
2. **Use the cn() utility** - For conditional classes
3. **Keep components accessible** - Shadcn/ui is accessible by default, maintain it
4. **Test on multiple screen sizes** - Components are responsive
5. **Follow naming conventions** - Use component names as-is

## References

- Shadcn/ui: https://ui.shadcn.com/
- Radix UI: https://www.radix-ui.com/
- Tailwind CSS: https://tailwindcss.com/docs
- CVA (Class Variance Authority): https://cva.style/docs
