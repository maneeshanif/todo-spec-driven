# Todo Web Application - Spec-Driven Development

A modern, full-stack todo application built using **Spec-Driven Development** with Claude Code and Spec-Kit Plus.

## Phase 2: Full-Stack Web Application

Transform the console todo app into a production-ready web application with persistent storage and multi-user support.

### Tech Stack

**Frontend:**
- Next.js 16+ (App Router)
- TypeScript
- Tailwind CSS 4.0
- Shadcn/ui Components
- Framer Motion Animations

**Backend:**
- Python FastAPI
- SQLModel ORM
- Neon PostgreSQL (Serverless)
- Better Auth (JWT)

### Project Structure

```
├── frontend/           # Next.js application
├── backend/            # FastAPI application
├── specs/              # Feature specifications
│   ├── features/       # User stories & acceptance criteria
│   ├── api/            # REST API documentation
│   ├── database/       # Schema specifications
│   └── ui/             # Component & page specs
├── .claude/            # Claude Code configuration
│   ├── agents/         # Specialized development agents
│   └── skills/         # Setup & configuration skills
└── history/            # PHRs and ADRs
```

### Getting Started

Documentation and setup instructions coming soon as implementation begins.

### Development Methodology

This project follows **Spec-Driven Development**:
1. Write specifications before code
2. Use Claude Code to generate implementation
3. Refine specs until output is correct
4. Document all decisions

### License

MIT
