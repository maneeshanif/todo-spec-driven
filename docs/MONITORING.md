# Monitoring & Observability - Evolution Todo

## Overview

The Evolution Todo application uses a comprehensive monitoring stack for observability:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and dashboards
- **Dapr Dashboard**: Service mesh observability
- **Structured Logging**: JSON logs to stdout for log aggregation

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Application Pods                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │   │
│  │  │ Backend  │  │Notification│  │ Websocket│  │  Audit │  │   │
│  │  │ :8000    │  │  :8002    │  │  :8005   │  │  :8004 │  │   │
│  │  │ + Dapr   │  │ + Dapr    │  │ + Dapr   │  │ + Dapr │  │   │
│  │  └────┬─────┘  └────┬──────┘  └────┬─────┘  └────┬────┘  │   │
│  │       │ metrics     │ metrics      │ metrics    │ metrics│   │
│  │       │ :9090       │ :9090        │ :9090      │ :9090  │   │
│  └───────┼─────────────┼──────────────┼────────────┼────────┘   │
│          │             │              │            │            │
│  ┌───────▼─────────────▼──────────────▼────────────▼────────┐   │
│  │              Prometheus (metrics storage)                 │   │
│  │              :9090 + Alert Manager                        │   │
│  └───────────────────────────┬───────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────▼───────────────────────────────┐   │
│  │              Grafana (visualization)                      │   │
│  │              :3000 + Dashboards                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Dapr Dashboard                              │   │
│  │              :8080 + Service Mesh View                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment

### Enable Monitoring in Helm

Update `helm/todo-app/values.yaml` or `values-prod.yaml`:

```yaml
observability:
  metrics:
    enabled: true  # Enable Prometheus and Grafana
    port: 9090

dapr:
  enabled: true
  metrics:
    enabled: true  # Enable Dapr metrics export
```

### Deploy Stack

```bash
# Deploy application with monitoring enabled
helm upgrade --install evolution-todo ./helm/todo-app \
  -n todo-app \
  --create-namespace \
  -f helm/todo-app/values-prod.yaml

# Verify monitoring components
kubectl get pods -n todo-app | grep -E "prometheus|grafana|dapr-dashboard"
```

### Access Dashboards

**Local Development (Port-Forward):**

```bash
# Prometheus UI
kubectl port-forward -n todo-app svc/evolution-todo-prometheus 9090:9090
# Open: http://localhost:9090

# Grafana UI
kubectl port-forward -n todo-app svc/evolution-todo-grafana 3000:3000
# Open: http://localhost:3000
# Default credentials: admin/admin

# Dapr Dashboard
kubectl port-forward -n todo-app svc/evolution-todo-dapr-dashboard 8080:8080
# Open: http://localhost:8080
```

**Production (Ingress):**

Access via configured ingress hosts:
- Prometheus: `https://prometheus.your-domain.com`
- Grafana: `https://grafana.your-domain.com`
- Dapr: `https://dapr.your-domain.com`

## Prometheus

### Metrics Collected

#### Application Metrics

| Metric | Description | Labels |
|--------|-------------|--------|
| `http_requests_total` | Total HTTP requests | method, path, status, pod |
| `http_request_duration_milliseconds` | Request latency histogram | method, path, pod |
| `task_operations_total` | Task CRUD operations | operation, status, user_id |
| `event_published_total` | Events published to Kafka | topic, app_id |
| `event_consumed_total` | Events consumed from Kafka | topic, consumer_group |

#### Dapr Metrics

| Metric | Description | Labels |
|--------|-------------|--------|
| `dapr_component_pubsub_ingress_count` | Pub/sub messages received | app_id, topic |
| `dapr_component_pubsub_egress_count` | Pub/sub messages sent | app_id, topic |
| `dapr_component_pubsub_ingress_failures_total` | Pub/sub ingress failures | app_id, topic |
| `dapr_http_server_request_duration_seconds` | HTTP request duration | app_id, method, path |
| `dapr_state_operations_total` | State store operations | app_id, operation, store |

#### Kafka Metrics

| Metric | Description | Labels |
|--------|-------------|--------|
| `kafka_consumer_group_lag` | Consumer group lag | consumer_group, topic, partition |
| `kafka_topic_partition_current_offset` | Current topic offset | topic, partition |
| `kafka_consumer_group_offset` | Consumer group offset | consumer_group, topic, partition |

#### Kubernetes Metrics

| Metric | Description | Labels |
|--------|-------------|--------|
| `container_cpu_usage_seconds_total` | CPU usage | namespace, pod, container |
| `container_memory_usage_bytes` | Memory usage | namespace, pod, container |
| `kube_pod_container_status_restarts_total` | Pod restart count | namespace, pod, container |
| `kube_pod_status_phase` | Pod phase | namespace, pod, phase |

### Query Examples

**Request rate by service:**
```promql
rate(http_requests_total{namespace="todo-app"}[5m])
```

