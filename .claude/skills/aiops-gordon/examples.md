# Docker AI (Gordon) Skill - Examples

## Example 1: Basic Gordon Commands

```bash
# Ask Gordon for help
docker ai "How do I create a multi-stage Dockerfile for a Python FastAPI app?"

# Get container debugging help
docker ai "My container keeps restarting, how do I debug it?"

# Ask about best practices
docker ai "What are the best practices for container security?"

# Get optimization suggestions
docker ai "How can I reduce the size of my Docker image?"
```

## Example 2: Build Assistance

```bash
# Get Dockerfile generation help
docker ai "Generate a Dockerfile for a Next.js 16 production build"

# Optimize existing Dockerfile
docker ai "Review and optimize this Dockerfile for production" < Dockerfile

# Multi-stage build help
docker ai "Convert this single-stage Dockerfile to multi-stage for smaller image size"
```

## Example 3: Compose Assistance

```bash
# Generate docker-compose
docker ai "Create a docker-compose.yml for a FastAPI backend, Next.js frontend, and PostgreSQL database"

# Debug compose issues
docker ai "Why won't my services connect to each other in docker-compose?"

# Environment configuration
docker ai "How do I properly handle environment variables in docker-compose?"
```

## Example 4: Container Troubleshooting

```bash
# Debug container issues
docker ai "Container exits with code 137, what does this mean?"

# Network issues
docker ai "How do I debug network connectivity between containers?"

# Volume issues
docker ai "My volume mounts aren't working in Docker Desktop, how do I fix this?"

# Performance issues
docker ai "Container using too much memory, how do I optimize?"
```

## Example 5: Security Analysis

```bash
# Security best practices
docker ai "What security measures should I add to my Dockerfile?"

# Vulnerability scanning
docker ai "How do I scan my images for vulnerabilities?"

# Non-root user setup
docker ai "How do I run my container as a non-root user?"

# Secret management
docker ai "What's the best way to handle secrets in Docker?"
```

## Example 6: Image Optimization

```bash
# Reduce image size
docker ai "My image is 2GB, how can I make it smaller?"

# Layer optimization
docker ai "How should I order my Dockerfile instructions for better caching?"

# Base image selection
docker ai "What base image should I use for a Python 3.12 application?"
```

## Example 7: Development Workflow

```bash
# Hot reload setup
docker ai "How do I set up hot reload for my FastAPI app in Docker?"

# Dev vs prod configs
docker ai "What's the best way to have different configs for development and production?"

# Debugging inside container
docker ai "How do I attach a debugger to my containerized Python app?"
```

## Example 8: Kubernetes Preparation

```bash
# K8s readiness
docker ai "How do I prepare my Docker setup for Kubernetes deployment?"

# Health checks
docker ai "What health checks should I add for Kubernetes?"

# Resource limits
docker ai "How do I determine the right resource limits for my container?"
```

## Example 9: CI/CD Integration

```bash
# GitHub Actions
docker ai "How do I build and push my images in GitHub Actions?"

# Multi-platform builds
docker ai "How do I build images for both amd64 and arm64?"

# Caching strategies
docker ai "How can I speed up my Docker builds in CI?"
```

## Example 10: Migration Assistance

```bash
# Docker Compose to Kubernetes
docker ai "How do I convert my docker-compose.yml to Kubernetes manifests?"

# Legacy to modern
docker ai "How do I modernize this old Dockerfile using current best practices?"
```

## Gordon Integration Examples

### Interactive Session

```bash
# Start interactive session
docker ai

# Example conversation:
# You: I need to containerize a FastAPI app with PostgreSQL
# Gordon: I'll help you create a setup for that...
# You: Can you also add Redis for caching?
# Gordon: Sure, let me update the configuration...
```

### Script Integration

```bash
#!/bin/bash
# scripts/ai-review.sh

# Get Gordon's review of Dockerfile
echo "Reviewing Dockerfile..."
docker ai "Review this Dockerfile for issues and suggest improvements" < Dockerfile > review.md

# Get Gordon's help with compose
echo "Checking docker-compose..."
docker ai "Validate this docker-compose.yml for production readiness" < docker-compose.yml >> review.md

echo "Review saved to review.md"
```

### Automated Optimization

```bash
#!/bin/bash
# scripts/optimize-image.sh

IMAGE_NAME=$1

echo "Analyzing image: $IMAGE_NAME"

# Get image info
docker image inspect $IMAGE_NAME > /tmp/image-info.json

# Ask Gordon for optimization suggestions
docker ai "Analyze this image info and suggest optimizations" < /tmp/image-info.json
```

## Best Practices with Gordon

### 1. Provide Context

```bash
# Good - provides context
docker ai "I'm building a Python FastAPI app that connects to PostgreSQL. \
The app runs database migrations on startup. \
How should I structure my Dockerfile?"

# Less effective - vague
docker ai "How do I write a Dockerfile?"
```

### 2. Ask Specific Questions

```bash
# Good - specific question
docker ai "Why does my container lose data when it restarts, \
and how do I persist data using volumes?"

# Less effective - too broad
docker ai "Help with Docker data"
```

### 3. Include Error Messages

```bash
# Good - includes error
docker ai "I'm getting this error when building: \
'ERROR: failed to solve: python:3.12-slim: not found' \
What's wrong?"

# Less effective - no error details
docker ai "My build is failing"
```

### 4. Iterate on Solutions

```bash
# First question
docker ai "Create a Dockerfile for my FastAPI app"

# Follow-up with specifics
docker ai "Now add health checks and a non-root user"

# Further refinement
docker ai "How can I add a development mode with hot reload?"
```
