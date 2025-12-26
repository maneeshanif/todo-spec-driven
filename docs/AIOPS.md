# AIOps Reference Guide

This guide covers AI-powered operations tools for the Evolution of Todo Kubernetes deployment.

## Table of Contents

1. [Docker AI (Gordon)](#docker-ai-gordon)
2. [kubectl-ai](#kubectl-ai)
3. [Kagent](#kagent)
4. [Troubleshooting Workflows](#troubleshooting-workflows)

---

## Docker AI (Gordon)

Docker AI (Gordon) is Docker's built-in AI assistant for container operations and Dockerfile optimization.

### Prerequisites

- Docker Desktop 4.53+ with Docker AI enabled
- Or Docker CLI with AI extension

### Installation

Docker AI comes built into Docker Desktop. Enable it in:

**Docker Desktop Settings** > **Features in development** > **Enable Docker AI**

### Common Commands

```bash
# Analyze Dockerfile for optimization
docker ai "analyze frontend/Dockerfile for optimization opportunities"

# Suggest multi-stage build improvements
docker ai "how can I reduce the size of backend/Dockerfile"

# Debug build failures
docker ai "why is my Docker build failing with this error: [paste error]"

# Security analysis
docker ai "check backend/Dockerfile for security vulnerabilities"

# Explain Docker concepts
docker ai "explain multi-stage builds and when to use them"
```

### Optimization Workflow

1. **Analyze current Dockerfile:**
   ```bash
   docker ai "analyze frontend/Dockerfile for optimization opportunities"
   ```

2. **Get specific recommendations:**
   ```bash
   docker ai "how can I reduce layers in my Dockerfile"
   docker ai "suggest optimal base image for Python 3.13 FastAPI app"
   ```

3. **Validate security:**
   ```bash
   docker ai "check for security issues in backend/Dockerfile"
   docker ai "is running as non-root user configured correctly"
   ```

### Example Optimization Session

```bash
# Check image size
docker images todo-backend:latest

# Ask Gordon for optimization
docker ai "The todo-backend:latest image is 524MB. How can I reduce it?"

# Apply suggestions and rebuild
docker build -t todo-backend:optimized ./backend

# Compare sizes
docker images | grep todo-backend
```

---

## kubectl-ai

kubectl-ai is an AI-powered kubectl plugin that converts natural language to kubectl commands.

### Prerequisites

- Go 1.19+
- kubectl installed and configured
- OpenAI API key (or compatible LLM API)

### Installation

```bash
# Install using go
go install github.com/GoogleCloudPlatform/kubectl-ai/cmd/kubectl-ai@latest

# Or using Homebrew (macOS)
brew install kubectl-ai

# Verify installation
kubectl-ai version
```

### Configuration

```bash
# Set OpenAI API key
export OPENAI_API_KEY="your-api-key-here"

# Or use alternative LLM
export KUBECTL_AI_BACKEND="gemini"
export GEMINI_API_KEY="your-gemini-key"
```

### Common Commands

```bash
# List pods in namespace
kubectl-ai "list all pods in todo-app namespace"

# Get pod status
kubectl-ai "show pods that are not running in todo-app"

# Check resource usage
kubectl-ai "show CPU and memory usage for all pods in todo-app"

# View logs
kubectl-ai "get logs from the backend pod in todo-app namespace"

# Scale deployment
kubectl-ai "scale frontend deployment to 3 replicas in todo-app"

# Debug issues
kubectl-ai "why are pods in todo-app namespace not starting"

# Get events
kubectl-ai "show recent events in todo-app namespace"
```

### Troubleshooting Commands

```bash
# Find crashing pods
kubectl-ai "find pods that are in CrashLoopBackOff in todo-app"

# Check resource limits
kubectl-ai "show resource requests and limits for pods in todo-app"

# Network debugging
kubectl-ai "check if services in todo-app can reach each other"

# Storage issues
kubectl-ai "show persistent volume claims in todo-app"
```

### Safety Mode

kubectl-ai can operate in "dry-run" mode:

```bash
# Preview commands without executing
kubectl-ai --dry-run "delete all pods in todo-app namespace"

# This shows the command but doesn't execute:
# kubectl delete pods --all -n todo-app
```

---

## Kagent

Kagent is an AI agent for Kubernetes cluster management and health analysis.

### Prerequisites

- Go 1.19+
- kubectl with cluster access
- OpenAI API key (or compatible LLM)

### Installation

```bash
# Install using go
go install github.com/kagent-dev/kagent@latest

# Verify installation
kagent version

# Configure API key
export OPENAI_API_KEY="your-api-key-here"
```

### Cluster Health Analysis

```bash
# Full cluster health check
kagent analyze cluster

# Namespace-specific analysis
kagent analyze namespace todo-app

# Pod health check
kagent analyze pods -n todo-app

# Resource optimization suggestions
kagent optimize -n todo-app
```

### Common Commands

```bash
# Cluster overview
kagent status

# Analyze specific deployment
kagent analyze deployment backend -n todo-app

# Check for issues
kagent diagnose -n todo-app

# Get recommendations
kagent recommend -n todo-app

# Resource right-sizing
kagent rightsize -n todo-app
```

### Automated Remediation

Kagent can suggest or apply fixes:

```bash
# Get fix suggestions
kagent fix --dry-run -n todo-app

# Apply recommended fixes (with confirmation)
kagent fix -n todo-app

# Rollback if needed
kagent rollback -n todo-app
```

---

## Troubleshooting Workflows

### Workflow 1: Pod Not Starting

```bash
# Step 1: Check pod status
kubectl get pods -n todo-app

# Step 2: Use kubectl-ai for diagnosis
kubectl-ai "why is the backend pod not starting in todo-app"

# Step 3: Get detailed events
kubectl describe pod backend-xxxxx -n todo-app

# Step 4: Ask Gordon for container issues
docker ai "debug container startup failure for FastAPI app"

# Step 5: Check logs
kubectl logs backend-xxxxx -n todo-app --previous
```

### Workflow 2: High Resource Usage

```bash
# Step 1: Check current usage
kubectl top pods -n todo-app

# Step 2: Use Kagent for analysis
kagent analyze pods -n todo-app

# Step 3: Get optimization suggestions
kagent rightsize -n todo-app

# Step 4: Apply using kubectl-ai
kubectl-ai "update backend deployment to use 500m CPU limit"
```

### Workflow 3: Docker Image Optimization

```bash
# Step 1: Check current image sizes
docker images | grep todo

# Step 2: Analyze with Gordon
docker ai "optimize todo-frontend Dockerfile for smaller size"

# Step 3: Apply suggestions
# Edit Dockerfile based on recommendations

# Step 4: Rebuild and compare
docker build -t todo-frontend:optimized ./frontend
docker images | grep todo-frontend
```

### Workflow 4: Deployment Rollback

```bash
# Step 1: Check deployment history
kubectl rollout history deployment/backend -n todo-app

# Step 2: Use kubectl-ai for analysis
kubectl-ai "show what changed between the last two backend deployments"

# Step 3: Rollback if needed
kubectl-ai "rollback backend deployment to previous version in todo-app"

# Or use Kagent
kagent rollback deployment backend -n todo-app
```

---

## Quick Reference Card

### Docker AI (Gordon)

| Task | Command |
|------|---------|
| Analyze Dockerfile | `docker ai "analyze [path] for optimization"` |
| Security check | `docker ai "check [path] for security issues"` |
| Debug build | `docker ai "why is my build failing with [error]"` |
| Reduce size | `docker ai "how to reduce image size for [path]"` |

### kubectl-ai

| Task | Command |
|------|---------|
| List pods | `kubectl-ai "list pods in [namespace]"` |
| Get logs | `kubectl-ai "get logs from [pod] in [namespace]"` |
| Scale | `kubectl-ai "scale [deployment] to [N] replicas"` |
| Debug | `kubectl-ai "why is [pod] not running"` |

### Kagent

| Task | Command |
|------|---------|
| Cluster health | `kagent analyze cluster` |
| Namespace check | `kagent analyze namespace [name]` |
| Right-sizing | `kagent rightsize -n [namespace]` |
| Fix issues | `kagent fix -n [namespace]` |

---

## Environment Variables

```bash
# Docker AI (usually built-in)
# No additional config needed for Docker Desktop

# kubectl-ai
export OPENAI_API_KEY="your-key"
# Or for Gemini
export KUBECTL_AI_BACKEND="gemini"
export GEMINI_API_KEY="your-key"

# Kagent
export OPENAI_API_KEY="your-key"
export KAGENT_LOG_LEVEL="info"
```

---

## Notes

- All tools work best with valid kubeconfig and cluster access
- Gordon requires Docker Desktop with AI features enabled
- kubectl-ai and Kagent require API keys for LLM access
- Always use `--dry-run` or preview mode for destructive operations
- These tools augment but don't replace manual kubectl commands

---

**Version**: 1.0.0
**Last Updated**: December 25, 2025
**Phase**: Phase 4 - Local Kubernetes Deployment
