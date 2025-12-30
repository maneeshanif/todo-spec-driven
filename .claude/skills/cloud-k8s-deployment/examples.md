# Cloud Kubernetes Deployment Examples

## Example 1: Create DOKS Cluster with doctl

```bash
#!/bin/bash
# scripts/create-doks-cluster.sh

# Create production cluster
doctl kubernetes cluster create todo-production \
  --region nyc1 \
  --version 1.29.1-do.0 \
  --node-pool "name=default;size=s-2vcpu-4gb;count=3;auto-scale=true;min-nodes=2;max-nodes=5" \
  --ha \
  --surge-upgrade \
  --wait

# Get kubeconfig
doctl kubernetes cluster kubeconfig save todo-production

# Verify
kubectl get nodes
kubectl cluster-info
```

## Example 2: Terraform DOKS Configuration

```hcl
# terraform/digitalocean/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    endpoint                    = "nyc3.digitaloceanspaces.com"
    key                         = "terraform/todo/terraform.tfstate"
    bucket                      = "todo-terraform-state"
    region                      = "us-east-1"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
  }
}

variable "do_token" {
  description = "DigitalOcean API token"
  sensitive   = true
}

variable "environment" {
  description = "Environment name"
  default     = "production"
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_kubernetes_cluster" "todo" {
  name    = "todo-${var.environment}"
  region  = "nyc1"
  version = "1.29.1-do.0"
  ha      = var.environment == "production"

  node_pool {
    name       = "default"
    size       = var.environment == "production" ? "s-2vcpu-4gb" : "s-1vcpu-2gb"
    auto_scale = true
    min_nodes  = var.environment == "production" ? 2 : 1
    max_nodes  = var.environment == "production" ? 5 : 3

    labels = {
      environment = var.environment
    }
  }

  maintenance_policy {
    start_time = "04:00"
    day        = "sunday"
  }
}

# Container Registry
resource "digitalocean_container_registry" "todo" {
  name                   = "todo-registry"
  subscription_tier_slug = var.environment == "production" ? "professional" : "basic"
  region                 = "nyc3"
}

# Connect registry to cluster
resource "digitalocean_container_registry_docker_credentials" "todo" {
  registry_name = digitalocean_container_registry.todo.name
}

output "cluster_endpoint" {
  value = digitalocean_kubernetes_cluster.todo.endpoint
}

output "kubeconfig" {
  value     = digitalocean_kubernetes_cluster.todo.kube_config[0].raw_config
  sensitive = true
}
```

## Example 3: Install Prerequisites Script

```bash
#!/bin/bash
# scripts/install-k8s-prerequisites.sh

set -e

echo "Installing NGINX Ingress Controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.publishService.enabled=true \
  --wait

echo "Installing cert-manager..."
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true \
  --wait

echo "Creating Let's Encrypt ClusterIssuer..."
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF

echo "Installing Dapr..."
helm repo add dapr https://dapr.github.io/helm-charts/
helm repo update
helm install dapr dapr/dapr \
  --namespace dapr-system \
  --create-namespace \
  --wait

echo "Installing Strimzi Kafka Operator..."
helm repo add strimzi https://strimzi.io/charts/
helm repo update
helm install strimzi-kafka-operator strimzi/strimzi-kafka-operator \
  --namespace kafka \
  --create-namespace

echo "All prerequisites installed!"
```

## Example 4: Production Values File

```yaml
# helm/evolution-todo/values-production.yaml
global:
  environment: production
  domain: todo.yourdomain.com
  image:
    registry: ghcr.io
    repository: your-org/evolution-todo
    tag: latest
    pullPolicy: Always

# Ingress with TLS
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
  hosts:
    - host: todo.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
          service: frontend
          port: 3000
        - path: /api
          pathType: Prefix
          service: backend
          port: 8000
        - path: /ws
          pathType: Prefix
          service: websocket-service
          port: 8005
  tls:
    - secretName: todo-tls
      hosts:
        - todo.yourdomain.com

# Backend configuration
backend:
  replicas: 3
  image:
    name: backend
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
  dapr:
    enabled: true
    appId: backend
    appPort: 8000

# Frontend configuration
frontend:
  replicas: 2
  image:
    name: frontend
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5

# Microservices
notificationService:
  enabled: true
  replicas: 2
  dapr:
    enabled: true
    appId: notification-service
    appPort: 8002

recurringService:
  enabled: true
  replicas: 2
  dapr:
    enabled: true
    appId: recurring-service
    appPort: 8003

websocketService:
  enabled: true
  replicas: 2
  dapr:
    enabled: true
    appId: websocket-service
    appPort: 8005

# External services
kafka:
  enabled: true
  external: true
  brokers: ""  # Set via --set

postgresql:
  enabled: false
  external:
    enabled: true

redis:
  enabled: true
  architecture: standalone
  auth:
    enabled: false
  master:
    persistence:
      size: 5Gi
```

