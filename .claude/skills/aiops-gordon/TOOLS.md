# Docker AI (Gordon) Skill - Tools Reference

## Requirements

### Docker Desktop with AI Enabled

```bash
# Check Docker Desktop version (4.35+ required)
docker version

# Verify AI is available
docker ai --help
```

### Enable Docker AI

1. Open Docker Desktop
2. Go to Settings > Features in development
3. Enable "Docker AI" (Beta)
4. Restart Docker Desktop

## Docker AI Commands

### Basic Usage

```bash
# Interactive mode
docker ai

# Single question
docker ai "your question here"

# With context from file
docker ai "review this" < Dockerfile

# Pipe output
docker ai "explain this" < docker-compose.yml | tee explanation.md
```

### Question Categories

#### Build & Dockerfile

```bash
docker ai "Create a Dockerfile for Python FastAPI"
docker ai "Optimize this Dockerfile for smaller size"
docker ai "Add multi-stage build to reduce image size"
docker ai "What's wrong with my Dockerfile?"
```

#### Docker Compose

```bash
docker ai "Create docker-compose for microservices"
docker ai "How do I connect services in compose?"
docker ai "Debug networking issues in compose"
docker ai "Add health checks to my compose file"
```

#### Containers & Images

```bash
docker ai "Why is my container exiting?"
docker ai "How do I reduce image size?"
docker ai "Best base image for Node.js?"
docker ai "Debug container startup issues"
```

#### Networking

```bash
docker ai "How do Docker networks work?"
docker ai "Connect containers across networks"
docker ai "Expose container to host network"
docker ai "Debug DNS resolution in containers"
```

#### Volumes & Storage

```bash
docker ai "Persist data with Docker volumes"
docker ai "Share data between containers"
docker ai "Fix volume permission issues"
docker ai "Backup Docker volumes"
```

#### Security

```bash
docker ai "Docker security best practices"
docker ai "Run container as non-root"
docker ai "Scan images for vulnerabilities"
docker ai "Handle secrets securely"
```

## Integration with Docker CLI

### Combine with Docker Commands

```bash
# Get logs and ask for analysis
docker logs mycontainer 2>&1 | docker ai "Analyze these logs for errors"

# Inspect and get recommendations
docker inspect mycontainer | docker ai "Suggest optimizations for this container"

# Check image layers
docker history myimage:latest | docker ai "How can I reduce layers?"
```

### Workflow Examples

```bash
# Build troubleshooting
docker build -t myapp . 2>&1 | docker ai "What's wrong with this build?"

# Compose debugging
docker compose up 2>&1 | docker ai "Why are my services not connecting?"

# Performance analysis
docker stats --no-stream | docker ai "Analyze resource usage and suggest optimizations"
```

## Configuration

### Environment Variables

```bash
# Set default behavior
export DOCKER_AI_MODEL="gpt-4"  # Model selection (if available)
export DOCKER_AI_CONTEXT="1000" # Context window
```

### Docker Desktop Settings

1. **Settings > Features in development**
   - Docker AI: Enabled
   - Experimental features: As needed

2. **Settings > Resources**
   - Allocate sufficient memory for AI operations
   - Recommended: 8GB+ RAM

## Best Practices

### Effective Prompting

```bash
# Be specific about your environment
docker ai "I'm using Docker on Linux with Python 3.12 and FastAPI. \
My image is 1.5GB. How can I reduce it?"

# Include relevant context
docker ai "Given this multi-service setup with frontend, backend, and database, \
how should I configure networking?"

# Ask for step-by-step guidance
docker ai "Walk me through creating a production-ready Dockerfile for a Next.js app"
```

### Common Workflows

```bash
# 1. Initial setup
docker ai "Best practices for containerizing a new project"

# 2. Development
docker ai "Set up hot reload for development in Docker"

# 3. Optimization
docker ai "Optimize my Docker setup for production"

# 4. Security
docker ai "Security audit for my Docker configuration"

# 5. Deployment
docker ai "Prepare my Docker setup for Kubernetes"
```

## Troubleshooting

### Gordon Not Available

```bash
# Check Docker Desktop is running
docker info

# Verify AI feature is enabled
docker ai --help

# Restart Docker Desktop if needed
# On Linux: systemctl restart docker
# On macOS/Windows: Restart Docker Desktop app
```

### Response Issues

```bash
# If responses are too generic, add context
docker ai "For a production environment with high traffic, \
how should I configure my container resources?"

# If responses are incorrect, be more specific
docker ai "I'm getting error code 137 (OOM) in my Python container \
running FastAPI with Uvicorn workers"
```

### Rate Limiting

```bash
# If hitting rate limits, space out requests
sleep 5 && docker ai "my question"

# Use batch questions
docker ai "Answer these questions:
1. Best base image for Python?
2. How to add health checks?
3. Security best practices?"
```

## Limitations

1. **Internet Required**: Docker AI requires internet connectivity
2. **Rate Limits**: May have usage limits during beta
3. **Context Size**: Limited context window for large files
4. **Accuracy**: Verify suggestions before applying to production
5. **Platform Support**: Requires Docker Desktop 4.35+

## Integration Scripts

### Dockerfile Review Script

```bash
#!/bin/bash
# scripts/review-dockerfile.sh

DOCKERFILE=${1:-"Dockerfile"}

if [ -f "$DOCKERFILE" ]; then
    echo "Reviewing $DOCKERFILE..."
    docker ai "Review this Dockerfile for:
    1. Security issues
    2. Size optimization
    3. Best practices
    4. Layer efficiency" < "$DOCKERFILE"
else
    echo "File not found: $DOCKERFILE"
    exit 1
fi
```

### Compose Validation Script

```bash
#!/bin/bash
# scripts/validate-compose.sh

COMPOSE_FILE=${1:-"docker-compose.yml"}

if [ -f "$COMPOSE_FILE" ]; then
    echo "Validating $COMPOSE_FILE..."
    docker ai "Validate this docker-compose.yml for:
    1. Service connectivity
    2. Resource allocation
    3. Environment configuration
    4. Production readiness" < "$COMPOSE_FILE"
else
    echo "File not found: $COMPOSE_FILE"
    exit 1
fi
```
