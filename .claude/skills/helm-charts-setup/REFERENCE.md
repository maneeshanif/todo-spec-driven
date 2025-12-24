# Helm Charts Setup Skill - API Reference

## Chart.yaml Schema

```yaml
apiVersion: v2                    # Required: v2 for Helm 3
name: mychart                     # Required: Chart name
version: 1.0.0                    # Required: SemVer 2 version
type: application                 # application or library
appVersion: "1.0.0"               # App version (informational)
description: Chart description    # Optional description
home: https://example.com         # Project homepage
icon: https://example.com/icon.png
sources:                          # Source code URLs
  - https://github.com/user/repo
keywords:                         # Search keywords
  - web
  - api
maintainers:                      # Chart maintainers
  - name: Name
    email: email@example.com
    url: https://example.com
deprecated: false                 # Mark as deprecated
kubeVersion: ">=1.20.0"          # Kubernetes version constraint

# Dependencies
dependencies:
  - name: nginx                   # Required: dependency name
    version: "1.0.0"              # Required: version constraint
    repository: "https://..."     # Repository URL or file://
    condition: nginx.enabled      # Enable/disable condition
    tags:                         # Enable/disable by tag
      - frontend
    alias: myalias                # Alias for multiple instances
    import-values:                # Import values from child
      - child: exports
        parent: imports
```

## values.yaml Conventions

```yaml
# Standard structure
replicaCount: 1

image:
  repository: nginx
  tag: ""                         # Defaults to .Chart.AppVersion
  pullPolicy: IfNotPresent

imagePullSecrets: []

nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations: {}

podSecurityContext:
  fsGroup: 1000

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  capabilities:
    drop:
      - ALL

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  className: ""
  annotations: {}
  hosts:
    - host: chart-example.local
      paths:
        - path: /
          pathType: ImplementationSpecific
  tls: []

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 100
  targetCPUUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity: {}
```

## Template Objects

### Built-in Objects

| Object | Description |
|--------|-------------|
| `.Release.Name` | Release name |
| `.Release.Namespace` | Release namespace |
| `.Release.IsInstall` | True if install operation |
| `.Release.IsUpgrade` | True if upgrade operation |
| `.Release.Revision` | Revision number |
| `.Release.Service` | Releasing service (Helm) |
| `.Chart.Name` | Chart name |
| `.Chart.Version` | Chart version |
| `.Chart.AppVersion` | App version |
| `.Values` | Values from values.yaml |
| `.Files` | Access to non-template files |
| `.Capabilities` | Kubernetes capabilities |
| `.Template.Name` | Current template name |
| `.Template.BasePath` | Templates directory path |

### Files Object

```yaml
# Read file content
{{ .Files.Get "config.ini" }}

# Read as base64
{{ .Files.Get "config.ini" | b64enc }}

# Read all matching files
{{ range $path, $content := .Files.Glob "configs/*" }}
{{ $path }}: {{ $content }}
{{ end }}

# Get as ConfigMap data
data:
{{ (.Files.Glob "configs/*").AsConfig | indent 2 }}

# Get as Secret data
data:
{{ (.Files.Glob "secrets/*").AsSecrets | indent 2 }}
```

### Capabilities Object

```yaml
# Check API version support
{{- if .Capabilities.APIVersions.Has "networking.k8s.io/v1" }}
# Use networking.k8s.io/v1
{{- end }}

# Kubernetes version
{{ .Capabilities.KubeVersion.Version }}
{{ .Capabilities.KubeVersion.Major }}
{{ .Capabilities.KubeVersion.Minor }}
```

## Template Functions Reference

### String Functions

| Function | Description | Example |
|----------|-------------|---------|
| `quote` | Add double quotes | `{{ .Values.name \| quote }}` |
| `squote` | Add single quotes | `{{ .Values.name \| squote }}` |
| `trim` | Remove whitespace | `{{ .Values.name \| trim }}` |
| `trimAll` | Remove specific chars | `{{ trimAll "$" .Values.name }}` |
| `trimPrefix` | Remove prefix | `{{ trimPrefix "-" .Values.name }}` |
| `trimSuffix` | Remove suffix | `{{ trimSuffix "-" .Values.name }}` |
| `lower` | Lowercase | `{{ .Values.name \| lower }}` |
| `upper` | Uppercase | `{{ .Values.name \| upper }}` |
| `title` | Title case | `{{ .Values.name \| title }}` |
| `replace` | Replace string | `{{ replace "old" "new" .Values.name }}` |
| `trunc` | Truncate | `{{ trunc 63 .Values.name }}` |
| `nospace` | Remove spaces | `{{ nospace .Values.name }}` |
| `contains` | Check contains | `{{ contains "sub" .Values.name }}` |
| `hasPrefix` | Check prefix | `{{ hasPrefix "pre" .Values.name }}` |
| `hasSuffix` | Check suffix | `{{ hasSuffix "suf" .Values.name }}` |
| `indent` | Add indent | `{{ .Values.yaml \| indent 4 }}` |
| `nindent` | Newline + indent | `{{ .Values.yaml \| nindent 4 }}` |

### Type Functions

