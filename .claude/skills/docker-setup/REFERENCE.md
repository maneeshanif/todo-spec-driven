# Docker Setup Skill - API Reference

## Dockerfile Instructions Reference

### FROM

```dockerfile
# Syntax
FROM <image>[:<tag>] [AS <name>]

# Examples
FROM python:3.12-slim
FROM node:22-alpine AS builder
FROM --platform=linux/amd64 ubuntu:22.04
```

### WORKDIR

```dockerfile
# Set working directory
WORKDIR /app

# Creates directory if it doesn't exist
WORKDIR /path/to/workdir
```

### COPY

```dockerfile
# Basic copy
COPY <src> <dest>

# Copy with ownership
COPY --chown=user:group src dest

# Copy from build stage
COPY --from=builder /app/dist ./dist

# Multiple sources
COPY package.json package-lock.json ./
```

### RUN

```dockerfile
# Shell form
RUN apt-get update && apt-get install -y curl

# Exec form
RUN ["executable", "param1", "param2"]

# With mount (cache)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# With secrets
RUN --mount=type=secret,id=mysecret cat /run/secrets/mysecret
```

### ENV

```dockerfile
# Set environment variables
ENV NODE_ENV=production
ENV PATH="/app/bin:$PATH"

# Multiple variables
ENV VAR1=value1 \
    VAR2=value2
```

### ARG

```dockerfile
# Define build argument
ARG VERSION=latest
ARG BUILD_DATE

# Use in build
RUN echo "Building version: ${VERSION}"
```

### EXPOSE

```dockerfile
# Document exposed ports
EXPOSE 8000
EXPOSE 8000/tcp 8001/udp
```

### CMD

```dockerfile
# Exec form (preferred)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]

# Shell form
CMD uvicorn main:app --host 0.0.0.0
```

### ENTRYPOINT

```dockerfile
# Exec form
ENTRYPOINT ["python", "app.py"]

# Combined with CMD
ENTRYPOINT ["python"]
CMD ["app.py"]
```

### HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=5s \
    CMD curl -f http://localhost:8000/health || exit 1
```

### USER

```dockerfile
# Switch to non-root user
RUN adduser --system --uid 1001 appuser
USER appuser
```

### LABEL

```dockerfile
LABEL org.opencontainers.image.source="https://github.com/user/repo"
LABEL org.opencontainers.image.version="1.0.0"
LABEL maintainer="team@example.com"
```

## Docker Compose Schema Reference

### Version & Services

```yaml
# docker-compose.yml
version: '3.9'  # Optional in newer versions

services:
  service-name:
    # Service configuration
```

### Build Configuration

```yaml
services:
  app:
    build:
      context: ./dir
      dockerfile: Dockerfile.custom
      target: production
      args:
        - BUILD_ENV=prod
      cache_from:
        - type=registry,ref=myapp:cache
      labels:
        - "com.example.version=1.0"
      network: host
      shm_size: '2gb'
```

### Image Configuration

```yaml
services:
  app:
    image: myregistry/myapp:1.0.0
    pull_policy: always  # always, missing, never, build
```

### Environment Configuration

```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - DATABASE_URL
    env_file:
      - .env
      - .env.local
```

### Port Mapping

```yaml
services:
  app:
    ports:
      - "3000:3000"           # HOST:CONTAINER
      - "8000-8010:8000-8010" # Port range
      - "127.0.0.1:8000:8000" # Localhost only
    expose:
      - "3000"                # Internal only
```

### Volume Configuration

```yaml
services:
  app:
    volumes:
      - ./src:/app/src                    # Bind mount
      - data-volume:/app/data             # Named volume
      - /app/node_modules                 # Anonymous volume
      - type: bind
        source: ./data
        target: /app/data
        read_only: true

volumes:
  data-volume:
    driver: local
```

### Network Configuration

```yaml
services:
  app:
    networks:
      - frontend
      - backend
    network_mode: "bridge"  # bridge, host, none

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

### Dependencies

```yaml
services:
  app:
    depends_on:
      - db
      - cache
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
```

### Health Check

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
      disable: false
```

### Deploy Configuration

```yaml
services:
  app:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
```

### Restart Policy

```yaml
services:
  app:
    restart: "no"         # never restart
    restart: always       # always restart
    restart: on-failure   # restart on failure
    restart: unless-stopped
```

### Logging

```yaml
services:
  app:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

### Command & Entrypoint

```yaml
services:
  app:
    command: ["npm", "start"]
    entrypoint: ["/docker-entrypoint.sh"]
```

## Docker CLI Reference

### Build Commands

| Command | Description |
|---------|-------------|
| `docker build -t name:tag .` | Build image |
| `docker build --target stage .` | Build specific stage |
| `docker build --no-cache .` | Build without cache |
| `docker buildx build --platform linux/amd64,linux/arm64 .` | Multi-platform build |

### Container Commands

| Command | Description |
|---------|-------------|
| `docker run -d --name app image` | Run container |
| `docker exec -it container sh` | Execute in container |
| `docker logs -f container` | Follow logs |
| `docker stop container` | Stop container |
| `docker rm container` | Remove container |

### Image Commands

| Command | Description |
|---------|-------------|
| `docker images` | List images |
| `docker pull image:tag` | Pull image |
| `docker push image:tag` | Push image |
| `docker rmi image` | Remove image |
| `docker image prune` | Remove unused images |

### Compose Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start services |
| `docker compose down` | Stop services |
| `docker compose logs -f` | View logs |
| `docker compose build` | Build services |
| `docker compose ps` | List services |

## Container Labels for Kubernetes

```dockerfile
# Labels for Kubernetes integration
LABEL io.kubernetes.container.name="backend"
LABEL io.kubernetes.pod.namespace="todo-app"
```

## Security Best Practices

### Non-root User

```dockerfile
# Create and use non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser
USER appuser
```

### Read-only Filesystem

```yaml
services:
  app:
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
```

### Security Options

```yaml
services:
  app:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```
