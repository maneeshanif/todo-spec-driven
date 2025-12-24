# Helm Charts Setup Skill - Tools Reference

## Required CLI Tools

### Helm CLI

```bash
# Check Helm installation
helm version

# Expected output: version.BuildInfo{Version:"v3.x.x", ...}
```

### Install Helm

```bash
# macOS
brew install helm

# Linux (snap)
sudo snap install helm --classic

# Linux (script)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Windows (chocolatey)
choco install kubernetes-helm
```

## Helm Commands Reference

### Repository Management

```bash
# Add repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add stable https://charts.helm.sh/stable

# Update repositories
helm repo update

# List repositories
helm repo list

# Remove repository
helm repo remove bitnami

# Search for charts
helm search repo nginx
helm search hub postgresql
```

### Chart Management

```bash
# Create new chart
helm create mychart

# Lint chart
helm lint ./mychart

# Package chart
helm package ./mychart

# Show chart info
helm show chart ./mychart
helm show values ./mychart
helm show readme ./mychart
helm show all ./mychart

# Get chart dependencies
helm dependency list ./mychart
helm dependency update ./mychart
helm dependency build ./mychart
```

### Install/Upgrade Commands

```bash
# Install chart
helm install myrelease ./mychart
helm install myrelease ./mychart -n namespace

# Install with values
helm install myrelease ./mychart -f values.yaml
helm install myrelease ./mychart --set key=value
helm install myrelease ./mychart --set-string key=value
helm install myrelease ./mychart --set-file key=path/to/file

# Upgrade release
helm upgrade myrelease ./mychart
helm upgrade --install myrelease ./mychart  # Install or upgrade

# Upgrade with options
helm upgrade myrelease ./mychart --reuse-values
helm upgrade myrelease ./mychart --reset-values
helm upgrade myrelease ./mychart --atomic
helm upgrade myrelease ./mychart --wait --timeout 5m

# Rollback
helm rollback myrelease 1
helm rollback myrelease 1 --wait

# Dry run
helm install myrelease ./mychart --dry-run
helm upgrade myrelease ./mychart --dry-run
```

### Release Management

```bash
# List releases
helm list
helm list -n namespace
helm list --all
helm list --all-namespaces

# Get release info
helm status myrelease
helm history myrelease
helm get all myrelease
helm get values myrelease
helm get manifest myrelease
helm get notes myrelease

# Uninstall release
helm uninstall myrelease
helm uninstall myrelease --keep-history
```

### Template Commands

```bash
# Render templates locally
helm template myrelease ./mychart
helm template myrelease ./mychart -f values.yaml
helm template myrelease ./mychart --set key=value

# Debug templates
helm template myrelease ./mychart --debug

# Output to file
helm template myrelease ./mychart > rendered.yaml
```

## Chart Structure

```
mychart/
├── Chart.yaml          # Chart metadata
├── Chart.lock          # Locked dependencies
├── values.yaml         # Default values
├── values.schema.json  # JSON schema for values (optional)
├── .helmignore         # Files to ignore
├── templates/          # Template files
│   ├── NOTES.txt       # Post-install notes
│   ├── _helpers.tpl    # Template helpers
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   └── tests/          # Test templates
│       └── test-connection.yaml
├── charts/             # Subcharts
└── crds/               # Custom Resource Definitions
```

## Template Functions

### Built-in Functions

```yaml
# Quote string
{{ .Values.name | quote }}

# Default value
{{ .Values.name | default "default-name" }}

# Trim whitespace
{{ .Values.name | trim }}

# Upper/lower case
{{ .Values.name | upper }}
{{ .Values.name | lower }}

# Encode base64
{{ .Values.secret | b64enc }}
{{ .Values.encoded | b64dec }}

# Indent
{{ toYaml .Values.labels | nindent 4 }}

# Include template
{{ include "chart.fullname" . }}

# Required value
{{ required "database URL is required" .Values.databaseUrl }}
```

### Flow Control

```yaml
# If/else
{{- if .Values.enabled }}
# content
{{- else }}
# alternative
{{- end }}

# With scope
{{- with .Values.nodeSelector }}
nodeSelector:
  {{- toYaml . | nindent 2 }}
{{- end }}

# Range loop
{{- range .Values.hosts }}
- {{ . }}
{{- end }}

# Range with index
{{- range $index, $value := .Values.items }}
{{ $index }}: {{ $value }}
{{- end }}
```

### Sprig Functions

```yaml
# Date/time
{{ now | date "2006-01-02" }}

# String manipulation
{{ .Values.name | trunc 63 | trimSuffix "-" }}
{{ .Values.name | replace "old" "new" }}
{{ .Values.name | contains "substring" }}

# Lists
{{ .Values.items | first }}
{{ .Values.items | last }}
{{ .Values.items | join "," }}

# Dictionaries
{{ .Values.map | keys }}
{{ .Values.map | values }}
{{ merge .Values.default .Values.override }}
```

## Values Handling

### Values Priority (lowest to highest)

1. Chart's values.yaml
2. Parent chart's values.yaml
3. Values file passed with `-f`
4. Individual values with `--set`

### Setting Values

```bash
# Simple value
--set name=value

# Nested value
--set outer.inner=value

# Array value
--set servers[0].port=80
--set servers[0].host=example.com

# String value (prevent type coercion)
--set-string version=1.0

# From file
--set-file ca.crt=./ca.crt

# Multiple values
--set a=1,b=2
--set a=1 --set b=2
```

## Debugging

### Template Debugging

```bash
# Dry run with debug
helm install myrelease ./mychart --dry-run --debug

# Template with debug
helm template myrelease ./mychart --debug

# Lint with strict mode
helm lint ./mychart --strict

# Verify chart integrity
helm verify ./mychart-1.0.0.tgz
```

### Common Issues

```yaml
# Whitespace control
{{- if .Values.enabled -}}  # Trim left whitespace
content
{{- end -}}                  # Trim right whitespace

# Quotes for YAML
value: {{ .Values.name | quote }}  # Always quote if might be interpreted as number

# Type conversion
replicas: {{ int .Values.replicas }}
enabled: {{ .Values.enabled | toString }}
```

## Best Practices

### Chart Development

1. **Use helpers** for repeated logic
2. **Quote all strings** that might be misinterpreted
3. **Validate required values** with `required`
4. **Use consistent naming** with helpers
5. **Document values** in values.yaml

### Security

```yaml
# Never hardcode secrets
secrets:
  databaseUrl: ""  # Set via --set

# Use proper secret type
apiVersion: v1
kind: Secret
type: Opaque
stringData:
  password: {{ .Values.password | required "password required" }}
```

### Testing

```bash
# Lint chart
helm lint ./mychart

# Template and validate
helm template ./mychart | kubectl apply --dry-run=client -f -

# Run tests
helm test myrelease
```
