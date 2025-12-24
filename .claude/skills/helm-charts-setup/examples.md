# Helm Charts Setup Skill - Examples

## Example 1: Chart.yaml - Main Chart Definition

```yaml
# helm/evolution-todo/Chart.yaml
apiVersion: v2
name: evolution-todo
description: AI-Powered Todo Application with Multi-Service Architecture
type: application
version: 1.0.0
appVersion: "1.0.0"

# Chart dependencies
dependencies:
  - name: backend
    version: "1.0.0"
    repository: "file://charts/backend"
  - name: frontend
    version: "1.0.0"
    repository: "file://charts/frontend"
  - name: mcp-server
    version: "1.0.0"
    repository: "file://charts/mcp-server"
  - name: ai-agent
    version: "1.0.0"
    repository: "file://charts/ai-agent"

# Chart maintainers
maintainers:
  - name: Evolution Todo Team
    email: team@example.com

# Keywords for search
keywords:
  - todo
  - ai
  - fastapi
  - nextjs
  - kubernetes

# Source and documentation
home: https://github.com/user/evolution-todo
sources:
  - https://github.com/user/evolution-todo
```

## Example 2: values.yaml - Default Configuration

```yaml
# helm/evolution-todo/values.yaml
global:
  # Environment setting
  environment: development

  # Image pull policy
  imagePullPolicy: IfNotPresent

  # Registry configuration
  imageRegistry: ""

  # Node selector
  nodeSelector: {}

  # Tolerations
  tolerations: []

  # Affinity
  affinity: {}

# Namespace configuration
namespace:
  create: true
  name: todo-app

# Backend configuration
backend:
  enabled: true
  replicaCount: 2

  image:
    repository: evolution-todo/backend
    tag: latest
    pullPolicy: IfNotPresent

  service:
    type: ClusterIP
    port: 8000

  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 250m
      memory: 256Mi

  env:
    MCP_SERVER_URL: "http://mcp-server:8001"

  # Auto-scaling
  autoscaling:
    enabled: false
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70

# Frontend configuration
frontend:
  enabled: true
  replicaCount: 2

  image:
    repository: evolution-todo/frontend
    tag: latest

  service:
    type: NodePort
    port: 3000
    nodePort: 30300

  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 250m
      memory: 256Mi

  env:
    NEXT_PUBLIC_API_URL: "http://backend:8000"
    NEXT_PUBLIC_AUTH_URL: "http://backend:8000/auth"

# MCP Server configuration
mcpServer:
  enabled: true
  replicaCount: 1

  image:
    repository: evolution-todo/mcp-server
    tag: latest

  service:
    type: ClusterIP
    port: 8001

  resources:
    limits:
      cpu: 250m
      memory: 256Mi
    requests:
      cpu: 100m
      memory: 128Mi

# AI Agent configuration
aiAgent:
  enabled: true
  replicaCount: 1

  image:
    repository: evolution-todo/ai-agent
    tag: latest

  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 250m
      memory: 256Mi

  env:
    MCP_SERVER_URL: "http://mcp-server:8001"

# Secrets configuration
secrets:
  create: true
  # Values should be provided via --set or values file
  databaseUrl: ""
  betterAuthSecret: ""
  geminiApiKey: ""

# ConfigMap configuration
configMap:
  create: true
  logLevel: INFO

# Ingress configuration
ingress:
  enabled: true
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
  hosts:
    - host: todo.local
      paths:
        - path: /
          pathType: Prefix
          service: frontend
          port: 3000
        - path: /api
          pathType: Prefix
          service: backend
          port: 8000
  tls: []

# Service account
serviceAccount:
  create: true
  name: ""
  annotations: {}

# Pod security context
podSecurityContext:
  fsGroup: 1000

# Container security context
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
```

## Example 3: Backend Subchart Deployment Template

```yaml
# helm/evolution-todo/charts/backend/templates/deployment.yaml
{{- if .Values.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "backend.fullname" . }}
  namespace: {{ .Values.global.namespace | default .Release.Namespace }}
  labels:
    {{- include "backend.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "backend.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
      labels:
        {{- include "backend.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.global.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "backend.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.port }}
              protocol: TCP
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ include "backend.fullname" . }}-secret
                  key: database-url
            - name: BETTER_AUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: {{ include "backend.fullname" . }}-secret
                  key: auth-secret
            - name: GEMINI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: {{ include "backend.fullname" . }}-secret
                  key: gemini-api-key
            {{- range $key, $value := .Values.env }}
            - name: {{ $key }}
              value: {{ $value | quote }}
            {{- end }}
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
      {{- with .Values.global.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.global.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.global.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
{{- end }}
```

## Example 4: _helpers.tpl - Template Helpers

```yaml
# helm/evolution-todo/charts/backend/templates/_helpers.tpl
{{/*
Expand the name of the chart.
*/}}
{{- define "backend.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "backend.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "backend.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "backend.labels" -}}
helm.sh/chart: {{ include "backend.chart" . }}
{{ include "backend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "backend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: api
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "backend.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "backend.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
```

## Example 5: Service Template

