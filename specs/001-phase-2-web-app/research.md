# Phase 0: Research - Todo Web Application

**Feature**: Todo Web Application - Phase 2
**Date**: 2025-12-11
**Status**: Complete

This document consolidates research findings for all technical unknowns identified in the Technical Context section. All research was conducted using Context7 MCP to fetch the latest documentation for chosen technologies.

---

## Technology Stack Research

### 1. Next.js 16+ (App Router, Server Components)

**Decision**: Use Next.js 16+ with App Router for frontend framework

**Rationale**:
- Latest stable release with improved performance and developer experience
- App Router provides modern file-based routing with layouts and nested routes
- Server Components reduce JavaScript bundle size and improve FCP
- Built-in support for TypeScript, CSS, and API routes
- Excellent Vercel deployment integration

**Key Findings from Context7** (/vercel/next.js):
- **Server Components**: Async components fetch data directly without client-side hydration
  ```tsx
  export default async function Page() {
    const data = await fetch('https://api.example.com/data')
    return <div>{data}</div>
  }
  ```
- **Authentication Pattern**: Use `headers()` from 'next/headers' to access auth tokens
  ```tsx
  import { headers } from 'next/headers'
  const authHeader = (await headers()).get('authorization')
  ```
- **Data Fetching Strategies**:
  - Static: `fetch(url, { cache: 'force-cache' })` (default)
  - Dynamic: `fetch(url, { cache: 'no-store' })` for SSR-like behavior
  - Revalidate: `fetch(url, { next: { revalidate: 10 } })` for ISR
- **Client Components**: Use `'use client'` directive for interactivity
- **Routing Hooks**: `useRouter`, `usePathname`, `useSearchParams` from 'next/navigation'

**Alternatives Considered**:
- Remix: Less mature ecosystem, steeper learning curve
- Create React App: Deprecated, no SSR
- Vite + React: Requires manual setup for routing, SSR

---

### 2. FastAPI 0.115+ (Backend Framework)

**Decision**: Use FastAPI 0.115+ for backend API

**Rationale**:
- High performance (async/await support)
- Automatic OpenAPI/Swagger documentation
- Built-in request validation with Pydantic
- Excellent dependency injection system
- Type hints for better IDE support

**Key Findings from Context7** (/fastapi/fastapi):
- **Dependency Injection for Auth**:
  ```python
  async def get_current_user(token: str = Depends(oauth2_scheme)):
      user = decode_token(token)
      if not user:
          raise HTTPException(status_code=401, detail="Invalid credentials",
                             headers={"WWW-Authenticate": "Bearer"})
      return user

  @app.get("/users/me")
  async def read_users_me(current_user: User = Depends(get_current_user)):
      return current_user
  ```
- **Nested Dependencies**: Chain dependencies for multi-level validation
  ```python
  async def get_current_active_user(current_user: User = Depends(get_current_user)):
      if current_user.disabled:
          raise HTTPException(status_code=400, detail="Inactive user")
      return current_user
  ```
- **Middleware Pattern**:
  ```python
  @app.middleware("http")
  async def add_process_time_header(request, call_next):
      response = await call_next(request)
      response.headers["X-Process-Time"] = "0.001"
      return response
  ```
- **JWT Implementation**: Use PyJWT library (`pip install pyjwt`)
- **Security**: OAuth2PasswordBearer for token authentication
- **Database Integration**: Works seamlessly with SQLModel/SQLAlchemy

**Alternatives Considered**:
- Django REST Framework: Heavier, slower startup, more opinionated
- Flask: No built-in async, manual validation setup
- Starlette: Lower-level, more boilerplate

---

### 3. SQLModel 0.0.24+ (ORM)

**Decision**: Use SQLModel for database ORM

**Rationale**:
- Combines SQLAlchemy (ORM) + Pydantic (validation)
- Type-safe database operations
- Perfect integration with FastAPI
- Automatic schema generation
- Relationship management

**Key Findings from Context7** (/websites/sqlmodel_tiangolo):
- **Model Definition with Foreign Keys**:
  ```python
  class Team(SQLModel, table=True):
      id: int | None = Field(default=None, primary_key=True)
      name: str = Field(index=True)
      headquarters: str
      heroes: list["Hero"] = Relationship(back_populates="team")

  class Hero(SQLModel, table=True):
      id: int | None = Field(default=None, primary_key=True)
      name: str = Field(index=True)
      team_id: int | None = Field(default=None, foreign_key="team.id")
      team: Team | None = Relationship(back_populates="heroes")
  ```
- **Relationships**: Use `Relationship()` for bidirectional links
- **Indexes**: Use `Field(index=True)` for performance
- **Many-to-Many**: Create link table with composite primary keys
  ```python
  class HeroTeamLink(SQLModel, table=True):
      team_id: int | None = Field(default=None, foreign_key="team.id", primary_key=True)
      hero_id: int | None = Field(default=None, foreign_key="hero.id", primary_key=True)
      is_training: bool = False
  ```
