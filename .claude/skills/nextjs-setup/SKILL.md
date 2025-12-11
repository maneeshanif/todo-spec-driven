---
name: nextjs-setup
description: Initialize Next.js 16+ frontend projects with TypeScript, Tailwind CSS, App Router, and modern tooling. Use when setting up a new Next.js frontend or initializing the frontend directory for Phase 2.
allowed-tools: Bash, Write, Read, Glob
---

# Next.js Project Setup

Quick reference for initializing Next.js 16+ projects with TypeScript, Tailwind CSS 4.0, and App Router.

## Quick Start

### 1. Create Next.js Project

```bash
# Using create-next-app (recommended)
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm

# Or with specific options interactively
npx create-next-app@latest frontend
```

Options explained:
- `--typescript`: Enable TypeScript
- `--tailwind`: Include Tailwind CSS
- `--app`: Use App Router (not Pages Router)
- `--src-dir`: Use `src/` directory
- `--import-alias "@/*"`: Use @ for imports from src/

### 2. Install Core Dependencies

```bash
cd frontend

# Animation library
npm install framer-motion

# Form handling
npm install react-hook-form zod @hookform/resolvers/zod

# HTTP client (if not using fetch)
npm install axios

# Better Auth (for authentication)
npm install better-auth

# Date handling (if needed for Phase 5)
npm install date-fns
```

### 3. Install Dev Dependencies

```bash
# Testing
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom

# Playwright for E2E tests
npm install --save-dev @playwright/test

# Type checking
npm install --save-dev @types/node @types/react @types/react-dom
```

### 4. Project Structure Setup

```bash
cd frontend

# Create directory structure
mkdir -p src/components/ui
mkdir -p src/components/auth
mkdir -p src/components/tasks
mkdir -p src/components/layout
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/styles
mkdir -p tests/unit
mkdir -p tests/e2e
mkdir -p public/images
```

### 5. Configure Tailwind CSS

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

### 6. Set Up Global Styles

Update `src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 7. Create Utility Functions

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install required packages:
```bash
npm install clsx tailwind-merge tailwindcss-animate
```

### 8. Create TypeScript Types

Create `src/lib/types.ts`:

```typescript
export interface Task {
  id: number
  user_id: string
  title: string
  description?: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
```

### 9. Create API Client

Create `src/lib/api.ts`:

```typescript
import { Task, ApiResponse } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getAuthHeaders(): Promise<HeadersInit> {
  // TODO: Get JWT token from Better Auth session
  const token = '' // Get from Better Auth

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function getTasks(userId: string): Promise<Task[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_URL}/api/${userId}/tasks`, {
    headers,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }

  const data: ApiResponse<Task[]> = await response.json()
  return data.data || []
}

export async function createTask(
  userId: string,
  task: { title: string; description?: string }
): Promise<Task> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_URL}/api/${userId}/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify(task),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to create task')
  }

  const data: ApiResponse<Task> = await response.json()
  return data.data!
}

export async function toggleTask(userId: string, taskId: number): Promise<Task> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}/complete`, {
    method: 'PATCH',
    headers,
  })

  if (!response.ok) {
    throw new Error('Failed to toggle task')
  }

  const data: ApiResponse<Task> = await response.json()
  return data.data!
}

export async function deleteTask(userId: string, taskId: number): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    throw new Error('Failed to delete task')
  }
}
```

### 10. Environment Variables

Create `.env.local`:

```bash
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Environment
NODE_ENV=development
```

Create `.env.local.example`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-secret-key-here-min-32-characters
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NODE_ENV=development
```

### 11. Update Next.js Config

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

module.exports = nextConfig
```

### 12. Create Root Layout

Update `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Todo App - Phase 2',
  description: 'Modern todo application built with Next.js and FastAPI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### 13. Create Home Page

Update `src/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Todo App - Phase 2</h1>
        <p className="text-xl text-muted-foreground">
          Welcome to your modern todo application
        </p>
      </div>
    </main>
  )
}
```

### 14. Set Up Testing

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom'
```

### 15. Update package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit"
  }
}
```

## Verification Checklist

After setup, verify:
- [ ] `npm run dev` starts successfully
- [ ] http://localhost:3000 loads without errors
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Tailwind CSS classes work
- [ ] No console errors in browser
- [ ] `.env.local` file exists and configured
- [ ] All directories created
- [ ] `npm run lint` passes

## Next Steps

After basic setup:
1. Install and configure Shadcn/ui components
2. Set up Better Auth authentication
3. Create layout components (Header, Nav, Footer)
4. Create page routes (login, signup, dashboard)
5. Implement task components
6. Add Framer Motion animations
7. Write component tests

## Troubleshooting

**Port 3000 already in use**:
```bash
# Use different port
npm run dev -- -p 3001
```

**TypeScript errors**:
```bash
# Clear .next cache
rm -rf .next
npm run dev
```

**Tailwind CSS not working**:
- Check `tailwind.config.ts` content paths
- Verify `globals.css` imports are correct
- Restart dev server

## References

- Next.js: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs
- React: https://react.dev/
