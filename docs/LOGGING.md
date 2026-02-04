# Centralized Logging Strategy - Evolution Todo

## Overview

The Evolution Todo application uses a **structured logging** approach with logs written to **stdout/stderr**. This follows Kubernetes and cloud-native best practices, allowing logs to be collected by cluster-level logging solutions.

## Log Format

All services use **JSON structured logging** for consistent parsing and querying:

```json
{
  "timestamp": "2026-01-01T12:00:00.123Z",
  "level": "INFO",
  "service": "backend-service",
  "pod": "backend-xyz123",
  "message": "Task created successfully",
  "context": {
    "task_id": "123",
    "user_id": "456",
    "correlation_id": "abc-def-ghi"
  }
}
```

## Log Levels

| Level | Usage | Examples |
|-------|-------|----------|
| `DEBUG` | Development debugging | Request/response bodies, internal state |
| `INFO` | Normal operations | Request received, task created, event published |
| `WARNING` | Potential issues | Retry attempt, slow query, high memory usage |
| `ERROR` | Recoverable errors | Failed API call, database timeout, validation error |
| `CRITICAL` | System failures | Service crash, database unreachable, unrecoverable error |

## Correlation IDs

All requests are tagged with a **correlation_id** for distributed tracing across services:

```
User Request → Backend (correlation_id: abc-123)
  → Publishes Event (correlation_id: abc-123)
    → Notification Service (correlation_id: abc-123)
    → Recurring Task Service (correlation_id: abc-123)
    → Audit Service (correlation_id: abc-123)
```

## Log Collection Methods

### Method 1: kubectl logs (Development)

**For single pod logs:**
```bash
# Get logs from specific pod
kubectl logs -n todo-app backend-xyz123

# Follow logs in real-time
kubectl logs -n todo-app backend-xyz123 -f

# Get logs from previous container (after restart)
kubectl logs -n todo-app backend-xyz123 --previous

# Get logs from specific container in pod (with Dapr sidecar)
kubectl logs -n todo-app backend-xyz123 -c backend
kubectl logs -n todo-app backend-xyz123 -c daprd
```

**For multiple pods (by label):**
```bash
# Get logs from all backend pods
kubectl logs -n todo-app -l app.kubernetes.io/component=backend --tail=100

# Follow logs from all notification service pods
kubectl logs -n todo-app -l app.kubernetes.io/component=notification -f

# Get logs from all pods with errors
kubectl logs -n todo-app --all-containers=true | grep ERROR
```

**Search logs with grep:**
```bash
# Find all errors in backend
kubectl logs -n todo-app -l app.kubernetes.io/component=backend | grep '"level":"ERROR"'

# Find logs by correlation_id
kubectl logs -n todo-app --all-containers=true | grep '"correlation_id":"abc-123"'

# Find slow queries
kubectl logs -n todo-app -l app.kubernetes.io/component=backend | grep "slow query"
```

### Method 2: stern (Multi-Pod Log Tailing)

**Install stern:**
```bash
# macOS
brew install stern

# Linux
wget https://github.com/stern/stern/releases/download/v1.28.0/stern_linux_amd64.tar.gz
tar -xzf stern_linux_amd64.tar.gz
sudo mv stern /usr/local/bin/
```

**Usage:**
```bash
# Tail all pods in namespace
stern -n todo-app .

# Tail specific service
stern -n todo-app backend

# Tail with grep filter
stern -n todo-app . | grep ERROR

# Tail with color-coded output
stern -n todo-app --color always backend
```

### Method 3: ELK Stack (Production - Optional)

For production deployments, integrate with **ELK (Elasticsearch, Logstash, Kibana)** or **EFK (Elasticsearch, Fluentd, Kibana)** stack.

**Architecture:**
```
Pods (JSON logs to stdout)
  → Fluentd DaemonSet (collects from /var/log/containers)
    → Elasticsearch (stores and indexes)
      → Kibana (query and visualize)
```

**Fluentd Configuration Example:**
```yaml
# fluentd-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: kube-system
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/todo-app*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      read_from_head true
      <parse>
        @type json
        time_format %Y-%m-%dT%H:%M:%S.%NZ
      </parse>
    </source>

    <filter kubernetes.**>
      @type kubernetes_metadata
    </filter>

    <match kubernetes.**>
      @type elasticsearch
      host elasticsearch.kube-system.svc
      port 9200
      logstash_format true
      logstash_prefix evolution-todo
      include_tag_key true
      type_name _doc
      flush_interval 5s
    </match>
```

### Method 4: Cloud Provider Log Aggregation

**DigitalOcean Kubernetes:**
- Logs are automatically forwarded to DigitalOcean's log aggregation service
- Access via DigitalOcean Cloud Console → Kubernetes → Logs tab

**AWS EKS:**
- CloudWatch Container Insights
- Fluent Bit integration

**GCP GKE:**
- Cloud Logging (formerly Stackdriver)
- Automatic log collection

**Azure AKS:**
- Azure Monitor for Containers
- Log Analytics workspace

## Log Retention

| Environment | Retention Period | Storage |
|-------------|------------------|---------|
| Development (local) | 1 day | Pod ephemeral storage |
| Staging | 7 days | ELK or Cloud Logs |
| Production | 30 days | ELK or Cloud Logs |

## Common Log Queries

### Find Errors by Service

