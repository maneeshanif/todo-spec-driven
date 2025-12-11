# UI Components Specification

**Framework**: Next.js 16+ with Shadcn/ui  
**Styling**: Tailwind CSS 4.0  
**Animations**: Framer Motion + Aceternity UI  
**State**: Zustand (MANDATORY)  
**HTTP**: Axios (MANDATORY)  
**Phase**: Phase 2  
**Date**: December 2024

---

## Overview

This document specifies all UI components for the Todo Web Application frontend.

---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| Shadcn/ui | Base components (Button, Card, Input, etc.) |
| Aceternity UI | Visual effects (BackgroundBeams, TextGenerateEffect, etc.) |
| Framer Motion | Animations and transitions |
| Zustand | State management (NO React Context) |
| Axios | HTTP client (NO fetch for API calls) |

---

## Component Library

### Base Components (Shadcn/ui)

| Component | Import | Usage |
|-----------|--------|-------|
| Button | `@/components/ui/button` | All buttons |
| Input | `@/components/ui/input` | Text inputs |
| Card | `@/components/ui/card` | Task cards, sections |
| Checkbox | `@/components/ui/checkbox` | Task completion |
| Dialog | `@/components/ui/dialog` | Modals, confirmations |
| Form | `@/components/ui/form` | Form handling |
| Label | `@/components/ui/label` | Input labels |
| Toast | `@/components/ui/toast` | Notifications |
| Avatar | `@/components/ui/avatar` | User avatar |
| Dropdown | `@/components/ui/dropdown-menu` | Menu options |

### Aceternity UI Components

| Component | Import | Usage |
|-----------|--------|-------|
| BackgroundBeams | `@/components/aceternity/background-beams` | Hero section background |
| TextGenerateEffect | `@/components/aceternity/text-generate-effect` | Animated text reveal |
| MovingBorder | `@/components/aceternity/moving-border` | Animated button borders |
| SparklesCore | `@/components/aceternity/sparkles` | Sparkle effects |
| BackgroundGradient | `@/components/aceternity/background-gradient` | Gradient card backgrounds |

---

## Custom Components

### Auth Components

#### LoginForm

Login form with email and password.

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}
```

**Features:**
- Email/password inputs
- Form validation (react-hook-form + zod)
- Error display
- Loading state
- "Remember me" checkbox
- Link to signup

**Structure:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Welcome back</CardTitle>
    <CardDescription>Enter your credentials</CardDescription>
  </CardHeader>
  <CardContent>
    <Form>
      <FormField name="email" />
      <FormField name="password" />
      <Button type="submit">Sign In</Button>
    </Form>
    <Link href="/auth/signup">Create account</Link>
  </CardContent>
</Card>
```

#### SignupForm

Registration form with name, email, password.

**Props:**
```typescript
interface SignupFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}
```

**Features:**
- Name/email/password inputs
- Password confirmation
- Password strength indicator
- Form validation
- Terms acceptance checkbox
- Link to login

---

### Task Components

#### TaskCard

Displays a single task with actions.

**Props:**
```typescript
interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}
```

**Structure:**
```tsx
<motion.div layoutId={`task-${task.id}`}>
  <Card className={cn(task.completed && "opacity-60")}>
    <CardContent className="flex items-center gap-4 p-4">
      <Checkbox 
        checked={task.completed}
        onCheckedChange={() => onToggleComplete(task.id)}
      />
      <div className="flex-1">
        <h3 className={cn(
          "font-medium",
          task.completed && "line-through"
        )}>
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-muted-foreground">
            {task.description}
          </p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onDelete(task.id)}
            className="text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardContent>
  </Card>
</motion.div>
```

#### TaskList

Animated list of TaskCards.

**Props:**
```typescript
interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onToggleComplete: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}
```

**Features:**
- Framer Motion layout animations
- Stagger children on mount
- Empty state when no tasks
- Loading skeleton

