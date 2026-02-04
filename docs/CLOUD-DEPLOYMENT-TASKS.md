# Cloud Deployment Guide - Remaining Tasks

Complete guide for the 8 remaining tasks to deploy TaskWhisper to production.

## Remaining Tasks Overview

| Task | Description | Status |
|------|-------------|--------|
| T143 | Configure GitHub repository secrets | ⬜ |
| T144-A | Verify CI/CD pipeline < 10 minutes | ⬜ |
| T144-B | Measure pipeline execution times | ⬜ |
| T154 | Deploy to DOKS using Helm | ⬜ |
| T155 | Create Redpanda Cloud account/cluster | ⬜ |
| T156 | Create Kafka topics in Redpanda | ⬜ |
| T160 | Test event flow on cloud | ⬜ |
| T161 | Monitor consumer lag in Redpanda | ⬜ |

---

## T143: Configure GitHub Repository Secrets

### Required Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | DO API token | See below |
| `DOCKER_USERNAME` | Docker Hub username | Your Docker Hub account |
| `DOCKER_PASSWORD` | Docker Hub password/token | Docker Hub → Account Settings → Security |
| `DATABASE_URL` | Neon PostgreSQL URL | Neon dashboard |
| `GEMINI_API_KEY` | Google AI API key | See below |
| `BETTER_AUTH_SECRET` | Auth secret | `openssl rand -base64 32` |
| `REDPANDA_BROKERS` | Redpanda bootstrap servers | After T155 |

### Step 1: Get DigitalOcean Access Token

1. Go to https://cloud.digitalocean.com/account/api/tokens
2. Click "Generate New Token"
3. Name: `github-actions-doks`
4. Select: Read + Write
5. Copy the token (shown only once!)

### Step 2: Get Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Select project or create new
4. Copy the API key

### Step 3: Get Docker Hub Token

1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name: `github-actions`
4. Permissions: Read, Write, Delete
5. Copy the token

### Step 4: Add Secrets to GitHub

1. Go to your repo → Settings → Secrets and variables → Actions
2. Click "New repository secret" for each:

```
DIGITALOCEAN_ACCESS_TOKEN = <your-do-token>
DOCKER_USERNAME = <your-dockerhub-username>
DOCKER_PASSWORD = <your-dockerhub-token>
DATABASE_URL = postgresql+asyncpg://user:pass@host/db?sslmode=require
GEMINI_API_KEY = <your-gemini-key>
BETTER_AUTH_SECRET = <generated-secret>
```

### Verification

```bash
# Check secrets are set (GitHub CLI)
gh secret list
```

---

## T144-A & T144-B: Verify CI/CD Pipeline

### Run Pipeline

1. Push to `main` or create PR
2. Go to Actions tab
3. Watch the workflow run

### Expected Timing

| Stage | Target | Actual |
|-------|--------|--------|
| Build Frontend | < 3 min | ___ |
| Build Backend | < 2 min | ___ |
| Build MCP | < 1 min | ___ |
| Push Images | < 2 min | ___ |
| Deploy to DOKS | < 2 min | ___ |
| **Total** | **< 10 min** | ___ |

### Measure Times

```bash
# View workflow run times
gh run list --limit 5

# View specific run
gh run view <run-id>
```

---

## T154: Deploy Application to DOKS

### Prerequisites

- DigitalOcean account with billing enabled
- `doctl` CLI installed
- DOKS cluster created

### Step 1: Install doctl

```bash
# Linux
wget https://github.com/digitalocean/doctl/releases/download/v1.100.0/doctl-1.100.0-linux-amd64.tar.gz
tar xf doctl-1.100.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Authenticate
doctl auth init
# Paste your DO access token
```

### Step 2: Create DOKS Cluster

```bash
# Create cluster (or use existing)
doctl kubernetes cluster create todo-cluster \
  --region nyc1 \
  --node-pool "name=default;size=s-2vcpu-4gb;count=3" \
  --wait

# Get kubeconfig
doctl kubernetes cluster kubeconfig save todo-cluster

# Verify
kubectl get nodes
```

### Step 3: Install Dapr on DOKS

```bash
dapr init -k --wait
dapr status -k
```

### Step 4: Create Namespaces & Secrets

```bash
kubectl create namespace todo-app

# Create secrets
kubectl create secret generic app-secrets \
  --namespace todo-app \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=gemini-api-key="$GEMINI_API_KEY" \
  --from-literal=better-auth-secret="$BETTER_AUTH_SECRET"
```

### Step 5: Deploy with Helm

```bash
helm upgrade --install todo-app ./helm/todo-app \
  --namespace todo-app \
  --set global.environment=production \
  --set frontend.image.repository=yourdockerhub/todo-frontend \
  --set frontend.image.tag=latest \
  --set backend.image.repository=yourdockerhub/todo-backend \
  --set backend.image.tag=latest \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=todo.yourdomain.com \
  --wait --timeout=10m
```

### Step 6: Verify Deployment

```bash
kubectl get pods -n todo-app
kubectl get svc -n todo-app
kubectl get ingress -n todo-app
```

---

## T155: Create Redpanda Cloud Account & Cluster

### Step 1: Sign Up

1. Go to https://redpanda.com/try-redpanda
2. Click "Start Free"
3. Sign up with email or GitHub

### Step 2: Create Cluster

1. Click "Create Cluster"
2. Settings:
   - **Name**: `todo-production`
   - **Cloud Provider**: AWS (or your preference)
   - **Region**: `us-east-1` (or closest to your DOKS)
   - **Tier**: Serverless (free tier) or Dedicated
3. Click "Create"
4. Wait for cluster to be ready (~5 minutes)

### Step 3: Get Connection Details

