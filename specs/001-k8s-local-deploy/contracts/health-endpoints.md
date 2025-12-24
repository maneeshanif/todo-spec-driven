# Contract: Health Check Endpoints

**Feature**: 001-k8s-local-deploy
**Type**: API Contract
**Date**: 2025-12-24

## Overview

This contract defines the health check endpoints for Kubernetes liveness and readiness probes.

---

## Frontend Health Check

**Endpoint**: `GET /`

**Purpose**: Verify Next.js application is running and serving pages

**Request**:
```http
GET / HTTP/1.1
Host: frontend:3000
```

**Success Response** (HTTP 200):
```html
<!DOCTYPE html>
<html>
  <!-- Next.js rendered page -->
</html>
```

**Failure Response** (HTTP 500/502/503):
- Container not started
- Build failed
- Runtime error

**Kubernetes Probe Configuration**:
```yaml
livenessProbe:
  httpGet:
    path: /
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

---

## Backend Health Check

**Endpoint**: `GET /health`

**Purpose**: Verify FastAPI application is running and can handle requests

**Request**:
```http
GET /health HTTP/1.1
Host: backend:8000
```

**Success Response** (HTTP 200):
```json
{
  "status": "healthy",
  "service": "backend",
  "version": "1.0.0"
}
```

**Failure Response** (HTTP 500/503):
```json
{
  "status": "unhealthy",
  "service": "backend",
  "error": "Database connection failed"
}
```

**Kubernetes Probe Configuration**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

**Implementation Note**: The `/health` endpoint must be added to the FastAPI application if not already present.

---

## MCP Server Health Check

**Endpoint**: `GET /health`

**Purpose**: Verify FastMCP server is running and ready to handle tool calls

**Request**:
```http
GET /health HTTP/1.1
Host: mcp-server:8001
```

**Success Response** (HTTP 200):
```json
{
  "status": "healthy",
  "service": "mcp-server",
  "tools_available": true
}
```

**Failure Response** (HTTP 500/503):
```json
{
  "status": "unhealthy",
  "service": "mcp-server",
  "error": "Tool initialization failed"
}
```

**Kubernetes Probe Configuration**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8001
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 8001
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

**Implementation Note**: The `/health` endpoint must be added to the FastMCP server if not already present.

---

## Probe Timing Rationale

| Service | Initial Delay | Period | Timeout | Failure Threshold |
|---------|---------------|--------|---------|-------------------|
| Frontend | 30s | 10s | 5s | 3 |
| Backend | 30s | 10s | 5s | 3 |
| MCP Server | 10s | 10s | 5s | 3 |

**Why 30s initial delay for Frontend/Backend**:
- Next.js builds static pages on first request
- FastAPI needs to establish database connection
- Allows time for application initialization

**Why 10s initial delay for MCP Server**:
- Lighter weight service
- Faster startup
- No external dependencies

**Why 3 failure threshold**:
- Allows for transient failures
- Prevents premature pod restarts
- Matches Kubernetes defaults

---

## Testing Health Checks

**Local Testing**:
```bash
# Frontend
curl http://localhost:3000/ -I

# Backend
curl http://localhost:8000/health

# MCP Server
curl http://localhost:8001/health
```

**In-Cluster Testing**:
```bash
# From a test pod in the same namespace
kubectl run test-pod --rm -it --image=curlimages/curl -n todo-app -- sh

# Inside the pod
curl http://frontend:80/
curl http://backend:8000/health
curl http://mcp-server:8001/health
```

---

**Contract Version**: 1.0.0
**Created**: December 24, 2025
