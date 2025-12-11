# UI Pages Specification

**Framework**: Next.js 16+ with App Router  
**State**: Zustand (MANDATORY)  
**HTTP**: Axios (MANDATORY)  
**Effects**: Aceternity UI (for landing page)  
**Phase**: Phase 2  
**Date**: December 2024

---

## Overview

This document specifies all pages and their layouts for the Todo Web Application.

---

## Route Structure (6 Pages Total)

```
app/\n├── layout.tsx               # Root layout with providers\n├── page.tsx                 # / (landing page with Aceternity effects)\n├── not-found.tsx            # 404 page\n├── error.tsx                # Error boundary\n├── loading.tsx              # Global loading state\n├── (auth)/\n│   ├── layout.tsx           # Auth pages layout (centered card)\n│   ├── login/\n│   │   └── page.tsx         # /login\n│   └── signup/\n│       └── page.tsx         # /signup\n└── (dashboard)/\n    ├── layout.tsx           # Dashboard layout (sidebar + header)\n    ├── dashboard/\n    │   └── page.tsx         # /dashboard (main tasks view)\n    └── settings/\n        └── page.tsx         # /settings (user preferences)\n```

## Pages Summary

| Route | Page | Auth | Aceternity | Description |
|-------|------|------|------------|-------------|
| `/` | Landing | Public | ✅ Required | Hero, features, CTA |
| `/login` | Login | Public | Optional | User login form |
| `/signup` | Signup | Public | Optional | User registration |
| `/dashboard` | Dashboard | Protected | ❌ None | Main tasks view |
| `/settings` | Settings | Protected | ❌ None | User preferences |
| `/*` | 404 | Public | Optional | Not found page |

---

## Landing Page

**Route**: `/`  
**Auth Required**: No  
**File**: `app/page.tsx`  
**Aceternity UI**: REQUIRED (BackgroundBeams, TextGenerateEffect)

### Purpose

Welcome page with app introduction and call-to-action. Uses Aceternity UI for stunning visual effects.

### Aceternity UI Effects (MANDATORY)

| Effect | Component | Usage |
|--------|-----------|-------|
| BackgroundBeams | `BackgroundBeams` | Hero section background animation |
| TextGenerateEffect | `TextGenerateEffect` | Headline text animation |
| MovingBorder | `MovingBorder` | CTA button animated border |
| SparklesCore | `SparklesCore` | Features section sparkle effect |

### Layout

```
┌────────────────────────────────────────────────────────┐
│  Header (Logo, Login/Signup buttons)                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│     ╔════════════════════════════════════════════╗     │
│     ║         BackgroundBeams Effect             ║     │
│     ║                                            ║     │
│     ║        Hero Section                        ║     │
│     ║  <TextGenerateEffect>                      ║     │
│     ║   "Organize your life, one task at a time" ║     │
│     ║  </TextGenerateEffect>                     ║     │
│     ║                                            ║     │
│     ║   <MovingBorder>                           ║     │
│     ║     [Get Started]                          ║     │
│     ║   </MovingBorder>  [Learn More]            ║     │
│     ║                                            ║     │
│     ╚════════════════════════════════════════════╝     │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│              Features Section                          │
│     ┌──────┐  ┌──────┐  ┌──────┐                      │
│     │ Icon │  │ Icon │  │ Icon │                      │
│     │Simple│  │Secure│  │ Fast │                      │
│     └──────┘  └──────┘  └──────┘                      │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│              CTA Section                               │
│     "Start organizing today - it's free!"             │
│             [Create Account]                           │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Footer (Links, Copyright)                             │
└────────────────────────────────────────────────────────┘
```

### Components

- `LandingHeader` - Navigation with auth buttons
- `HeroSection` - Main headline with Aceternity effects
- `FeaturesSection` - Feature highlights
- `CTASection` - Final call to action
- `Footer` - Site footer

### Behavior

- If user is authenticated, redirect to `/dashboard`
- Smooth scroll for "Learn More" button
- Animated entrance with Framer Motion
- Background effects with Aceternity UI

---

## Login Page

**Route**: `/auth/login`  
**Auth Required**: No (redirect if authenticated)  
**File**: `app/(auth)/auth/login/page.tsx`

### Purpose

User authentication via email/password.

### Layout

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                    Logo                                │
│                                                        │
│         ┌──────────────────────────────┐              │
│         │                              │              │
│         │   Welcome back               │              │
│         │   Enter your credentials     │              │
│         │                              │              │
│         │   Email: [____________]      │              │
│         │                              │              │
│         │   Password: [__________]     │              │
│         │                              │              │
│         │   [ ] Remember me            │              │
│         │                              │              │
│         │   [      Sign In      ]      │              │
│         │                              │              │
│         │   Don't have an account?     │              │
│         │   Sign up                    │              │
│         │                              │              │
│         └──────────────────────────────┘              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Components

- `LoginForm` - Form with validation
- `Logo` - App branding
- `AuthCard` - Centered card wrapper

### Behavior

- Form validation on submit
- Error display for invalid credentials
- Loading state during submission
- Redirect to `/dashboard` on success
- Redirect authenticated users to `/dashboard`

### Validation

| Field | Rules |
|-------|-------|
| Email | Required, valid email format |
| Password | Required, min 8 characters |

---

## Signup Page

**Route**: `/auth/signup`  
**Auth Required**: No (redirect if authenticated)  
**File**: `app/(auth)/auth/signup/page.tsx`