## Example 5: Deploy Script

```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

NAMESPACE="todo-app"
RELEASE_NAME="evolution-todo"
VERSION=${1:-"latest"}

echo "Deploying version: $VERSION to production"

# Create namespace if not exists
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Create/update secrets
kubectl create secret generic todo-secrets \
  --namespace $NAMESPACE \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=GEMINI_API_KEY="$GEMINI_API_KEY" \
  --from-literal=BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  --from-literal=REDPANDA_BROKERS="$REDPANDA_BROKERS" \
  --dry-run=client -o yaml | kubectl apply -f -

# Deploy with Helm
helm upgrade --install $RELEASE_NAME ./helm/evolution-todo \
  --namespace $NAMESPACE \
  --values ./helm/evolution-todo/values-production.yaml \
  --set global.image.tag=$VERSION \
  --set kafka.brokers="$REDPANDA_BROKERS" \
  --wait \
  --timeout 15m

# Verify deployments
echo "Verifying deployments..."
kubectl rollout status deployment/backend -n $NAMESPACE --timeout=5m
kubectl rollout status deployment/frontend -n $NAMESPACE --timeout=5m

# Show status
kubectl get pods -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

echo "Deployment complete!"
```

## Example 6: Monitoring Setup

```yaml
# k8s/monitoring/prometheus-stack.yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: kube-prometheus-stack
  namespace: monitoring
spec:
  interval: 1h
  chart:
    spec:
      chart: kube-prometheus-stack
      version: "55.x"
      sourceRef:
        kind: HelmRepository
        name: prometheus-community
        namespace: flux-system
  values:
    prometheus:
      prometheusSpec:
        serviceMonitorSelectorNilUsesHelmValues: false
        podMonitorSelectorNilUsesHelmValues: false
        retention: 15d
        storageSpec:
          volumeClaimTemplate:
            spec:
              accessModes: ["ReadWriteOnce"]
              resources:
                requests:
                  storage: 50Gi

    grafana:
      adminPassword: ""  # Set via secret
      persistence:
        enabled: true
        size: 10Gi
      dashboardProviders:
        dashboardproviders.yaml:
          apiVersion: 1
          providers:
            - name: 'default'
              folder: ''
              type: file
              options:
                path: /var/lib/grafana/dashboards

    alertmanager:
      config:
        route:
          receiver: 'slack'
          routes:
            - match:
                severity: critical
              receiver: 'slack'
        receivers:
          - name: 'slack'
            slack_configs:
              - api_url: ''  # Set via secret
                channel: '#alerts'
```

## Example 7: Health Check Script

```bash
#!/bin/bash
# scripts/health-check.sh

NAMESPACE="todo-app"
DOMAIN="todo.yourdomain.com"

echo "Checking cluster health..."

# Check nodes
echo "=== Nodes ==="
kubectl get nodes

# Check pods
echo -e "\n=== Pods ==="
kubectl get pods -n $NAMESPACE

# Check services
echo -e "\n=== Services ==="
kubectl get svc -n $NAMESPACE

# Check ingress
echo -e "\n=== Ingress ==="
kubectl get ingress -n $NAMESPACE

# Check endpoints
echo -e "\n=== Health Endpoints ==="
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/health
echo " - Backend health"

curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/
echo " - Frontend"

# Check Dapr
echo -e "\n=== Dapr Status ==="
kubectl get pods -n dapr-system

# Check Kafka
echo -e "\n=== Kafka Status ==="
kubectl get kafka -n kafka
```
