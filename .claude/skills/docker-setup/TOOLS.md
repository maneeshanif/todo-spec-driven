# Docker Setup Skill - Tools Reference

## Required CLI Tools

### Docker CLI

```bash
# Check Docker installation
docker --version
# Expected: Docker version 27.x or higher

# Check Docker Compose
docker compose version
# Expected: Docker Compose version v2.x

# Verify Docker daemon is running
docker info
```

### Docker Build Commands

```bash
# Basic build
docker build -t <image-name> <context-path>

# Build with specific Dockerfile
docker build -f Dockerfile.prod -t myapp:prod .

# Build with target stage
docker build --target production -t myapp:prod .

# Build with build arguments
docker build --build-arg NODE_ENV=production -t myapp:prod .

# Build with cache optimization
docker build --cache-from myapp:latest -t myapp:new .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:multi .
```

### Docker Compose Commands

```bash
# Start services (development)
docker compose up -d

# Start with build
docker compose up -d --build

# Use specific compose file
docker compose -f docker-compose.prod.yml up -d

# Scale services
docker compose up -d --scale backend=3

# View logs
docker compose logs -f <service-name>

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild specific service
docker compose build <service-name>
```

### Container Management

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# Execute command in container
docker exec -it <container-id> /bin/sh

# View container logs
docker logs -f <container-id>

# Inspect container
docker inspect <container-id>

# Copy files to/from container
docker cp <container-id>:/path/to/file ./local/path
docker cp ./local/file <container-id>:/path/to/dest
```

### Image Management

```bash
# List images
docker images

# Remove unused images
docker image prune

# Remove all unused resources
docker system prune -a

# Tag image
docker tag myapp:latest myapp:v1.0.0

# Push to registry
docker push registry.example.com/myapp:v1.0.0

# Pull from registry
docker pull registry.example.com/myapp:v1.0.0
```

## Tool Configurations

### Dockerfile Best Practices

```dockerfile
# 1. Use specific base image versions
FROM python:3.12-slim  # Good
FROM python:latest     # Avoid

# 2. Use multi-stage builds
FROM node:22-alpine AS builder
# ... build steps
FROM node:22-alpine AS runner
COPY --from=builder /app/dist ./dist

# 3. Minimize layers
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# 4. Use .dockerignore
# See examples.md for .dockerignore templates

# 5. Use non-root user
RUN adduser --system --uid 1001 appuser
USER appuser

# 6. Use COPY instead of ADD (unless extracting)
COPY src ./src

# 7. Set proper health checks
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

### Docker Compose Configuration

```yaml
# Service configuration patterns
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
      args:
        - BUILD_ENV=production

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    # Restart policy
    restart: unless-stopped

    # Logging
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

## Environment Variables

### Build-time Variables

```dockerfile
# Define in Dockerfile
ARG NODE_ENV=production
ARG API_URL

# Use in build
ENV NODE_ENV=$NODE_ENV

# Pass during build
docker build --build-arg NODE_ENV=development .
```

### Runtime Variables

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
    env_file:
      - .env
      - .env.local
```

### Required Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | backend, mcp-server | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | backend | JWT signing secret |
| `GEMINI_API_KEY` | backend, ai-agent | Google Gemini API key |
| `NEXT_PUBLIC_API_URL` | frontend | Backend API URL |
| `NEXT_PUBLIC_AUTH_URL` | frontend | Auth endpoint URL |
| `MCP_SERVER_URL` | backend, ai-agent | MCP server endpoint |

## Network Configuration

### Default Network

```yaml
networks:
  todo-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

### Service Discovery

```yaml
# Services can reference each other by name
services:
  frontend:
    environment:
      - API_URL=http://backend:8000

  backend:
    environment:
      - MCP_URL=http://mcp-server:8001
```

## Volume Management

### Named Volumes

```yaml
volumes:
  backend-data:
    driver: local

  node-modules:
    driver: local

services:
  backend:
    volumes:
      - backend-data:/app/data
```

### Bind Mounts (Development)

```yaml
services:
  backend:
    volumes:
      - ./backend:/app
      - /app/.venv  # Exclude virtual environment
```

## Debugging Tools

### Container Debugging

```bash
# Shell access
docker exec -it <container> /bin/sh

# View real-time logs
docker logs -f --tail 100 <container>

# Container resource usage
docker stats

# Inspect container details
docker inspect <container> | jq '.[0].NetworkSettings'
```

### Network Debugging

```bash
# List networks
docker network ls

# Inspect network
docker network inspect todo-network

# Test connectivity
docker exec <container> ping backend
docker exec <container> curl http://backend:8000/health
```

### Build Debugging

```bash
# Build with progress output
docker build --progress=plain .

# Build without cache
docker build --no-cache .

# Export build cache
docker buildx build --cache-to=type=local,dest=./cache .
```