### Purpose

New user registration.

### Layout

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                    Logo                                │
│                                                        │
│         ┌──────────────────────────────┐              │
│         │                              │              │
│         │   Create an account          │              │
│         │   Start organizing today     │              │
│         │                              │              │
│         │   Name: [______________]     │              │
│         │                              │              │
│         │   Email: [____________]      │              │
│         │                              │              │
│         │   Password: [__________]     │              │
│         │   ▓▓▓▓▓░░░░░ Medium          │              │
│         │                              │              │
│         │   Confirm: [___________]     │              │
│         │                              │              │
│         │   [ ] I agree to terms       │              │
│         │                              │              │
│         │   [    Create Account  ]     │              │
│         │                              │              │
│         │   Already have an account?   │              │
│         │   Sign in                    │              │
│         │                              │              │
│         └──────────────────────────────┘              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Components

- `SignupForm` - Registration form
- `PasswordStrength` - Visual indicator
- `Logo` - App branding
- `AuthCard` - Centered card wrapper

### Behavior

- Real-time password strength indicator
- Confirm password matching
- Terms acceptance required
- Redirect to `/dashboard` on success

### Validation

| Field | Rules |
|-------|-------|
| Name | Required, 2-100 characters |
| Email | Required, valid email, unique |
| Password | Required, min 8 chars, 1 uppercase, 1 number, 1 special |
| Confirm | Required, must match password |
| Terms | Required, must be checked |

---

## Dashboard Page

**Route**: `/dashboard`  
**Auth Required**: Yes  
**File**: `app/(dashboard)/dashboard/page.tsx`

### Purpose

Main task management interface.

### Layout

```
┌────────────────────────────────────────────────────────┐
│  Header (Logo, User Menu)                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│   My Tasks                              [+ Add Task]   │
│                                                        │
│   ┌─────────────────────────────────────────────┐     │
│   │ Filter: [All ▼]    Sort: [Newest ▼]         │     │
│   └─────────────────────────────────────────────┘     │
│                                                        │
│   ┌─────────────────────────────────────────────┐     │
│   │ [○] Buy groceries                      [⋮]  │     │
│   │     Milk, eggs, bread                       │     │
│   └─────────────────────────────────────────────┘     │
│                                                        │
│   ┌─────────────────────────────────────────────┐     │
│   │ [✓] Complete project                   [⋮]  │     │
│   │     Finish by Friday                        │     │
│   └─────────────────────────────────────────────┘     │
│                                                        │
│   ┌─────────────────────────────────────────────┐     │
│   │ [○] Call mom                           [⋮]  │     │
│   │                                             │     │
│   └─────────────────────────────────────────────┘     │
│                                                        │
│                                            [+] FAB    │
└────────────────────────────────────────────────────────┘
```

### Components

- `DashboardHeader` - With user menu
- `TaskFilters` - Filter and sort controls
- `TaskList` - Animated task cards
- `TaskCard` - Individual task display
- `AddTaskButton` - Create new task
- `TaskForm` (modal) - Create/edit form
- `ConfirmDialog` - Delete confirmation
- `EmptyState` - When no tasks

### States

| State | Display |
|-------|---------|
| Loading | Skeleton cards |
| Empty | Empty state with CTA |
| Tasks | Task list |
| Error | Error message with retry |

### Actions

| Action | Component | Result |
|--------|-----------|--------|
| Add Task | AddTaskButton | Opens TaskForm modal |
| Toggle Complete | Checkbox | Optimistic update |
| Edit Task | Menu → Edit | Opens TaskForm with data |
| Delete Task | Menu → Delete | Opens ConfirmDialog |

### Data Flow

```typescript
// Page component
export default function DashboardPage() {
  const { user } = useAuth();
  const { tasks, isLoading, error } = useTasks(user.id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // ... handlers
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <AddTaskButton onClick={() => setIsFormOpen(true)} />
      </div>
      
      <TaskFilters />
      
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        onToggleComplete={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      <TaskFormDialog
        open={isFormOpen || !!editingTask}
        task={editingTask}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    </div>
  );
}
```

---

## Not Found Page

**Route**: `/[...not-found]`  
**File**: `app/not-found.tsx`

### Layout

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                    404                                 │
│                                                        │
│              Page not found                            │
│                                                        │
│   The page you're looking for doesn't exist           │
│                                                        │
│              [Go to Home]                              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Error Page

**Route**: Error boundary  
**File**: `app/error.tsx`

### Layout

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│              Something went wrong                      │
│                                                        │
│   We encountered an unexpected error.                  │
│                                                        │
│         [Try Again]   [Go to Home]                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Props

```typescript
interface ErrorPageProps {
  error: Error;
  reset: () => void;
}
```

---

## Layout Components

### Root Layout

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Auth Layout

```typescript
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

### Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <main className="container py-8">
        {children}
      </main>
    </div>
  );
}
```

---

## Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/auth/login', '/auth/signup'];
const authPaths = ['/auth/login', '/auth/signup'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from auth pages
  if (authPaths.some(path => pathname.startsWith(path)) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!publicPaths.some(path => pathname === path || pathname.startsWith(path)) && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## SEO & Metadata

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | Todo App',
    default: 'Todo App - Organize Your Life',
  },
  description: 'Simple and elegant task management application',
  keywords: ['todo', 'tasks', 'productivity', 'organization'],
};

// app/dashboard/page.tsx
export const metadata: Metadata = {
  title: 'Dashboard',
};
```