- **Database Session Management**: Use dependency injection
  ```python
  def get_session():
      with Session(engine) as session:
          yield session

  @app.get("/heroes/")
  def read_heroes(session: Session = Depends(get_session)):
      heroes = session.exec(select(Hero)).all()
      return heroes
  ```

**For Our Use Case**:
```python
class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**Alternatives Considered**:
- SQLAlchemy alone: More verbose, no Pydantic integration
- Tortoise ORM: Less mature, smaller ecosystem
- Peewee: Simpler but less powerful

---

### 4. Better Auth (Authentication)

**Decision**: Use Better Auth for authentication system

**Rationale**:
- Framework-agnostic (works with Next.js + FastAPI)
- JWT token-based authentication
- Built-in session management
- TypeScript support
- Active development and good documentation

**Key Findings from Context7** (/better-auth/better-auth):
- **Next.js 15.2.0+ Middleware (Node.js Runtime)**:
  ```typescript
  import { NextRequest, NextResponse } from "next/server"
  import { headers } from "next/headers"
  import { auth } from "@/lib/auth"

  export async function middleware(request: NextRequest) {
      const session = await auth.api.getSession({
          headers: await headers()
      })
      if (!session) {
          return NextResponse.redirect(new URL("/sign-in", request.url))
      }
      return NextResponse.next()
  }

  export const config = {
      runtime: "nodejs",
      matcher: ["/dashboard"]
  }
  ```
- **Server-Side Validation in Pages**:
  ```tsx
  import { auth } from "@/lib/auth"
  import { headers } from "next/headers"
  import { redirect } from "next/navigation"

  export default async function DashboardPage() {
      const session = await auth.api.getSession({
          headers: await headers()
      })
      if (!session) {
          redirect("/sign-in")
      }
      return <h1>Welcome {session.user.name}</h1>
  }
  ```
- **API Route Handler**:
  ```typescript
  // app/api/auth/[...all]/route.ts
  import { auth } from "@/lib/auth"
  import { toNextJsHandler } from "better-auth/next-js"

  export const { GET, POST } = toNextJsHandler(auth)
  ```
- **JWT Plugin for External APIs**:
  ```ts
  import { jwtClient } from "better-auth/client/plugins"

  export const authClient = createAuthClient({
      plugins: [jwtClient()]
  })
  ```

**Integration Strategy**:
1. Frontend: Better Auth client for UI authentication
2. Backend: JWT validation middleware for API protection
3. Token flow: Better Auth issues JWT → Frontend stores → Backend validates

**Alternatives Considered**:
- NextAuth.js: Tightly coupled to Next.js, harder to integrate with FastAPI
- Auth0: Third-party service, costs for production
- Custom JWT: More work, security risks

---

### 5. Shadcn/ui + Aceternity UI (UI Components)

**Decision**: Use Shadcn/ui as base component library + Aceternity UI for effects

**Rationale**:
- Copy-paste components (not NPM dependency) for full control
- Built on Radix UI (accessible primitives)
- Tailwind CSS integration
- TypeScript support
- Aceternity UI adds stunning visual effects for landing page

**Key Findings from Context7** (/websites/ui_shadcn):
- **Installation via CLI**:
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button card input checkbox dialog
  ```
- **Component Structure**: Components added to `src/components/ui/`
- **Customization**: Full control via Tailwind classes
- **Accessibility**: Built on Radix UI for WCAG compliance
- **Theme System**: Uses CSS variables for easy theming

**Component Usage Example**:
```tsx
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function TaskCard() {
    return (
        <Card>
            <Button>Add Task</Button>
        </Card>
    )
}
```

**Alternatives Considered**:
- Material-UI: Heavier bundle, opinionated design
- Chakra UI: NPM dependency, less customization
- Headless UI: Lower-level, more setup required

---

### 6. Zustand 5.0+ (State Management)

**Decision**: Use Zustand for global state management (MANDATORY - NO React Context)

**Rationale**:
- Minimal boilerplate
- No Provider wrappers needed
- Built-in persistence middleware
- TypeScript support
- Small bundle size (< 1KB)
- Perfect for optimistic UI updates

**Key Findings from Context7** (/pmndrs/zustand):
- **Store Definition with Persist**:
  ```typescript
  import { create } from 'zustand'
  import { persist, createJSONStorage } from 'zustand/middleware'

  type AuthStore = {
      token: string | null
      user: User | null
      setAuth: (token: string, user: User) => void
      logout: () => void
  }

  export const useAuthStore = create<AuthStore>()(
      persist(
          (set) => ({
              token: null,
              user: null,
              setAuth: (token, user) => set({ token, user }),
              logout: () => set({ token: null, user: null })
          }),
          {
              name: 'auth-storage',
              storage: createJSONStorage(() => localStorage)
          }
      )
  )
  ```