| Function | Description | Example |
|----------|-------------|---------|
| `toYaml` | Convert to YAML | `{{ toYaml .Values.labels }}` |
| `toJson` | Convert to JSON | `{{ toJson .Values.config }}` |
| `toPrettyJson` | Pretty JSON | `{{ toPrettyJson .Values.config }}` |
| `toToml` | Convert to TOML | `{{ toToml .Values.config }}` |
| `fromYaml` | Parse YAML | `{{ fromYaml .Values.yamlString }}` |
| `fromJson` | Parse JSON | `{{ fromJson .Values.jsonString }}` |

### Logic Functions

| Function | Description | Example |
|----------|-------------|---------|
| `and` | Logical AND | `{{ and .Values.a .Values.b }}` |
| `or` | Logical OR | `{{ or .Values.a .Values.b }}` |
| `not` | Logical NOT | `{{ not .Values.enabled }}` |
| `eq` | Equal | `{{ eq .Values.type "prod" }}` |
| `ne` | Not equal | `{{ ne .Values.type "dev" }}` |
| `lt` | Less than | `{{ lt .Values.count 10 }}` |
| `le` | Less or equal | `{{ le .Values.count 10 }}` |
| `gt` | Greater than | `{{ gt .Values.count 5 }}` |
| `ge` | Greater or equal | `{{ ge .Values.count 5 }}` |
| `default` | Default value | `{{ .Values.name \| default "app" }}` |
| `empty` | Check empty | `{{ empty .Values.name }}` |
| `coalesce` | First non-empty | `{{ coalesce .Values.a .Values.b "default" }}` |
| `ternary` | Ternary operator | `{{ ternary "yes" "no" .Values.enabled }}` |

### List Functions

| Function | Description | Example |
|----------|-------------|---------|
| `list` | Create list | `{{ list "a" "b" "c" }}` |
| `first` | First element | `{{ first .Values.items }}` |
| `last` | Last element | `{{ last .Values.items }}` |
| `rest` | All except first | `{{ rest .Values.items }}` |
| `initial` | All except last | `{{ initial .Values.items }}` |
| `append` | Append item | `{{ append .Values.items "new" }}` |
| `prepend` | Prepend item | `{{ prepend .Values.items "new" }}` |
| `concat` | Concatenate lists | `{{ concat .Values.a .Values.b }}` |
| `reverse` | Reverse list | `{{ reverse .Values.items }}` |
| `uniq` | Remove duplicates | `{{ uniq .Values.items }}` |
| `sortAlpha` | Sort alphabetically | `{{ sortAlpha .Values.items }}` |
| `has` | Check if has | `{{ has "item" .Values.items }}` |
| `join` | Join with delimiter | `{{ join "," .Values.items }}` |

### Dict Functions

| Function | Description | Example |
|----------|-------------|---------|
| `dict` | Create dict | `{{ dict "key" "value" }}` |
| `get` | Get value | `{{ get .Values.map "key" }}` |
| `set` | Set value | `{{ set .Values.map "key" "value" }}` |
| `unset` | Remove key | `{{ unset .Values.map "key" }}` |
| `hasKey` | Check key exists | `{{ hasKey .Values.map "key" }}` |
| `keys` | Get keys | `{{ keys .Values.map }}` |
| `values` | Get values | `{{ values .Values.map }}` |
| `pick` | Select keys | `{{ pick .Values.map "a" "b" }}` |
| `omit` | Exclude keys | `{{ omit .Values.map "a" "b" }}` |
| `merge` | Merge dicts | `{{ merge .Values.a .Values.b }}` |
| `mergeOverwrite` | Merge with overwrite | `{{ mergeOverwrite .Values.a .Values.b }}` |

### Crypto Functions

| Function | Description | Example |
|----------|-------------|---------|
| `sha256sum` | SHA256 hash | `{{ sha256sum .Values.data }}` |
| `sha1sum` | SHA1 hash | `{{ sha1sum .Values.data }}` |
| `b64enc` | Base64 encode | `{{ b64enc .Values.secret }}` |
| `b64dec` | Base64 decode | `{{ b64dec .Values.encoded }}` |
| `randAlphaNum` | Random alphanumeric | `{{ randAlphaNum 16 }}` |
| `genPrivateKey` | Generate key | `{{ genPrivateKey "rsa" }}` |
| `genCA` | Generate CA | `{{ genCA "name" 365 }}` |
| `genSignedCert` | Generate cert | `{{ genSignedCert ... }}` |

## Named Templates

```yaml
# Define template
{{- define "mychart.labels" -}}
app: {{ .Chart.Name }}
{{- end -}}

# Use template (returns string)
{{ template "mychart.labels" . }}

# Include template (returns string, can pipe)
{{ include "mychart.labels" . | nindent 4 }}
```

## Common Patterns

### Conditional Resources

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
...
{{- end }}
```

### Resource Loops

```yaml
{{- range .Values.workers }}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .name }}
{{- end }}
```

### Optional Sections

```yaml
spec:
  {{- with .Values.nodeSelector }}
  nodeSelector:
    {{- toYaml . | nindent 4 }}
  {{- end }}
```

### Checksum Annotations

```yaml
metadata:
  annotations:
    checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
```
