                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    # Frontend Agent Rules

**Service**: Next.js Frontend
**Parent**: See root [CLAUDE.md](../CLAUDE.md)

## Frontend-Specific Guidelines

### State Management
- **MANDATORY**: Use Zustand for all state management
- **FORBIDDEN**: React Context API for state management
- Store files: `src/stores/*.ts`
- Persist auth state using Zustand persist middleware

### HTTP Requests
- **MANDATORY**: Use Axios for all HTTP requests
- **FORBIDDEN**: Native fetch API
- Configure interceptors for auth tokens
- Handle errors with Axios interceptors

### UI Components
- Use Shadcn/ui for base components
- Add Aceternity UI for special effects (BackgroundBeams, TextGenerateEffect, etc.)
- Use Framer Motion for animations
- Follow Tailwind CSS conventions

### Forms
- Use React Hook Form for form handling
- Validate with Zod schemas
- Display errors inline

### Routing
- Use Next.js 16+ App Router
- Protected routes via middleware or HOC
- Dynamic imports for code splitting

### Performance
- Server Components by default
- Client Components only when needed (useState, useEffect, etc.)
- Optimize images with next/image
- Lazy load components with React.lazy()

### Testing
- Jest for unit tests
- React Testing Library for component tests
- Test user interactions, not implementation details

## See Also
- [Root CLAUDE.md](../CLAUDE.md)
- [Constitution](../prompts/constitution-prompt-phase-2.md)