- **Optimistic Updates Pattern**:
  ```typescript
  type TaskStore = {
      tasks: Task[]
      addTask: (task: Task) => void
      optimisticAdd: (task: Task) => void
  }

  export const useTaskStore = create<TaskStore>((set) => ({
      tasks: [],
      addTask: async (task) => {
          // Optimistic update
          set((state) => ({ tasks: [...state.tasks, task] }))
          try {
              await api.createTask(task)
          } catch (error) {
              // Rollback on failure
              set((state) => ({
                  tasks: state.tasks.filter(t => t.id !== task.id)
              }))
          }
      }
  }))
  ```
- **Persist Middleware Options**:
  - `name`: Storage key (unique per store)
  - `storage`: localStorage (default), sessionStorage, or custom
  - `version`: For schema migrations
  - `migrate`: Handle version upgrades
- **Hydration Check**:
  ```typescript
  const hasHydrated = useTaskStore((state) => state._hasHydrated)
  if (!hasHydrated) return <Loading />
  ```

**For Our Use Case**:
1. `auth-store.ts`: JWT token, user data, login/logout
2. `task-store.ts`: Tasks array, CRUD operations, optimistic updates
3. `ui-store.ts`: Modals, sidebar, theme

**Alternatives Considered**:
- React Context: Performance issues with frequent updates
- Redux: Too much boilerplate
- Jotai: Atom-based, different mental model

---

### 7. Axios 1.7+ (HTTP Client)

**Decision**: Use Axios for all HTTP requests (MANDATORY - NO fetch API)

**Rationale**:
- Interceptors for global request/response handling
- Automatic JSON transformation
- Request/response interceptors for auth
- Better error handling
- Request cancellation
- Timeout configuration

**Implementation Pattern**:
```typescript
// lib/api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'

export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor (add JWT token)
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor (handle 401)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)
```

**API Module Pattern**:
```typescript
// lib/api/tasks.ts
import { apiClient } from './client'

export const tasksApi = {
    getAll: () => apiClient.get('/api/tasks'),
    create: (task: TaskCreate) => apiClient.post('/api/tasks', task),
    update: (id: number, task: TaskUpdate) => apiClient.put(`/api/tasks/${id}`, task),
    delete: (id: number) => apiClient.delete(`/api/tasks/${id}`)
}
```

**Alternatives Considered**:
- fetch API: No interceptors, manual error handling
- ky: Smaller but less features
- superagent: Older, less active

---

## Best Practices from Research

### Authentication Flow
1. User signs up/logs in via Better Auth
2. Better Auth issues JWT token
3. Frontend stores token in Zustand with persist
4. Frontend includes token in Axios interceptor
5. Backend validates JWT in middleware
6. Token auto-refresh when < 1 day remains

### Database Patterns
1. Use SQLModel Field with indexes for performance
2. Foreign keys with `on_delete=CASCADE` where appropriate
3. Timestamps (created_at, updated_at) on all tables
4. Use Alembic for schema migrations
5. Connection pooling for concurrent requests

### Frontend Patterns
1. Server Components for initial data fetching
2. Client Components for interactivity
3. Zustand for global state (auth, tasks, UI)
4. Optimistic UI updates for better UX
5. Error boundaries for graceful errors

### API Patterns
1. Dependency injection for authentication
2. Pydantic models for validation
3. Consistent error format (RFC 7807)
4. Proper HTTP status codes
5. OpenAPI auto-documentation

---

## Risk Mitigation Strategies

| Risk | Mitigation |
|------|------------|
| Better Auth integration complexity | Follow official Next.js + FastAPI integration docs closely, allocate extra time |
| JWT token management | Use proven libraries (PyJWT), implement refresh strategy early |
| Zustand hydration issues | Implement hydration check before rendering |
| Axios interceptor race conditions | Test logout flow thoroughly, handle 401 globally |
| SQLModel relationship bugs | Start simple, test relationships early |
| Next.js SSR/CSR confusion | Clear boundaries: Server Components for data, Client for interactions |

---

## Open Questions Resolved

- ✅ How does Better Auth integrate with FastAPI? → JWT tokens validated in middleware
- ✅ How to handle token refresh? → Silent refresh when < 1 day remains
- ✅ Where to store auth state? → Zustand with persist middleware
- ✅ How to handle optimistic updates? → Zustand pattern with rollback
- ✅ How to setup Axios interceptors? → Global client with request/response interceptors
- ✅ How to define SQLModel relationships? → Foreign keys + Relationship()

---

## Next Steps

1. Proceed to Phase 1: Design & Contracts
   - Create data-model.md with complete database schema
   - Generate OpenAPI contracts for all endpoints
   - Write quickstart.md for local development setup

2. Update agent context with these findings

3. Begin implementation with database setup

---

**Status**: Research complete ✅
**Last Updated**: 2025-12-11
**Reviewed By**: Claude Code (Context7 MCP)