```yaml
# helm/evolution-todo/charts/backend/templates/service.yaml
{{- if .Values.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "backend.fullname" . }}
  namespace: {{ .Values.global.namespace | default .Release.Namespace }}
  labels:
    {{- include "backend.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
      {{- if and (eq .Values.service.type "NodePort") .Values.service.nodePort }}
      nodePort: {{ .Values.service.nodePort }}
      {{- end }}
  selector:
    {{- include "backend.selectorLabels" . | nindent 4 }}
{{- end }}
```

## Example 6: HPA Template

```yaml
# helm/evolution-todo/charts/backend/templates/hpa.yaml
{{- if and .Values.enabled .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "backend.fullname" . }}
  namespace: {{ .Values.global.namespace | default .Release.Namespace }}
  labels:
    {{- include "backend.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "backend.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
{{- end }}
```

## Example 7: values-dev.yaml - Development Override

```yaml
# helm/evolution-todo/values-dev.yaml
global:
  environment: development
  imagePullPolicy: IfNotPresent

namespace:
  name: todo-app-dev

backend:
  replicaCount: 1
  resources:
    limits:
      cpu: 250m
      memory: 256Mi
    requests:
      cpu: 100m
      memory: 128Mi

frontend:
  replicaCount: 1
  service:
    nodePort: 30300

mcpServer:
  replicaCount: 1

aiAgent:
  replicaCount: 1

configMap:
  logLevel: DEBUG

ingress:
  enabled: false
```

## Example 8: values-prod.yaml - Production Override

```yaml
# helm/evolution-todo/values-prod.yaml
global:
  environment: production
  imagePullPolicy: Always

namespace:
  name: todo-app-prod

backend:
  replicaCount: 3
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 500m
      memory: 512Mi

frontend:
  replicaCount: 3
  service:
    type: ClusterIP
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10

mcpServer:
  replicaCount: 2
  resources:
    limits:
      cpu: 500m
      memory: 512Mi

aiAgent:
  replicaCount: 2
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  tls:
    - secretName: todo-tls
      hosts:
        - todo.example.com
  hosts:
    - host: todo.example.com
      paths:
        - path: /
          pathType: Prefix
          service: frontend
          port: 3000
        - path: /api
          pathType: Prefix
          service: backend
          port: 8000
```

## Example 9: Helm Install/Upgrade Commands

```bash
#!/bin/bash
# scripts/helm-deploy.sh

set -e

RELEASE_NAME="${RELEASE_NAME:-evolution-todo}"
NAMESPACE="${NAMESPACE:-todo-app}"
CHART_PATH="${CHART_PATH:-./helm/evolution-todo}"
VALUES_FILE="${VALUES_FILE:-values.yaml}"

# Add custom values file if provided
if [ -n "$CUSTOM_VALUES" ]; then
    VALUES_ARG="-f $VALUES_FILE -f $CUSTOM_VALUES"
else
    VALUES_ARG="-f $VALUES_FILE"
fi

echo "Deploying $RELEASE_NAME to $NAMESPACE..."

# Install or upgrade
helm upgrade --install "$RELEASE_NAME" "$CHART_PATH" \
    --namespace "$NAMESPACE" \
    --create-namespace \
    $VALUES_ARG \
    --set secrets.databaseUrl="$DATABASE_URL" \
    --set secrets.betterAuthSecret="$BETTER_AUTH_SECRET" \
    --set secrets.geminiApiKey="$GEMINI_API_KEY" \
    --wait \
    --timeout 5m

echo "Deployment complete!"

# Show status
helm status "$RELEASE_NAME" -n "$NAMESPACE"
kubectl get pods -n "$NAMESPACE"
```

## Example 10: NOTES.txt - Post-install Notes

```text
# helm/evolution-todo/templates/NOTES.txt
Thank you for installing {{ .Chart.Name }}!

Your release is named: {{ .Release.Name }}
Namespace: {{ .Release.Namespace }}

To access the application:

{{- if .Values.ingress.enabled }}
1. Access the application at:
{{- range .Values.ingress.hosts }}
   http{{ if $.Values.ingress.tls }}s{{ end }}://{{ .host }}
{{- end }}
{{- else if contains "NodePort" .Values.frontend.service.type }}
1. Get the NodePort:
   export NODE_PORT=$(kubectl get -n {{ .Release.Namespace }} -o jsonpath="{.spec.ports[0].nodePort}" services {{ include "frontend.fullname" . }})
   export NODE_IP=$(kubectl get nodes -o jsonpath="{.items[0].status.addresses[0].address}")
   echo "Access the application at: http://$NODE_IP:$NODE_PORT"
{{- else }}
1. Port-forward to access locally:
   kubectl port-forward -n {{ .Release.Namespace }} svc/{{ .Release.Name }}-frontend 3000:3000
   echo "Access the application at: http://localhost:3000"
{{- end }}

2. Check pod status:
   kubectl get pods -n {{ .Release.Namespace }}

3. View logs:
   kubectl logs -n {{ .Release.Namespace }} -l app.kubernetes.io/instance={{ .Release.Name }} -f

For more information, visit: {{ .Chart.Home }}
```
