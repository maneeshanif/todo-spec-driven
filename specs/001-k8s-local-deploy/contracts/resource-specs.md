# Contract: Resource Specifications

**Feature**: 001-k8s-local-deploy
**Type**: Infrastructure Contract
**Date**: 2025-12-24

## Overview

This contract defines the resource requirements and limits for all Kubernetes deployments.

---

## Cluster Requirements

### Minikube Minimum Resources

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 cores | 6 cores |
| Memory | 8 GB | 12 GB |
| Disk | 20 GB | 40 GB |

**Start Command**:
```bash
minikube start --cpus=4 --memory=8192 --disk-size=20g --driver=docker
```

---

## Container Image Size Limits

| Service | Maximum Size | Rationale |
|---------|--------------|-----------|
| Frontend | 200 MB | Optimized Next.js standalone |
| Backend | 500 MB | Python + dependencies |
| MCP Server | 100 MB | Minimal Python + FastMCP |

**Total Maximum**: 800 MB (before replication)

**Verification**:
```bash
docker images | grep todo
```

---

## Pod Resource Allocations

### Frontend

| Resource | Request | Limit | Rationale |
|----------|---------|-------|-----------|
| CPU | 100m | 500m | SSR can spike during page generation |
| Memory | 128Mi | 256Mi | Node.js typically uses 100-200MB |

**Per-Pod Allocation**: 100-500m CPU, 128-256Mi RAM
**With 2 Replicas**: 200-1000m CPU, 256-512Mi RAM total

### Backend

| Resource | Request | Limit | Rationale |
|----------|---------|-------|-----------|
| CPU | 200m | 1000m | AI agent calls can be CPU-intensive |
| Memory | 256Mi | 512Mi | Python + ML libraries need more memory |

**Per-Pod Allocation**: 200-1000m CPU, 256-512Mi RAM
**With 2 Replicas**: 400-2000m CPU, 512-1024Mi RAM total

### MCP Server

| Resource | Request | Limit | Rationale |
|----------|---------|-------|-----------|
| CPU | 100m | 300m | Lightweight tool execution |
| Memory | 64Mi | 128Mi | Minimal Python process |

**Per-Pod Allocation**: 100-300m CPU, 64-128Mi RAM
**With 1 Replica**: 100-300m CPU, 64-128Mi RAM total

---

## Total Cluster Resource Usage

### Worst Case (All Limits)

| Service | Replicas | CPU Limit | Memory Limit |
|---------|----------|-----------|--------------|
| Frontend | 2 | 1000m | 512Mi |
| Backend | 2 | 2000m | 1024Mi |
| MCP Server | 1 | 300m | 128Mi |
| **Total** | **5** | **3300m** | **1664Mi** |

### Typical Usage (Requests)

| Service | Replicas | CPU Request | Memory Request |
|---------|----------|-------------|----------------|
| Frontend | 2 | 200m | 256Mi |
| Backend | 2 | 400m | 512Mi |
| MCP Server | 1 | 100m | 64Mi |
| **Total** | **5** | **700m** | **832Mi** |

### Cluster Headroom

With 4 CPU and 8GB RAM:

| Metric | Available | App Usage | Remaining |
|--------|-----------|-----------|-----------|
| CPU | 4000m | 700-3300m | 700-3300m |
| Memory | 8192Mi | 832-1664Mi | 6528-7360Mi |

**Analysis**: Sufficient headroom for Kubernetes system pods and burst usage.

---

## Quality of Service (QoS) Classes

All pods use **Burstable** QoS:
- Requests < Limits
- Allows burst usage above requests
- May be evicted if node is under pressure

**Alternative Consideration**:
- **Guaranteed** (requests = limits): More predictable, less flexible
- **BestEffort** (no limits): Not recommended, can starve other pods

---

## Horizontal Pod Autoscaler (Phase 5)

Prepared for Phase 5 autoscaling:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: todo-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**Thresholds** (planned for Phase 5):
| Service | Min | Max | CPU Target |
|---------|-----|-----|------------|
| Frontend | 2 | 5 | 70% |
| Backend | 2 | 10 | 70% |
| MCP Server | 1 | 3 | 80% |

---

## Resource Monitoring

### Enable Metrics Server

```bash
minikube addons enable metrics-server
```

### View Resource Usage

```bash
# Node-level
kubectl top nodes

# Pod-level
kubectl top pods -n todo-app

# Container-level
kubectl top pods -n todo-app --containers
```

### Sample Output

```
NAME                          CPU(cores)   MEMORY(bytes)
frontend-5d8c9b7f6-abc12      45m          120Mi
frontend-5d8c9b7f6-def34      52m          115Mi
backend-7f9d8e6c5-ghi56       180m         280Mi
backend-7f9d8e6c5-jkl78       165m         290Mi
mcp-server-3a4b5c6d7-mno90    25m          55Mi
```

---

## Resource Alerts (Phase 5)

Future monitoring thresholds:

| Alert | Threshold | Action |
|-------|-----------|--------|
| High CPU | >80% for 5m | Scale up or investigate |
| High Memory | >90% for 5m | Scale up or investigate |
| Pod Restarts | >3 in 1h | Investigate health/resources |
| Pending Pods | >0 for 5m | Add node or reduce resources |

---

## Optimization Guidelines

### Reduce Frontend Image Size

```dockerfile
# Use standalone output
# next.config.js
output: 'standalone'

# Alpine base
FROM node:20-alpine
```

### Reduce Backend Image Size

```dockerfile
# Multi-stage build
# Only copy runtime dependencies
# Use slim base image
FROM python:3.13-slim
```

### Reduce MCP Server Image Size

```dockerfile
# Minimal dependencies
# Single-stage is acceptable if small enough
FROM python:3.13-slim
```

---

## Validation Checks

### Pre-Deployment

```bash
# Verify image sizes
docker images | grep todo

# Expected output:
# todo-frontend    latest   123MB
# todo-backend     latest   456MB
# todo-mcp-server  latest   78MB
```

### Post-Deployment

```bash
# Verify resource allocation
kubectl describe pods -n todo-app | grep -A 5 "Limits\|Requests"

# Verify QoS class
kubectl get pods -n todo-app -o jsonpath='{.items[*].status.qosClass}'
```

---

**Contract Version**: 1.0.0
**Created**: December 24, 2025
