# Docker Setup Skill - Examples

## Example 1: Basic Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim AS base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install dependencies
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# Copy application
COPY src ./src

# Production stage
FROM base AS production
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Example 2: Multi-stage Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AUTH_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

## Example 3: MCP Server Dockerfile

```dockerfile
# mcp-server/Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install dependencies
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# Copy MCP server code
COPY src/mcp_server ./src/mcp_server

# MCP server port
EXPOSE 8001

CMD ["uv", "run", "python", "-m", "src.mcp_server.server"]
```

## Example 4: Docker Compose - Development

```yaml
# docker-compose.yml
version: '3.9'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: deps
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_AUTH_URL=http://localhost:8000/auth
    command: npm run dev
    depends_on:
      - backend
    networks:
      - todo-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: base
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    command: uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
    depends_on:
      - mcp-server
    networks:
      - todo-network

  mcp-server:
    build:
      context: ./backend
      dockerfile: Dockerfile.mcp
    volumes:
      - ./backend:/app
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    command: uv run python -m src.mcp_server.server
    networks:
      - todo-network

  ai-agent:
    build:
      context: ./backend
      dockerfile: Dockerfile.agent
    volumes:
      - ./backend:/app
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - MCP_SERVER_URL=http://mcp-server:8001
    depends_on:
      - mcp-server
    networks:
      - todo-network

networks:
  todo-network:
    driver: bridge
```

## Example 5: Docker Compose - Production

```yaml
# docker-compose.prod.yml
version: '3.9'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: runner
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
        NEXT_PUBLIC_AUTH_URL: ${NEXT_PUBLIC_AUTH_URL}
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - todo-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - MCP_SERVER_URL=http://mcp-server:8001
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      mcp-server:
        condition: service_healthy
    networks:
      - todo-network

  mcp-server:
    build:
      context: ./backend
      dockerfile: Dockerfile.mcp
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - todo-network

  ai-agent:
    build:
      context: ./backend
      dockerfile: Dockerfile.agent
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - MCP_SERVER_URL=http://mcp-server:8001
    restart: unless-stopped
    depends_on:
      mcp-server:
        condition: service_healthy
    networks:
      - todo-network

networks:
  todo-network:
    driver: bridge

volumes:
  backend-cache:
  frontend-cache:
```

## Example 6: .dockerignore Files

```text
# backend/.dockerignore
.git
.gitignore
.env*
!.env.example
*.pyc
__pycache__
.pytest_cache
.mypy_cache
.ruff_cache
*.egg-info
dist
build
.venv
venv
*.md
!README.md
tests
.coverage
htmlcov
alembic/versions/*.pyc
```

```text
# frontend/.dockerignore
.git
.gitignore
.env*
!.env.example
node_modules
.next
*.md
!README.md
*.log
.DS_Store
coverage
.turbo
```

## Example 7: Health Check Endpoints

```python
# backend/src/routers/health.py
from fastapi import APIRouter, Response
from datetime import datetime

router = APIRouter(prefix="/health", tags=["health"])

@router.get("")
async def health_check():
    """Basic health check for container orchestration."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "backend-api"
    }

@router.get("/ready")
async def readiness_check():
    """Readiness probe - checks all dependencies."""
    # Check database connection
    try:
        from src.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ready" if db_status == "connected" else "not_ready",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/live")
async def liveness_check():
    """Liveness probe - basic service alive check."""
    return {"status": "alive"}
```

## Example 8: Build and Push Script

```bash
#!/bin/bash
# scripts/docker-build.sh

set -e

# Configuration
REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
PROJECT="${PROJECT_NAME:-evolution-todo}"
VERSION="${VERSION:-latest}"

# Build images
echo "Building frontend image..."
docker build -t "${REGISTRY}/${PROJECT}/frontend:${VERSION}" \
    --target runner \
    --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
    --build-arg NEXT_PUBLIC_AUTH_URL="${NEXT_PUBLIC_AUTH_URL}" \
    ./frontend

echo "Building backend image..."
docker build -t "${REGISTRY}/${PROJECT}/backend:${VERSION}" \
    --target production \
    ./backend

echo "Building MCP server image..."
docker build -t "${REGISTRY}/${PROJECT}/mcp-server:${VERSION}" \
    -f ./backend/Dockerfile.mcp \
    ./backend

echo "Building AI agent image..."
docker build -t "${REGISTRY}/${PROJECT}/ai-agent:${VERSION}" \
    -f ./backend/Dockerfile.agent \
    ./backend

echo "All images built successfully!"

# Push images (optional)
if [ "$PUSH_IMAGES" = "true" ]; then
    echo "Pushing images to registry..."
    docker push "${REGISTRY}/${PROJECT}/frontend:${VERSION}"
    docker push "${REGISTRY}/${PROJECT}/backend:${VERSION}"
    docker push "${REGISTRY}/${PROJECT}/mcp-server:${VERSION}"
    docker push "${REGISTRY}/${PROJECT}/ai-agent:${VERSION}"
    echo "All images pushed successfully!"
fi
```