1. Click on your cluster
2. Go to "Overview" tab
3. Copy:
   - **Bootstrap Server**: `xxx.cloud.redpanda.com:9092`
   - **SASL Username**: (from Security tab)
   - **SASL Password**: (from Security tab)

### Step 4: Save Credentials

Add to GitHub secrets:
```
REDPANDA_BROKERS = xxx.cloud.redpanda.com:9092
REDPANDA_USERNAME = <sasl-username>
REDPANDA_PASSWORD = <sasl-password>
```

---

## T156: Create Kafka Topics in Redpanda

### Using Redpanda Console

1. Go to your cluster in Redpanda Cloud
2. Click "Topics" tab
3. Click "Create Topic" for each:

| Topic Name | Partitions | Retention |
|------------|------------|-----------|
| `task-events` | 3 | 7 days |
| `reminders` | 3 | 7 days |
| `audit-events` | 3 | 30 days |
| `task-updates` | 3 | 1 day |

### Using rpk CLI

```bash
# Install rpk
curl -LO https://github.com/redpanda-data/redpanda/releases/latest/download/rpk-linux-amd64.zip
unzip rpk-linux-amd64.zip
sudo mv rpk /usr/local/bin/

# Configure
rpk profile create todo-cloud \
  --set brokers=xxx.cloud.redpanda.com:9092 \
  --set tls.enabled=true \
  --set sasl.mechanism=SCRAM-SHA-256 \
  --set sasl.user=$REDPANDA_USERNAME \
  --set sasl.password=$REDPANDA_PASSWORD

# Create topics
rpk topic create task-events --partitions 3
rpk topic create reminders --partitions 3
rpk topic create audit-events --partitions 3
rpk topic create task-updates --partitions 3

# Verify
rpk topic list
```

---

## T160: Test Event Flow on Cloud

### Step 1: Update Dapr Component for Redpanda

Create `dapr-components/pubsub-redpanda.yaml`:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
  namespace: todo-app
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "xxx.cloud.redpanda.com:9092"
    - name: authType
      value: "password"
    - name: saslUsername
      secretKeyRef:
        name: redpanda-secret
        key: username
    - name: saslPassword
      secretKeyRef:
        name: redpanda-secret
        key: password
    - name: saslMechanism
      value: "SCRAM-SHA-256"
    - name: initialOffset
      value: "oldest"
```

### Step 2: Create Redpanda Secret

```bash
kubectl create secret generic redpanda-secret \
  --namespace todo-app \
  --from-literal=username=$REDPANDA_USERNAME \
  --from-literal=password=$REDPANDA_PASSWORD
```

### Step 3: Apply and Test

```bash
# Apply component
kubectl apply -f dapr-components/pubsub-redpanda.yaml

# Restart backend to pick up new config
kubectl rollout restart deployment/todo-app-backend -n todo-app

# Create a task via API
curl -X POST https://todo.yourdomain.com/api/user123/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test cloud event", "priority": "high"}'
```

### Step 4: Verify in Redpanda Console

1. Go to Redpanda Cloud → Topics → task-events
2. Click "Messages" tab
3. Should see the event from your task creation

---

## T161: Monitor Consumer Lag in Redpanda

### Using Redpanda Console

1. Go to your cluster
2. Click "Consumer Groups" tab
3. Find your consumer groups:
   - `notification-service-group`
   - `audit-service-group`
   - `recurring-task-service-group`
4. Check "Lag" column - should be 0 or low

### Set Up Alerts

1. Go to "Alerts" tab
2. Create alert:
   - **Name**: High Consumer Lag
   - **Condition**: Consumer lag > 1000
   - **Notification**: Email/Slack

### Using rpk

```bash
# Check consumer groups
rpk group list

# Check specific group lag
rpk group describe notification-service-group
```

---

## Verification Checklist

After completing all tasks:

- [ ] GitHub Actions workflow runs successfully
- [ ] All pods running in DOKS (`kubectl get pods -n todo-app`)
- [ ] Frontend accessible via domain
- [ ] Backend health check passes
- [ ] Events appearing in Redpanda topics
- [ ] Consumer lag is low (< 100)
- [ ] Grafana dashboards showing metrics

---

## Troubleshooting

### CI/CD Fails

```bash
# Check workflow logs
gh run view <run-id> --log-failed
```

### Pods Not Starting

```bash
kubectl describe pod <pod-name> -n todo-app
kubectl logs <pod-name> -n todo-app
```

### Events Not Flowing

```bash
# Check Dapr sidecar
kubectl logs <backend-pod> -c daprd -n todo-app

# Check component status
dapr components -k -n todo-app
```

### Redpanda Connection Issues

```bash
# Test connectivity
rpk cluster info

# Check TLS
openssl s_client -connect xxx.cloud.redpanda.com:9092
```

---

## Cost Estimates

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| DigitalOcean DOKS (3 nodes) | s-2vcpu-4gb | ~$60 |
| Redpanda Cloud | Serverless | Free tier / ~$0-50 |
| Neon PostgreSQL | Free tier | $0 |
| Docker Hub | Free | $0 |
| **Total** | | **~$60-110/month** |

---

## Quick Reference

### All Required Secrets

```bash
# GitHub Secrets
DIGITALOCEAN_ACCESS_TOKEN
DOCKER_USERNAME
DOCKER_PASSWORD
DATABASE_URL
GEMINI_API_KEY
BETTER_AUTH_SECRET
REDPANDA_BROKERS
REDPANDA_USERNAME
REDPANDA_PASSWORD
```

### Key URLs

- DigitalOcean: https://cloud.digitalocean.com
- Redpanda Cloud: https://cloud.redpanda.com
- Neon: https://console.neon.tech
- Google AI Studio: https://aistudio.google.com
- Docker Hub: https://hub.docker.com
