# Deployment Guide

Complete guide for deploying the Evolution of Todo application using Docker Compose, Kubernetes, or Helm.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Compose (Local Development)](#docker-compose-local-development)
3. [Kubernetes with Raw Manifests](#kubernetes-with-raw-manifests)
4. [Helm Chart Deployment](#helm-chart-deployment)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Tool | Version | Installation |
|------|---------|--------------|
| Docker | 24+ | [Install Docker](https://docs.docker.com/get-docker/) |
| Docker Compose | 2.0+ | Included with Docker Desktop |
| kubectl | 1.28+ | [Install kubectl](https://kubernetes.io/docs/tasks/tools/) |
| Helm | 3.15+ | [Install Helm](https://helm.sh/docs/intro/install/) |
| Minikube | Latest | [Install Minikube](https://minikube.sigs.k8s.io/docs/start/) |

### Verify Installation

```bash
# Check all tools
docker --version          # Docker version 24+
docker compose version    # Docker Compose version 2+
kubectl version --client  # Client Version v1.28+
helm version             # version.BuildInfo{Version:"v3.15+"}
minikube version         # minikube version: v1.33+
```

### Required Secrets

You need the following credentials:

| Secret | Source | Description |
|--------|--------|-------------|
| DATABASE_URL | Neon | PostgreSQL connection string |
| GEMINI_API_KEY | Google AI | Gemini API key for AI chatbot |
| BETTER_AUTH_SECRET | Generate | JWT secret (openssl rand -hex 32) |
| NEXT_PUBLIC_OPENAI_DOMAIN_KEY | OpenAI | ChatKit domain key |

---

## Docker Compose (Local Development)

The simplest way to run the application locally.

### Step 1: Create Environment Files

```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your secrets

# Frontend environment (optional)
cp frontend/.env.example frontend/.env
# Edit frontend/.env if needed
```

### Step 2: Build and Run

```bash
# Build all images
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps
```

### Step 3: Verify

```bash
# Check health
curl http://localhost:8000/health  # Backend
curl http://localhost:8001/health  # MCP Server
curl http://localhost:3000         # Frontend

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js web UI |
| Backend | http://localhost:8000 | FastAPI REST API |
| MCP Server | http://localhost:8001 | FastMCP tools server |

---

## Kubernetes with Raw Manifests

Deploy directly to Minikube using kubectl.

### Step 1: Start Minikube

```bash
# Start with sufficient resources
minikube start --cpus=4 --memory=8192 --driver=docker

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server

# Verify
minikube status
```

### Step 2: Build and Load Images

```bash
# Use Minikube's Docker daemon
eval $(minikube docker-env)

# Build images
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend
docker build -f backend/Dockerfile.mcp -t todo-mcp-server:latest ./backend

# Verify images
docker images | grep todo

# Return to host Docker
eval $(minikube docker-env --unset)
```

### Step 3: Create Secrets

```bash
# Create namespace
kubectl apply -f k8s/00-namespace.yaml

# Create secrets from .env file
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="your-connection-string" \
  --from-literal=GEMINI_API_KEY="your-api-key" \
  --from-literal=BETTER_AUTH_SECRET="your-secret" \
  --from-literal=NEXT_PUBLIC_OPENAI_DOMAIN_KEY="your-key" \
  -n todo-app

# Or from file
kubectl create secret generic app-secrets \
  --from-env-file=backend/.env \
  -n todo-app
```

### Step 4: Deploy

```bash
# Apply all manifests
kubectl apply -f k8s/ -n todo-app

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=frontend -n todo-app --timeout=120s
kubectl wait --for=condition=ready pod -l app=backend -n todo-app --timeout=120s
kubectl wait --for=condition=ready pod -l app=mcp-server -n todo-app --timeout=120s

# Check status
kubectl get pods -n todo-app
kubectl get svc -n todo-app
```

### Step 5: Configure Access

```bash
# Get Minikube IP
MINIKUBE_IP=$(minikube ip)

# Add to /etc/hosts
echo "$MINIKUBE_IP todo.local" | sudo tee -a /etc/hosts

# Access the application
open http://todo.local  # macOS
xdg-open http://todo.local  # Linux
```

### Useful Commands

```bash
# View pod logs
kubectl logs -f deployment/backend -n todo-app

# Describe pod for debugging
kubectl describe pod <pod-name> -n todo-app

# Get events
kubectl get events -n todo-app --sort-by='.lastTimestamp'

# Scale deployment
kubectl scale deployment/frontend --replicas=3 -n todo-app

# Delete all resources
kubectl delete -f k8s/ -n todo-app
```

---

## Helm Chart Deployment

The recommended approach for production-like deployments.

### Step 1: Prepare Environment

```bash
# Start Minikube (if not running)
minikube start --cpus=4 --memory=8192 --driver=docker
minikube addons enable ingress

# Build and load images (same as above)
eval $(minikube docker-env)
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend
docker build -f backend/Dockerfile.mcp -t todo-mcp-server:latest ./backend
eval $(minikube docker-env --unset)
```

### Step 2: Review Values

```bash
# Check default values
cat helm/todo-app/values.yaml

# Check dev values (for Minikube)
cat helm/todo-app/values-dev.yaml
```

### Step 3: Install Chart

```bash
# Install with dev values
helm install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --values helm/todo-app/values-dev.yaml \
  --set secrets.databaseUrl="postgresql://user:pass@host:5432/db" \
  --set secrets.geminiApiKey="your-gemini-key" \
  --set secrets.betterAuthSecret="$(openssl rand -hex 32)" \
  --set secrets.openaiDomainKey="your-domain-key"

# Check deployment
helm status todo-app -n todo-app
kubectl get pods -n todo-app
```

### Step 4: Upgrade

```bash
# Change replica count or other values
helm upgrade todo-app ./helm/todo-app \
  --namespace todo-app \
  --values helm/todo-app/values-dev.yaml \
  --set frontend.replicaCount=3

# Rollback if needed
helm rollback todo-app 1 -n todo-app
```

### Step 5: Uninstall

```bash
helm uninstall todo-app -n todo-app
kubectl delete namespace todo-app
```

### Environment-Specific Deployments

```bash
# Development (Minikube)
helm install todo-app ./helm/todo-app -f helm/todo-app/values-dev.yaml -n todo-app

# Staging
helm install todo-app ./helm/todo-app -f helm/todo-app/values-staging.yaml -n todo-app

# Production
helm install todo-app ./helm/todo-app -f helm/todo-app/values-prod.yaml -n todo-app
```

---

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# AI/LLM
GEMINI_API_KEY=your-gemini-api-key

# Authentication
BETTER_AUTH_SECRET=your-32-byte-hex-secret

# MCP Server (internal)
MCP_SERVER_URL=http://mcp-server:8001
```

### Frontend (.env)

```bash
# API URLs (set by ConfigMap in K8s)
NEXT_PUBLIC_API_URL=http://backend:8000
NEXT_PUBLIC_MCP_URL=http://mcp-server:8001

# ChatKit
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key

# Telemetry
NEXT_TELEMETRY_DISABLED=1
```

### Generate Secrets

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -hex 32

# Generate random password
openssl rand -base64 24
```

---

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl get pods -n todo-app

# Get events
kubectl get events -n todo-app --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod <pod-name> -n todo-app

# Check logs
kubectl logs <pod-name> -n todo-app --previous
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| ImagePullBackOff | Image not in Minikube | Build with `eval $(minikube docker-env)` |
| CrashLoopBackOff | Application error | Check logs: `kubectl logs <pod> -n todo-app` |
| Pending | No resources | Check resources: `kubectl describe pod` |
| Service unavailable | Wrong service type | Use NodePort for Minikube |

### Ingress Not Working

```bash
# Check ingress controller
minikube addons enable ingress
kubectl get pods -n ingress-nginx

# Check ingress status
kubectl get ingress -n todo-app
kubectl describe ingress todo-app -n todo-app

# Verify /etc/hosts
cat /etc/hosts | grep todo.local
```

### Database Connection

```bash
# Check secret is created
kubectl get secrets -n todo-app

# Verify DATABASE_URL format
# postgresql://user:password@host:5432/database?sslmode=require

# Test connection from pod
kubectl exec -it <backend-pod> -n todo-app -- python -c "
from sqlalchemy import create_engine
import os
engine = create_engine(os.environ['DATABASE_URL'])
print('Connection successful!')
"
```

### Resource Issues

```bash
# Check resource usage
kubectl top pods -n todo-app

# Check node resources
kubectl describe node minikube

# Increase Minikube resources
minikube stop
minikube start --cpus=4 --memory=8192
```

---

## Quick Reference

### Docker Compose

```bash
docker compose up -d      # Start
docker compose ps         # Status
docker compose logs -f    # Logs
docker compose down       # Stop
```

### Kubernetes

```bash
kubectl apply -f k8s/           # Deploy
kubectl get pods -n todo-app    # Status
kubectl logs -f <pod>           # Logs
kubectl delete -f k8s/          # Remove
```

### Helm

```bash
helm install todo-app ./helm/todo-app     # Install
helm status todo-app                       # Status
helm upgrade todo-app ./helm/todo-app     # Upgrade
helm uninstall todo-app                   # Remove
```

---

**Version**: 1.0.0
**Last Updated**: December 25, 2025
**Phase**: Phase 4 - Local Kubernetes Deployment