**Structure:**
```tsx
<AnimatePresence>
  {isLoading ? (
    <TaskListSkeleton count={3} />
  ) : tasks.length === 0 ? (
    <EmptyState />
  ) : (
    <motion.div 
      className="space-y-3"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} {...handlers} />
      ))}
    </motion.div>
  )}
</AnimatePresence>
```

#### TaskForm

Form for creating/editing tasks.

**Props:**
```typescript
interface TaskFormProps {
  task?: Task; // For edit mode
  onSubmit: (data: TaskCreate | TaskUpdate) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}
```

**Features:**
- Title input (required)
- Description textarea (optional)
- Submit/cancel buttons
- Validation messages
- Auto-focus on mount

#### AddTaskButton

Floating or inline button to create new task.

**Props:**
```typescript
interface AddTaskButtonProps {
  onClick: () => void;
  variant?: "default" | "floating";
}
```

**Structure (Floating):**
```tsx
<motion.div 
  className="fixed bottom-6 right-6"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  <Button 
    size="lg" 
    className="rounded-full shadow-lg"
    onClick={onClick}
  >
    <Plus className="h-6 w-6" />
  </Button>
</motion.div>
```

---

### Layout Components

#### Header

App header with user info and navigation.

**Structure:**
```tsx
<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
  <div className="container flex h-16 items-center justify-between">
    <Logo />
    <nav className="flex items-center gap-4">
      <UserMenu />
    </nav>
  </div>
</header>
```

#### UserMenu

Dropdown with user options.

**Features:**
- User avatar
- User name/email
- Theme toggle
- Settings link
- Logout button

#### Sidebar (Optional)

Navigation sidebar for larger screens.

**Features:**
- Task filters (All, Active, Completed)
- Task counts
- Collapsible on mobile

---

### Feedback Components

#### EmptyState

Display when no tasks exist.

**Props:**
```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Structure:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <CheckCircle className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-medium">{title}</h3>
  <p className="text-muted-foreground mt-1">{description}</p>
  {action && (
    <Button onClick={action.onClick} className="mt-4">
      {action.label}
    </Button>
  )}
</div>
```

#### LoadingSkeleton

Skeleton loaders for loading states.

**Variants:**
- TaskListSkeleton
- TaskCardSkeleton
- UserMenuSkeleton

#### ConfirmDialog

Confirmation modal for destructive actions.

**Props:**
```typescript
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}
```

---

## Animation Patterns

### Framer Motion Variants

```typescript
// Container with stagger
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Fade up item
export const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  },
};

// Scale on hover
export const scaleOnHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};

// Slide in from left
export const slideInLeft = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};
```

### Common Animations

| Animation | Usage | Duration |
|-----------|-------|----------|
| Fade | Page transitions | 300ms |
| Scale | Buttons, cards on hover | 200ms |
| Slide | Sidebars, dialogs | 300ms |
| Layout | List reordering | 300ms |
| Stagger | List item entry | 100ms delay |

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |

### Mobile First

```tsx
<div className="
  p-4 
  sm:p-6 
  lg:p-8
">
  <TaskList className="
    grid 
    grid-cols-1 
    md:grid-cols-2 
    lg:grid-cols-3
    gap-4
  " />
</div>
```

---

## Theme Support

### Color Tokens

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark theme values */
}
```

### Theme Toggle

```tsx
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

---

## Accessibility

### Requirements

- [ ] All interactive elements are focusable
- [ ] Proper focus indicators visible
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Screen reader announcements for state changes
- [ ] Keyboard navigation for all actions
- [ ] ARIA labels where needed

### Patterns

```tsx
// Announce status changes
<div role="status" aria-live="polite">
  {isLoading ? "Loading tasks..." : `${tasks.length} tasks`}
</div>

// Accessible checkbox
<Checkbox
  id={`task-${task.id}`}
  checked={task.completed}
  onCheckedChange={handleToggle}
  aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
/>

// Skip to main content
<a href="#main" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```
