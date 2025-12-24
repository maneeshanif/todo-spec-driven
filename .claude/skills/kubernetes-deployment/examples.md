# Kubernetes Deployment Skill - Examples

## Example 1: Namespace Configuration

```yaml
# k8s/base/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: todo-app
  labels:
    app.kubernetes.io/name: evolution-todo
    app.kubernetes.io/part-of: todo-application
    environment: development
```

## Example 2: Backend Deployment

```yaml
# k8s/base/backend/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: todo-app
  labels:
    app: backend
    app.kubernetes.io/name: backend
    app.kubernetes.io/component: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
        app.kubernetes.io/name: backend
    spec:
      containers:
        - name: backend
          image: evolution-todo/backend:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8000
              name: http
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: todo-secrets
                  key: database-url
            - name: BETTER_AUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: todo-secrets
                  key: auth-secret
            - name: GEMINI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: todo-secrets
                  key: gemini-api-key
            - name: MCP_SERVER_URL
              value: "http://mcp-server:8001"
          resources:
            limits:
              cpu: "500m"
              memory: "512Mi"
            requests:
              cpu: "250m"
              memory: "256Mi"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
```

## Example 3: Backend Service

```yaml
# k8s/base/backend/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: todo-app
  labels:
    app: backend
spec:
  type: ClusterIP
  ports:
    - port: 8000
      targetPort: 8000
      protocol: TCP
      name: http
  selector:
    app: backend
```

## Example 4: Frontend Deployment

```yaml
# k8s/base/frontend/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: todo-app
  labels:
    app: frontend
    app.kubernetes.io/name: frontend
    app.kubernetes.io/component: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
        app.kubernetes.io/name: frontend
    spec:
      containers:
        - name: frontend
          image: evolution-todo/frontend:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NEXT_PUBLIC_API_URL
              valueFrom:
                configMapKeyRef:
                  name: todo-config
                  key: api-url
            - name: NEXT_PUBLIC_AUTH_URL
              valueFrom:
                configMapKeyRef:
                  name: todo-config
                  key: auth-url
          resources:
            limits:
              cpu: "500m"
              memory: "512Mi"
            requests:
              cpu: "250m"
              memory: "256Mi"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

## Example 5: Frontend Service with NodePort

```yaml
# k8s/base/frontend/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: todo-app
  labels:
    app: frontend
spec:
  type: NodePort
  ports:
    - port: 3000
      targetPort: 3000
      nodePort: 30300
      protocol: TCP
      name: http
  selector:
    app: frontend
```

## Example 6: MCP Server Deployment

```yaml
# k8s/base/mcp-server/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
  namespace: todo-app
  labels:
    app: mcp-server
    app.kubernetes.io/name: mcp-server
    app.kubernetes.io/component: mcp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
        - name: mcp-server
          image: evolution-todo/mcp-server:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8001
              name: http
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: todo-secrets
                  key: database-url
          resources:
            limits:
              cpu: "250m"
              memory: "256Mi"
            requests:
              cpu: "100m"
              memory: "128Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8001
            initialDelaySeconds: 10
            periodSeconds: 30
```

## Example 7: AI Agent Deployment

```yaml
# k8s/base/ai-agent/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-agent
  namespace: todo-app
  labels:
    app: ai-agent
    app.kubernetes.io/name: ai-agent
    app.kubernetes.io/component: agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ai-agent
  template:
    metadata:
      labels:
        app: ai-agent
    spec:
      containers:
        - name: ai-agent
          image: evolution-todo/ai-agent:latest
          imagePullPolicy: IfNotPresent
          env:
            - name: GEMINI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: todo-secrets
                  key: gemini-api-key
            - name: MCP_SERVER_URL
              value: "http://mcp-server:8001"
          resources:
            limits:
              cpu: "500m"
              memory: "512Mi"
            requests:
              cpu: "250m"
              memory: "256Mi"
```

## Example 8: ConfigMap

```yaml
# k8s/base/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: todo-config
  namespace: todo-app
  labels:
    app.kubernetes.io/name: evolution-todo
data:
  api-url: "http://backend:8000"
  auth-url: "http://backend:8000/auth"
  mcp-url: "http://mcp-server:8001"
  log-level: "INFO"
```

## Example 9: Secrets (Base64 Encoded)

```yaml
# k8s/base/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: todo-secrets
  namespace: todo-app
type: Opaque
data:
  # Base64 encoded values - DO NOT COMMIT real secrets
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0Bob3N0OjU0MzIvZGI=
  auth-secret: c3VwZXItc2VjcmV0LWtleS0xMjM=
  gemini-api-key: eW91ci1nZW1pbmktYXBpLWtleQ==
```

## Example 10: Ingress Configuration

```yaml
# k8s/base/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: todo-ingress
  namespace: todo-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
spec:
  ingressClassName: nginx
  rules:
    - host: todo.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 8000
```

## Example 11: HorizontalPodAutoscaler

```yaml
# k8s/base/backend/hpa.yaml
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
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## Example 12: Kustomization Base

```yaml
# k8s/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: todo-app

resources:
  - namespace.yaml
  - configmap.yaml
  - secrets.yaml
  - backend/deployment.yaml
  - backend/service.yaml
  - frontend/deployment.yaml
  - frontend/service.yaml
  - mcp-server/deployment.yaml
  - mcp-server/service.yaml
  - ai-agent/deployment.yaml
  - ingress.yaml

commonLabels:
  app.kubernetes.io/part-of: evolution-todo
  app.kubernetes.io/managed-by: kustomize
```

## Example 13: Development Overlay

```yaml
# k8s/overlays/dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: todo-app-dev

bases:
  - ../../base

namePrefix: dev-

commonLabels:
  environment: development

patchesStrategicMerge:
  - replicas-patch.yaml

configMapGenerator:
  - name: todo-config
    behavior: merge
    literals:
      - log-level=DEBUG
```

## Example 14: Apply All Manifests Script

```bash
#!/bin/bash
# scripts/k8s-apply.sh

set -e

NAMESPACE="${NAMESPACE:-todo-app}"
OVERLAY="${OVERLAY:-dev}"

echo "Applying Kubernetes manifests..."
echo "Namespace: $NAMESPACE"
echo "Overlay: $OVERLAY"

# Apply using kustomize
kubectl apply -k "k8s/overlays/$OVERLAY"

# Wait for deployments
echo "Waiting for deployments to be ready..."
kubectl -n "$NAMESPACE" rollout status deployment/backend --timeout=120s
kubectl -n "$NAMESPACE" rollout status deployment/frontend --timeout=120s
kubectl -n "$NAMESPACE" rollout status deployment/mcp-server --timeout=60s

echo "All deployments are ready!"

# Show status
kubectl -n "$NAMESPACE" get pods
kubectl -n "$NAMESPACE" get services
```
