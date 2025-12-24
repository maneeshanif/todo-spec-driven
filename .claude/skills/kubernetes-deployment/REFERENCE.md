# Kubernetes Deployment Skill - API Reference

## Core Kubernetes Resources

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: <namespace-name>
  labels:
    <key>: <value>
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <deployment-name>
  namespace: <namespace>
  labels:
    <key>: <value>
spec:
  replicas: <number>
  selector:
    matchLabels:
      <key>: <value>
  strategy:
    type: RollingUpdate | Recreate
    rollingUpdate:
      maxSurge: <number|percentage>
      maxUnavailable: <number|percentage>
  template:
    metadata:
      labels:
        <key>: <value>
    spec:
      containers:
        - name: <container-name>
          image: <image:tag>
          imagePullPolicy: Always | IfNotPresent | Never
          ports:
            - containerPort: <port>
              name: <port-name>
              protocol: TCP | UDP
          env:
            - name: <var-name>
              value: <value>
          envFrom:
            - configMapRef:
                name: <configmap-name>
            - secretRef:
                name: <secret-name>
          resources:
            limits:
              cpu: <cpu>
              memory: <memory>
            requests:
              cpu: <cpu>
              memory: <memory>
          livenessProbe:
            httpGet:
              path: <path>
              port: <port>
            initialDelaySeconds: <seconds>
            periodSeconds: <seconds>
          readinessProbe:
            httpGet:
              path: <path>
              port: <port>
            initialDelaySeconds: <seconds>
            periodSeconds: <seconds>
          volumeMounts:
            - name: <volume-name>
              mountPath: <path>
      volumes:
        - name: <volume-name>
          configMap:
            name: <configmap-name>
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: <service-name>
  namespace: <namespace>
spec:
  type: ClusterIP | NodePort | LoadBalancer
  ports:
    - port: <service-port>
      targetPort: <container-port>
      nodePort: <node-port>  # For NodePort type
      protocol: TCP | UDP
      name: <port-name>
  selector:
    <label-key>: <label-value>
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: <configmap-name>
  namespace: <namespace>
data:
  <key>: <value>
  <filename>: |
    multi-line
    content
binaryData:
  <key>: <base64-encoded>
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: <secret-name>
  namespace: <namespace>
type: Opaque | kubernetes.io/tls | kubernetes.io/dockerconfigjson
data:
  <key>: <base64-encoded-value>
stringData:
  <key>: <plain-text-value>
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: <ingress-name>
  namespace: <namespace>
  annotations:
    <annotation-key>: <annotation-value>
spec:
  ingressClassName: <class-name>
  tls:
    - hosts:
        - <hostname>
      secretName: <tls-secret>
  rules:
    - host: <hostname>
      http:
        paths:
          - path: <path>
            pathType: Prefix | Exact | ImplementationSpecific
            backend:
              service:
                name: <service-name>
                port:
                  number: <port>
```

### HorizontalPodAutoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: <hpa-name>
  namespace: <namespace>
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: <deployment-name>
  minReplicas: <number>
  maxReplicas: <number>
  metrics:
    - type: Resource
      resource:
        name: cpu | memory
        target:
          type: Utilization | AverageValue
          averageUtilization: <percentage>
```

### PersistentVolumeClaim

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: <pvc-name>
  namespace: <namespace>
spec:
  accessModes:
    - ReadWriteOnce | ReadOnlyMany | ReadWriteMany
  resources:
    requests:
      storage: <size>  # e.g., 10Gi
  storageClassName: <storage-class>
```

### NetworkPolicy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: <policy-name>
  namespace: <namespace>
spec:
  podSelector:
    matchLabels:
      <key>: <value>
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              <key>: <value>
        - namespaceSelector:
            matchLabels:
              <key>: <value>
        - ipBlock:
            cidr: <cidr>
            except:
              - <cidr>
      ports:
        - protocol: TCP | UDP
          port: <port>
  egress:
    - to:
        - podSelector:
            matchLabels:
              <key>: <value>
      ports:
        - protocol: TCP
          port: <port>
```

## Kustomize Resources

### Kustomization File

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

# Namespace for all resources
namespace: <namespace>

# Resources to include
resources:
  - <path-to-manifest>
  - <directory>

# Bases to inherit from
bases:
  - <path-to-base>

# Patches
patchesStrategicMerge:
  - <patch-file.yaml>

patchesJson6902:
  - target:
      group: apps
      version: v1
      kind: Deployment
      name: <name>
    path: <patch-file.yaml>

# Generators
configMapGenerator:
  - name: <configmap-name>
    literals:
      - <key>=<value>
    files:
      - <filename>

secretGenerator:
  - name: <secret-name>
    literals:
      - <key>=<value>
    type: Opaque

# Transformers
namePrefix: <prefix>-
nameSuffix: -<suffix>

commonLabels:
  <key>: <value>

commonAnnotations:
  <key>: <value>

# Image transformations
images:
  - name: <original-image>
    newName: <new-image>
    newTag: <new-tag>
```

## Resource Units

### CPU

| Unit | Meaning |
|------|---------|
| `1` | 1 CPU core |
| `100m` | 100 millicores (0.1 CPU) |
| `500m` | 500 millicores (0.5 CPU) |
| `2` | 2 CPU cores |

### Memory

| Unit | Meaning |
|------|---------|
| `128Mi` | 128 Mebibytes |
| `1Gi` | 1 Gibibyte |
| `512M` | 512 Megabytes |
| `2G` | 2 Gigabytes |

## Common Labels (Kubernetes Recommended)

| Label | Description |
|-------|-------------|
| `app.kubernetes.io/name` | Application name |
| `app.kubernetes.io/instance` | Instance identifier |
| `app.kubernetes.io/version` | Application version |
| `app.kubernetes.io/component` | Component within app |
| `app.kubernetes.io/part-of` | Higher-level application |
| `app.kubernetes.io/managed-by` | Tool managing resource |

## Service Types

| Type | Description | Use Case |
|------|-------------|----------|
| `ClusterIP` | Internal cluster IP | Internal services |
| `NodePort` | Port on each node | Development, basic exposure |
| `LoadBalancer` | Cloud load balancer | Production cloud deployment |
| `ExternalName` | DNS CNAME | External service reference |

## Ingress Path Types

| Type | Description |
|------|-------------|
| `Prefix` | Matches URL path prefix |
| `Exact` | Matches exact URL path |
| `ImplementationSpecific` | Depends on ingress controller |

## Probe Types

| Type | Purpose |
|------|---------|
| `livenessProbe` | Is container alive? Restart if failed |
| `readinessProbe` | Is container ready for traffic? |
| `startupProbe` | Has container started? Disables other probes until success |

## Common kubectl Output Formats

| Flag | Output |
|------|--------|
| `-o wide` | Additional columns |
| `-o yaml` | YAML format |
| `-o json` | JSON format |
| `-o name` | Resource name only |
| `-o jsonpath='{...}'` | JSONPath expression |
| `-o custom-columns=...` | Custom columns |