**P95 latency by service:**
```promql
histogram_quantile(0.95, rate(http_request_duration_milliseconds_bucket{namespace="todo-app"}[5m]))
```

**Error rate:**
```promql
rate(http_requests_total{namespace="todo-app",status=~"5.."}[5m]) / rate(http_requests_total{namespace="todo-app"}[5m])
```

**Kafka consumer lag:**
```promql
kafka_consumer_group_lag{namespace="todo-app"}
```

**CPU usage by pod:**
```promql
100 * (1 - avg(rate(container_cpu_usage_seconds_total{namespace="todo-app",container!="",container!="POD"}[5m])) by (pod, container))
```

**Memory usage by pod:**
```promql
container_memory_usage_bytes{namespace="todo-app",container!="",container!="POD"}
```

## Grafana Dashboards

### Pre-built Dashboards

#### 1. Pod Metrics Dashboard (`pods.json`)

**Panels:**
- CPU Usage (%) - Time series of CPU utilization per pod
- Memory Usage (bytes) - Time series of memory consumption
- Pod Restarts (Last Hour) - Gauge showing restart counts
- Pod Status Summary - Table of all pod statuses
- HTTP Request Rate - Time series of request rate
- HTTP Request Latency (p95, p99) - Latency percentiles

**Access:** Grafana → Dashboards → Evolution Todo → Pod Metrics

#### 2. Kafka Consumer Lag Dashboard (`kafka.json`)

**Panels:**
- Consumer Lag by Topic/Partition - Time series of lag
- Total Consumer Lag by Group - Gauge of aggregate lag
- Message Production Rate - Time series of produced messages
- Message Consumption Rate - Time series of consumed messages
- Consumer Lag Details - Table with all consumer groups
- Dapr Pub/Sub Ingress Count - Dapr message ingress
- Dapr Pub/Sub Egress Count - Dapr message egress

**Access:** Grafana → Dashboards → Evolution Todo → Kafka Consumer Lag

### Custom Dashboard Creation

1. Open Grafana UI
2. Click "+" → "Dashboard"
3. Add Panel → Select Visualization
4. Configure Query:
   - Data source: Prometheus
   - Metric: Select from dropdown
   - Labels: Filter by namespace="todo-app"
5. Save Dashboard

**Example Panel Query:**
```promql
# Active WebSocket connections
websocket_active_connections{namespace="todo-app"}
```

## Alert Rules

### Configured Alerts

#### Performance Alerts

| Alert | Threshold | Duration | Severity | Description |
|-------|-----------|----------|----------|-------------|
| HighLatency | p95 > 500ms | 5m | warning | Request latency exceeds target |
| CriticalLatency | p95 > 1000ms | 5m | critical | Very high request latency |
| HighErrorRate | > 5% | 5m | critical | Error rate exceeds threshold |
| RequestRateDrop | < 50% of historical | 10m | warning | Significant traffic drop |

#### Resource Alerts

| Alert | Threshold | Duration | Severity | Description |
|-------|-----------|----------|----------|-------------|
| HighCPUUsage | > 80% | 5m | warning | High CPU utilization |
| HighMemoryUsage | > 90% | 5m | warning | High memory usage |
| CriticalMemoryUsage | > 95% | 2m | critical | Memory exhaustion imminent |

#### Pod Alerts

| Alert | Threshold | Duration | Severity | Description |
|-------|-----------|----------|----------|-------------|
| PodRestarting | > 3 restarts/hour | 5m | warning | Pod restarting frequently |
| PodNotReady | not ready | 5m | warning | Pod failing health checks |
| PodPendingTooLong | pending | 10m | warning | Pod can't be scheduled |

#### Kafka Alerts

| Alert | Threshold | Duration | Severity | Description |
|-------|-----------|----------|----------|-------------|
| KafkaConsumerLag | > 1000 | 10m | warning | High consumer lag |
| CriticalKafkaConsumerLag | > 5000 | 5m | critical | Very high consumer lag |
| KafkaConsumerNotConsuming | 0 consumption | 10m | critical | Consumer stopped |

#### Dapr Alerts

| Alert | Threshold | Duration | Severity | Description |
|-------|-----------|----------|----------|-------------|
| DaprSidecarNotReady | down | 5m | critical | Dapr sidecar not responding |
| HighDaprPubSubFailures | > 0.1 ops/s | 5m | warning | High pub/sub failure rate |

#### Availability Alerts

| Alert | Threshold | Duration | Severity | Description |
|-------|-----------|----------|----------|-------------|
| ServiceDown | unreachable | 2m | critical | Service is down |
| LowReplicaCount | < 50% of desired | 5m | warning | Not enough replicas |

### Alert Notifications

**Configure AlertManager** (optional):

```yaml
# alertmanager-config.yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'

receivers:
  - name: 'default'
    email_configs:
      - to: 'ops@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alertmanager'
        auth_password: 'password'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: 'Evolution Todo Alert'
        text: '{{ .CommonAnnotations.summary }}'
```

## Dapr Dashboard

### Features