```bash
# Backend errors
kubectl logs -n todo-app -l app.kubernetes.io/component=backend --tail=1000 | grep '"level":"ERROR"'

# Notification service errors
kubectl logs -n todo-app -l app.kubernetes.io/component=notification --tail=1000 | grep '"level":"ERROR"'

# WebSocket service errors
kubectl logs -n todo-app -l app.kubernetes.io/component=websocket --tail=1000 | grep '"level":"ERROR"'
```

### Trace Request by Correlation ID

```bash
# Find all logs for a specific request
CORRELATION_ID="abc-123"
kubectl logs -n todo-app --all-containers=true --tail=-1 | grep "\"correlation_id\":\"$CORRELATION_ID\""
```

### Find Slow Operations

```bash
# Find operations taking > 1 second
kubectl logs -n todo-app -l app.kubernetes.io/component=backend --tail=1000 | grep '"duration_ms"' | awk '$NF > 1000'

# Find slow database queries
kubectl logs -n todo-app -l app.kubernetes.io/component=backend --tail=1000 | grep "slow query"
```

### Monitor Kafka Events

```bash
# Find all published events
kubectl logs -n todo-app -l app.kubernetes.io/component=backend | grep "Published event"

# Find event consumption
kubectl logs -n todo-app -l app.kubernetes.io/component=notification | grep "Consumed event"
```

### Dapr Sidecar Logs

```bash
# Backend Dapr sidecar logs
kubectl logs -n todo-app -l app.kubernetes.io/component=backend -c daprd

# Find Dapr pub/sub activity
kubectl logs -n todo-app -l dapr.io/enabled=true -c daprd | grep "pubsub"

# Find Dapr state operations
kubectl logs -n todo-app -l dapr.io/enabled=true -c daprd | grep "state"
```

## Log Best Practices

### 1. Always Include Context

```python
# Good
logger.info(
    "Task created",
    extra={
        "task_id": task.id,
        "user_id": user.id,
        "correlation_id": correlation_id,
        "priority": task.priority
    }
)

# Bad
logger.info("Task created")
```

### 2. Use Structured Logging

```python
# Good - JSON structured
logger.info("API request", extra={"method": "POST", "path": "/tasks", "status": 201})

# Bad - String interpolation
logger.info(f"API request: POST /tasks returned 201")
```

### 3. Log at Boundaries

Log at system boundaries:
- HTTP request received
- Database query executed
- Event published/consumed
- External API called
- Response sent

### 4. Don't Log Secrets

```python
# Good
logger.info("Database connected", extra={"host": db_host, "database": db_name})

# Bad
logger.info("Database connected", extra={"connection_string": DATABASE_URL})
```

### 5. Use Log Levels Appropriately

```python
# Development only
logger.debug("Request body: %s", request_body)

# Normal operations
logger.info("Task created successfully", extra={"task_id": task.id})

# Potential issues
logger.warning("Retry attempt %d for task %s", retry_count, task_id)

# Errors
logger.error("Failed to publish event", exc_info=True)

# Critical failures
logger.critical("Database connection lost", exc_info=True)
```

## Troubleshooting Common Issues

### Issue: No logs appearing

**Check pod status:**
```bash
kubectl get pods -n todo-app
kubectl describe pod -n todo-app <pod-name>
```

**Check container status:**
```bash
kubectl logs -n todo-app <pod-name> -c <container-name>
```

### Issue: Logs truncated

**Increase log tail size:**
```bash
kubectl logs -n todo-app <pod-name> --tail=10000
```

**Or get all logs:**
```bash
kubectl logs -n todo-app <pod-name> --tail=-1
```

### Issue: Can't find specific log entry

**Use timestamps:**
```bash
kubectl logs -n todo-app <pod-name> --since=1h
kubectl logs -n todo-app <pod-name> --since-time='2026-01-01T12:00:00Z'
```

**Use grep with context:**
```bash
kubectl logs -n todo-app <pod-name> | grep -A 5 -B 5 "error message"
```

## Monitoring Log Volume

```bash
# Count log lines per pod
for pod in $(kubectl get pods -n todo-app -o name); do
  echo "$pod: $(kubectl logs -n todo-app $pod --tail=-1 | wc -l) lines"
done

# Find noisiest pods
kubectl top pods -n todo-app --containers | sort -k3 -rn
```

## Integration with Monitoring

Logs complement metrics and traces:

1. **Metrics (Prometheus)**: What is happening? (request rate, latency)
2. **Logs**: Why is it happening? (error details, context)
3. **Traces (Zipkin/Jaeger)**: Where is it happening? (service call chain)

**Example Workflow:**
1. Prometheus alerts "High error rate on backend"
2. Check Grafana dashboard for affected time period
3. Query logs for errors in that time window
4. Use correlation_id to trace request across services
5. Check Dapr Dashboard for pub/sub health

## Alerting on Log Patterns

With ELK or cloud logging, create alerts for:
- Error rate exceeds threshold
- Specific error messages (e.g., "Database connection failed")
- Unusual log volume spikes
- Missing expected log entries (health checks)

## References

- Kubernetes Logging Architecture: https://kubernetes.io/docs/concepts/cluster-administration/logging/
- Fluentd Documentation: https://docs.fluentd.org/
- stern GitHub: https://github.com/stern/stern
- ELK Stack: https://www.elastic.co/what-is/elk-stack
