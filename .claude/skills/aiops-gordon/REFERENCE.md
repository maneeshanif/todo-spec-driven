# Docker AI (Gordon) Skill - API Reference

## Command Syntax

```bash
docker ai [OPTIONS] [PROMPT]
```

### Options

| Option | Description |
|--------|-------------|
| `--help` | Show help message |
| `-i, --interactive` | Start interactive session |
| `--context FILE` | Include file as context |

## Prompt Categories

### Dockerfile Operations

| Prompt Type | Example |
|-------------|---------|
| Create | `"Create a Dockerfile for [technology]"` |
| Optimize | `"Optimize this Dockerfile for size/speed"` |
| Debug | `"Fix this Dockerfile error: [error]"` |
| Review | `"Review this Dockerfile for best practices"` |
| Convert | `"Convert this to multi-stage build"` |

### Docker Compose Operations

| Prompt Type | Example |
|-------------|---------|
| Create | `"Create docker-compose for [services]"` |
| Network | `"Configure networking between [services]"` |
| Debug | `"Debug why [service] can't connect to [service]"` |
| Validate | `"Validate this compose file for production"` |

### Container Operations

| Prompt Type | Example |
|-------------|---------|
| Debug | `"Container exits with code [code]"` |
| Logs | `"Analyze these container logs"` |
| Performance | `"Optimize container resource usage"` |
| Security | `"Secure this container configuration"` |

### Image Operations

| Prompt Type | Example |
|-------------|---------|
| Select | `"Best base image for [technology]"` |
| Reduce | `"Reduce image size from [size]"` |
| Scan | `"Scan image for vulnerabilities"` |
| Layer | `"Optimize image layers"` |

## Response Formats

### Code Generation

Gordon returns code blocks with:
- Dockerfile syntax
- YAML for compose
- Shell commands
- Configuration files

```dockerfile
# Example response format
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### Explanations

Gordon provides:
- Step-by-step instructions
- Reasoning for recommendations
- Alternative approaches
- Best practice notes

### Error Analysis

Gordon identifies:
- Root cause of errors
- Suggested fixes
- Prevention strategies
- Related issues to check

## Use Cases by Phase

### Development Phase

```bash
# Initial setup
docker ai "Set up Docker development environment for [stack]"

# Hot reload
docker ai "Configure hot reload for [framework] in Docker"

# Database
docker ai "Set up local database with Docker"
```

### Testing Phase

```bash
# Test containers
docker ai "Create test containers for integration tests"

# CI/CD
docker ai "Docker configuration for GitHub Actions"

# Parallel testing
docker ai "Run tests in parallel with Docker"
```

### Production Phase

```bash
# Optimization
docker ai "Optimize for production deployment"

# Security
docker ai "Production security hardening"

# Monitoring
docker ai "Add health checks and monitoring"
```

### Kubernetes Migration

```bash
# Conversion
docker ai "Convert docker-compose to Kubernetes manifests"

# Compatibility
docker ai "Make Docker setup Kubernetes-ready"

# Best practices
docker ai "Kubernetes deployment best practices"
```

## Integration Patterns

### With Docker CLI

```bash
# Analyze running containers
docker ps --format json | docker ai "Analyze container status"

# Review build output
docker build . 2>&1 | docker ai "Analyze build output"

# Check resource usage
docker stats --no-stream | docker ai "Resource optimization suggestions"
```

### With Files

```bash
# Single file
docker ai "Review" < Dockerfile

# Multiple files context
cat Dockerfile docker-compose.yml | docker ai "Review configuration"

# Save output
docker ai "Generate Dockerfile" > Dockerfile.new
```

### With Scripts

```bash
#!/bin/bash
# Automated review pipeline

files=("Dockerfile" "docker-compose.yml")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "=== Reviewing $file ==="
        docker ai "Review for production" < "$file"
        echo ""
    fi
done
```

## Common Questions Reference

### Building

| Question | Use Case |
|----------|----------|
| "Best base image for X?" | Technology selection |
| "Multi-stage build for X?" | Image optimization |
| "Cache dependencies?" | Build speed |
| "Reduce layers?" | Image size |

### Running

| Question | Use Case |
|----------|----------|
| "Why container exits?" | Debugging |
| "Container slow?" | Performance |
| "Memory issues?" | Resource management |
| "Permission denied?" | Security/permissions |

### Networking

| Question | Use Case |
|----------|----------|
| "Connect services?" | Inter-container communication |
| "Expose ports?" | External access |
| "DNS not working?" | Name resolution |
| "Network isolation?" | Security |

### Storage

| Question | Use Case |
|----------|----------|
| "Persist data?" | Data management |
| "Share volumes?" | Multi-container data |
| "Backup volumes?" | Data protection |
| "Permission issues?" | Access control |

## Error Message Reference

| Error Pattern | Gordon Query |
|---------------|--------------|
| `OOMKilled` | "Container killed with OOMKilled" |
| `Exit code 1` | "Container exits with code 1" |
| `Exit code 137` | "Exit code 137 meaning and fix" |
| `Exit code 139` | "Exit code 139 segfault" |
| `Permission denied` | "Permission denied in container" |
| `Network unreachable` | "Network unreachable between containers" |
| `Port already in use` | "Port conflict resolution" |
| `Image not found` | "Cannot find Docker image" |

## Tips for Effective Use

### 1. Provide Context

```bash
# Good
docker ai "I'm running Python 3.12 with FastAPI on Ubuntu. \
Container uses 2GB RAM and runs 4 Uvicorn workers. \
Why am I getting OOM errors?"

# Poor
docker ai "Why OOM?"
```

### 2. Include Errors

```bash
# Good
docker ai "Build fails with: 'ERROR: executor failed running: \
/bin/sh -c pip install -r requirements.txt: exit code 1'"

# Poor
docker ai "Build doesn't work"
```

### 3. Specify Environment

```bash
# Good
docker ai "Using Docker Desktop 4.35 on macOS M1. \
Multi-platform build for amd64 and arm64."

# Poor
docker ai "Multi-platform build help"
```

### 4. Ask Follow-ups

```bash
# Initial question
docker ai "Create Dockerfile for FastAPI"

# Follow-up
docker ai "Now add non-root user and health check"

# Further refinement
docker ai "Add dev mode with hot reload"
```
