# Cloud Deployment Guide

**Phase**: Phase 5 - Advanced Cloud Deployment

## Overview

This guide covers deploying TaskWhisper to DigitalOcean Kubernetes (DOKS) with Redpanda Cloud for event streaming.

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| DigitalOcean account | With billing enabled |
| Docker Hub account | For container registry |
| Redpanda Cloud account | For managed Kafka |
| Neon account | For PostgreSQL (or existing DB) |
| Domain name | Optional, for production |

## Quick Start

```bash
# 1. Test locally first
./scripts/local-dev/start-all.sh
./scripts/local-dev/status.sh

# 2. Configure GitHub secrets (see CLOUD-DEPLOYMENT-TASKS.md)

# 3. Push to trigger CI/CD
git push origin main

# 4. Or deploy manually
./scripts/create-doks-cluster.sh production
```

## Deployment Flow

```
Local Testing → GitHub Push → CI/CD Pipeline → DOKS Deployment
     ↓              ↓              ↓                ↓
  Minikube      Secrets      Build/Push        Helm Install
```

## Required Secrets

Configure these in GitHub → Settings → Secrets:

| Secret | Source |
|--------|--------|
| `DIGITALOCEAN_ACCESS_TOKEN` | DO API → Tokens |
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub → Security → Access Token |
| `DATABASE_URL` | Neon dashboard |
| `GEMINI_API_KEY` | Google AI Studio |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `REDPANDA_BROKERS` | Redpanda Cloud cluster |
| `REDPANDA_USERNAME` | Redpanda Cloud → Security |
| `REDPANDA_PASSWORD` | Redpanda Cloud → Security |

## Detailed Steps

See **[CLOUD-DEPLOYMENT-TASKS.md](./CLOUD-DEPLOYMENT-TASKS.md)** for:
- Step-by-step instructions for each task
- How to get each API key/token
- Verification commands
- Troubleshooting

## Manual Deployment

### 1. Create DOKS Cluster

```bash
doctl kubernetes cluster create todo-cluster \
  --region nyc1 \
  --node-pool "name=default;size=s-2vcpu-4gb;count=3" \
  --wait

doctl kubernetes cluster kubeconfig save todo-cluster
```

### 2. Install Dapr

```bash
dapr init -k --wait
```

### 3. Deploy Application

```bash
helm upgrade --install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  -f helm/todo-app/values-prod.yaml \
  --set secrets.databaseUrl="$DATABASE_URL" \
  --set secrets.geminiApiKey="$GEMINI_API_KEY" \
  --wait
```

### 4. Verify

```bash
kubectl get pods -n todo-app
kubectl get svc -n todo-app
```

## Post-Deployment

1. **Configure DNS** - Point domain to LoadBalancer IP
2. **Enable TLS** - Install cert-manager for HTTPS
3. **Set up monitoring** - Configure Grafana alerts
4. **Run smoke tests** - Verify all endpoints

## Cost Estimate

| Service | Monthly |
|---------|---------|
| DOKS (3 nodes) | ~$60 |
| Redpanda Cloud | $0-50 |
| Neon PostgreSQL | $0 |
| **Total** | **~$60-110** |

## Related Docs

- [Local Development Guide](./LOCAL-DEV-GUIDE.md) - Test locally first
- [Cloud Deployment Tasks](./CLOUD-DEPLOYMENT-TASKS.md) - Detailed task guide
- [Dapr Integration](./DAPR-INTEGRATION.md) - Event-driven setup
- [Kafka Setup](./KAFKA-SETUP.md) - Kafka/Redpanda config
