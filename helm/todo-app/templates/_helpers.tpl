{{/*
Expand the name of the chart.
*/}}
{{- define "todo-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "todo-app.fullname" -}}
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
{{- define "todo-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "todo-app.labels" -}}
helm.sh/chart: {{ include "todo-app.chart" . }}
{{ include "todo-app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "todo-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "todo-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Component-specific labels
*/}}
{{- define "todo-app.componentLabels" -}}
{{- $component := . -}}
app.kubernetes.io/component: {{ $component }}
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "todo-app.frontendLabels" -}}
{{ include "todo-app.labels" . }}
{{ include "todo-app.componentLabels" "frontend" }}
tier: frontend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "todo-app.frontendSelectorLabels" -}}
{{ include "todo-app.selectorLabels" . }}
{{ include "todo-app.componentLabels" "frontend" }}
{{- end }}

{{/*
Backend labels
*/}}
{{- define "todo-app.backendLabels" -}}
{{ include "todo-app.labels" . }}
{{ include "todo-app.componentLabels" "backend" }}
tier: backend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "todo-app.backendSelectorLabels" -}}
{{ include "todo-app.selectorLabels" . }}
{{ include "todo-app.componentLabels" "backend" }}
{{- end }}

{{/*
MCP Server labels
*/}}
{{- define "todo-app.mcpLabels" -}}
{{ include "todo-app.labels" . }}
{{ include "todo-app.componentLabels" "mcp-server" }}
tier: backend
{{- end }}

{{/*
MCP Server selector labels
*/}}
{{- define "todo-app.mcpSelectorLabels" -}}
{{ include "todo-app.selectorLabels" . }}
{{ include "todo-app.componentLabels" "mcp-server" }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "todo-app.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "todo-app.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Image pull policy
*/}}
{{- define "todo-app.imagePullPolicy" -}}
{{- default .Values.global.imagePullPolicy }}
{{- end }}

{{/*
Full image name for frontend
*/}}
{{- define "todo-app.frontendImage" -}}
{{- if .Values.global.registry }}
{{- printf "%s/%s:%s" .Values.global.registry .Values.frontend.image.repository (.Values.frontend.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.frontend.image.repository (.Values.frontend.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}

{{/*
Full image name for backend
*/}}
{{- define "todo-app.backendImage" -}}
{{- if .Values.global.registry }}
{{- printf "%s/%s:%s" .Values.global.registry .Values.backend.image.repository (.Values.backend.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.backend.image.repository (.Values.backend.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}

{{/*
Full image name for MCP server
*/}}
{{- define "todo-app.mcpImage" -}}
{{- if .Values.global.registry }}
{{- printf "%s/%s:%s" .Values.global.registry .Values.mcpServer.image.repository (.Values.mcpServer.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.mcpServer.image.repository (.Values.mcpServer.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}
{{/*
Notification Service labels
*/}}
{{- define "todo-app.notificationLabels" -}}
{{ include "todo-app.labels" . }}
{{ include "todo-app.componentLabels" "notification" }}
tier: backend
{{- end }}

{{/*
Notification Service selector labels
*/}}
{{- define "todo-app.notificationSelectorLabels" -}}
{{ include "todo-app.selectorLabels" . }}
{{ include "todo-app.componentLabels" "notification" }}
{{- end }}

{{/*
Recurring Task Service labels
*/}}
{{- define "todo-app.recurringTaskLabels" -}}
{{ include "todo-app.labels" . }}
{{ include "todo-app.componentLabels" "recurring-task" }}
tier: backend
{{- end }}

{{/*
Recurring Task Service selector labels
*/}}
{{- define "todo-app.recurringTaskSelectorLabels" -}}
{{ include "todo-app.selectorLabels" . }}
{{ include "todo-app.componentLabels" "recurring-task" }}
{{- end }}

{{/*
Audit Service labels
*/}}
{{- define "todo-app.auditLabels" -}}
{{ include "todo-app.labels" . }}
{{ include "todo-app.componentLabels" "audit" }}
tier: backend
{{- end }}

{{/*
Audit Service selector labels
*/}}
{{- define "todo-app.auditSelectorLabels" -}}
{{ include "todo-app.selectorLabels" . }}
{{ include "todo-app.componentLabels" "audit" }}
{{- end }}

{{/*
WebSocket Service labels
*/}}
{{- define "todo-app.websocketLabels" -}}
{{ include "todo-app.labels" . }}
{{ include "todo-app.componentLabels" "websocket" }}
tier: backend
{{- end }}

{{/*
WebSocket Service selector labels
*/}}
{{- define "todo-app.websocketSelectorLabels" -}}
{{ include "todo-app.selectorLabels" . }}
{{ include "todo-app.componentLabels" "websocket" }}
{{- end }}

{{/*
Full image name for Notification Service
*/}}
{{- define "todo-app.notificationImage" -}}
{{- if .Values.global.registry }}
{{- printf "%s/%s:%s" .Values.global.registry .Values.notificationService.image.repository (.Values.notificationService.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.notificationService.image.repository (.Values.notificationService.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}

{{/*
Full image name for Recurring Task Service
*/}}
{{- define "todo-app.recurringTaskImage" -}}
{{- if .Values.global.registry }}
{{- printf "%s/%s:%s" .Values.global.registry .Values.recurringTaskService.image.repository (.Values.recurringTaskService.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.recurringTaskService.image.repository (.Values.recurringTaskService.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}

{{/*
Full image name for Audit Service
*/}}
{{- define "todo-app.auditImage" -}}
{{- if .Values.global.registry }}
{{- printf "%s/%s:%s" .Values.global.registry .Values.auditService.image.repository (.Values.auditService.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.auditService.image.repository (.Values.auditService.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}

{{/*
Full image name for WebSocket Service
*/}}
{{- define "todo-app.websocketImage" -}}
{{- if .Values.global.registry }}
{{- printf "%s/%s:%s" .Values.global.registry .Values.websocketService.image.repository (.Values.websocketService.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.websocketService.image.repository (.Values.websocketService.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}
