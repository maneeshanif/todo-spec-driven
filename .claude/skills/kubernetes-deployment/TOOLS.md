# Kubernetes Deployment Skill - Tools Reference

## Required CLI Tools

### kubectl

```bash
# Check kubectl installation
kubectl version --client

# Check cluster connection
kubectl cluster-info

# Check kubectl config
kubectl config view
kubectl config current-context
```

### minikube (Local Development)

```bash
# Check minikube installation
minikube version

# Start cluster
minikube start --nodes=3 --cpus=2 --memory=4096

# Get cluster status
minikube status
```

## kubectl Commands Reference

### Cluster Management

```bash
# View cluster info
kubectl cluster-info

# View nodes
kubectl get nodes
kubectl get nodes -o wide

# View namespaces
kubectl get namespaces

# Create namespace
kubectl create namespace todo-app

# Set default namespace
kubectl config set-context --current --namespace=todo-app
```

### Deployment Commands

```bash
# Apply manifest
kubectl apply -f manifest.yaml

# Apply directory
kubectl apply -f k8s/

# Apply with kustomize
kubectl apply -k k8s/overlays/dev

# Delete resources
kubectl delete -f manifest.yaml

# Rollout commands
kubectl rollout status deployment/backend
kubectl rollout history deployment/backend
kubectl rollout undo deployment/backend
kubectl rollout restart deployment/backend
```

### Pod Commands

```bash
# List pods
kubectl get pods
kubectl get pods -o wide
kubectl get pods -l app=backend

# Describe pod
kubectl describe pod <pod-name>

# View logs
kubectl logs <pod-name>
kubectl logs -f <pod-name>
kubectl logs <pod-name> -c <container-name>
kubectl logs --previous <pod-name>

# Execute in pod
kubectl exec -it <pod-name> -- /bin/sh
kubectl exec -it <pod-name> -c <container> -- /bin/sh

# Port forward
kubectl port-forward pod/<pod-name> 8080:8000
kubectl port-forward svc/backend 8080:8000
```

### Service Commands

```bash
# List services
kubectl get services
kubectl get svc

# Describe service
kubectl describe svc backend

# Get endpoints
kubectl get endpoints

# Expose deployment
kubectl expose deployment backend --port=8000 --type=NodePort
```

### ConfigMap & Secret Commands

```bash
# Create configmap
kubectl create configmap todo-config --from-literal=log-level=INFO

# Create from file
kubectl create configmap app-config --from-file=config.yaml

# View configmap
kubectl get configmap todo-config -o yaml

# Create secret
kubectl create secret generic todo-secrets \
  --from-literal=database-url='postgresql://...' \
  --from-literal=auth-secret='secret123'

# View secrets
kubectl get secrets
kubectl get secret todo-secrets -o jsonpath='{.data.database-url}' | base64 -d
```

### Resource Inspection

```bash
# Get all resources
kubectl get all
kubectl get all -n todo-app

# Wide output
kubectl get pods -o wide

# YAML output
kubectl get deployment backend -o yaml

# JSON output
kubectl get pod <pod-name> -o jsonpath='{.status.podIP}'

# Custom columns
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase
```

### Debugging Commands

```bash
# Describe for events
kubectl describe pod <pod-name>

# Get events
kubectl get events --sort-by=.metadata.creationTimestamp

# Resource usage
kubectl top nodes
kubectl top pods

# Check logs across pods
kubectl logs -l app=backend --all-containers

# Debug with temporary pod
kubectl run debug --rm -it --image=busybox -- /bin/sh
```

## Kustomize Commands

```bash
# Build kustomization
kubectl kustomize k8s/overlays/dev

# Apply kustomization
kubectl apply -k k8s/overlays/dev

# Delete kustomization
kubectl delete -k k8s/overlays/dev

# View diff
kubectl diff -k k8s/overlays/dev
```

## Minikube Commands

```bash
# Start cluster
minikube start
minikube start --nodes=3 --driver=docker

# Stop cluster
minikube stop

# Delete cluster
minikube delete

# Dashboard
minikube dashboard

# Service URL
minikube service frontend --url
minikube service frontend -n todo-app --url

# SSH into node
minikube ssh
minikube ssh -n minikube-m02

# Add ingress
minikube addons enable ingress

# Load local image
minikube image load evolution-todo/backend:latest

# Build image in minikube
eval $(minikube docker-env)
docker build -t myapp:latest .
```

## Resource Configuration Patterns

### Deployment Spec

```yaml
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: backend
          resources:
            limits:
              cpu: "500m"
              memory: "512Mi"
            requests:
              cpu: "250m"
              memory: "256Mi"
```

### Probes Configuration

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /health/started
    port: 8000
  failureThreshold: 30
  periodSeconds: 10
```

### Environment Variables

```yaml
env:
  # Direct value
  - name: LOG_LEVEL
    value: "INFO"

  # From ConfigMap
  - name: API_URL
    valueFrom:
      configMapKeyRef:
        name: todo-config
        key: api-url

  # From Secret
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: todo-secrets
        key: database-url

  # From field
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
```

### Volume Configuration

```yaml
volumes:
  - name: config-volume
    configMap:
      name: todo-config
  - name: secret-volume
    secret:
      secretName: todo-secrets
  - name: empty-dir
    emptyDir: {}

containers:
  - volumeMounts:
      - name: config-volume
        mountPath: /app/config
        readOnly: true
```

## Labels and Annotations

### Standard Labels

```yaml
metadata:
  labels:
    app.kubernetes.io/name: backend
    app.kubernetes.io/instance: todo-backend
    app.kubernetes.io/version: "1.0.0"
    app.kubernetes.io/component: api
    app.kubernetes.io/part-of: evolution-todo
    app.kubernetes.io/managed-by: kustomize
    environment: production
```

### Common Annotations

```yaml
metadata:
  annotations:
    kubernetes.io/change-cause: "Updated image to v1.0.1"
    prometheus.io/scrape: "true"
    prometheus.io/port: "8000"
```

## Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: todo-app
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - port: 8000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: mcp-server
      ports:
        - port: 8001
```