- **Overview**: Service topology and health
- **Applications**: Dapr-enabled apps
- **Components**: Pub/sub, state stores, bindings
- **Metrics**: Request rates and latencies
- **Logs**: Aggregated Dapr logs

### Key Views

#### 1. Service Topology

Visual graph showing:
- All Dapr-enabled services
- Service-to-service invocations
- Pub/sub relationships
- State store usage

#### 2. Application Details

For each service:
- App ID
- Replica count
- Enabled features
- Attached components
- Recent logs

#### 3. Component Health

Status of:
- `pubsub-kafka` - Kafka pub/sub
- `statestore-postgres` - PostgreSQL state
- `secretstore-kubernetes` - Kubernetes secrets

#### 4. Pub/Sub Activity

Real-time view of:
- Topics and subscriptions
- Message publish rate
- Message delivery status
- Failed deliveries

## Operational Runbooks

### High Latency Response

1. **Check Grafana Dashboard**: Identify affected service
2. **View Prometheus Metrics**: Drill into specific endpoints
3. **Check Logs**: Look for slow queries or external API timeouts
4. **Verify Resources**: Check CPU/Memory usage
5. **Scale if needed**: `kubectl scale deployment <name> --replicas=<N> -n todo-app`

### High Error Rate Response

1. **Check Alert Details**: Which service and error codes?
2. **View Logs**: `kubectl logs -n todo-app -l app.kubernetes.io/component=<service> | grep ERROR`
3. **Check Dependencies**: Database, Kafka, external APIs
4. **Recent Deployments**: `helm history evolution-todo -n todo-app`
5. **Rollback if needed**: `helm rollback evolution-todo <revision> -n todo-app`

### High Consumer Lag Response

1. **Check Kafka Dashboard**: Identify lagging consumer group
2. **View Consumer Logs**: Check for processing errors
3. **Check Consumer Health**: Verify pods are running
4. **Scale Consumers**: Increase replica count for service
5. **Monitor Lag Reduction**: Watch dashboard for improvement

### Pod Restart Loop Response

1. **Describe Pod**: `kubectl describe pod <name> -n todo-app`
2. **Check Previous Logs**: `kubectl logs <name> -n todo-app --previous`
3. **Check Events**: Look for OOMKilled, CrashLoopBackOff
4. **Increase Resources**: Update values.yaml memory/CPU limits
5. **Redeploy**: `helm upgrade evolution-todo ./helm/todo-app -n todo-app`

## Best Practices

### 1. Monitor What Matters

Focus on:
- **Golden Signals**: Latency, traffic, errors, saturation
- **Business Metrics**: Tasks created, events processed, user activity
- **Resource Utilization**: CPU, memory, disk, network

### 2. Set Meaningful Thresholds

- Base on historical data and SLOs
- Avoid alert fatigue (too sensitive)
- Escalate by severity (warning → critical)

### 3. Use Correlation IDs

- Tag all metrics with correlation_id
- Enables end-to-end request tracing
- Links metrics → logs → traces

### 4. Regular Dashboard Reviews

- Weekly review of key metrics
- Identify trends and anomalies
- Proactive capacity planning

### 5. Test Alert Rules

```bash
# Trigger test alert
kubectl run test-pod --image=busybox -n todo-app --restart=Never -- sleep 300
kubectl delete pod test-pod -n todo-app
# Should trigger PodRestarting alert
```

## Cost Optimization

### Metrics Retention

Adjust retention period based on needs:

```yaml
# prometheus.yaml
args:
  - '--storage.tsdb.retention.time=15d'  # Reduce to 7d for cost savings
```

### Reduce Scrape Frequency

For non-critical services:

```yaml
# prometheus-config.yaml
scrape_configs:
  - job_name: 'audit-service'
    scrape_interval: 60s  # Less frequent scraping
```

### Dashboard Caching

Enable Grafana caching:

```yaml
# grafana.ini
[caching]
enabled = true
```

## Troubleshooting

### Prometheus Not Scraping Targets

**Check ServiceMonitor:**
```bash
kubectl get servicemonitor -n todo-app
kubectl describe servicemonitor <name> -n todo-app
```

**Check Prometheus Targets:**
- Open Prometheus UI → Status → Targets
- Look for failed scrapes and error messages

### Grafana Dashboard Not Loading Data

**Verify Data Source:**
- Grafana → Configuration → Data Sources
- Test connection to Prometheus

**Check Query Syntax:**
- Use Prometheus UI to validate PromQL queries
- Check namespace and label filters

### Dapr Dashboard Not Showing Apps

**Verify Dapr Annotation:**
```bash
kubectl get pods -n todo-app -o jsonpath='{.items[*].metadata.annotations.dapr\.io/enabled}'
```

**Check Dapr Sidecar:**
```bash
kubectl logs -n todo-app <pod-name> -c daprd
```

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Dapr Observability](https://docs.dapr.io/operations/observability/)
- [Kubernetes Monitoring](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-usage-monitoring/)
- [SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
