# Recurring Task Service

## Overview

The Recurring Task Service automatically creates the next occurrence of recurring tasks when a task is completed. It subscribes to task completion events from Kafka via Dapr Pub/Sub and invokes the backend API to create new tasks.

## Features

- Subscribes to `task-events` Kafka topic via Dapr Pub/Sub
- Processes `task.completed` events
- Calculates next occurrence dates (daily, weekly, monthly)
- Invokes backend API via Dapr Service Invocation
- JSON structured logging
- Health and readiness endpoints

## Technology Stack

- Python 3.13+
- FastAPI 0.115+
- Dapr 1.14+
- httpx 0.28+ (async HTTP client)
- python-dateutil 2.9+ (date calculations)

## Configuration

| Environment Variable | Default | Description |
|--------------------|---------|-------------|
| `DAPR_APP_ID` | `recurring-task-service` | Dapr application ID |
| `PORT` | `8003` | Service port |
| `DAPR_HTTP_PORT` | `3500` | Dapr HTTP sidecar port |
| `BACKEND_APP_ID` | `backend` | Backend service for task creation |
| `PUBSUB_NAME` | `taskpubsub` | Dapr Pub/Sub component name |
| `TASK_EVENTS_TOPIC` | `task-events` | Kafka topic name |
| `SERVICE_INVOCATION_TIMEOUT` | `30` | Service invocation timeout (seconds) |
| `LOG_LEVEL` | `INFO` | Logging level |

## Running Locally

### With Dapr Sidecar

```bash
cd services/recurring-task-service

# Install dependencies
uv sync

# Run with Dapr
dapr run \
  --app-id recurring-task-service \
  --app-port 8003 \
  --dapr-http-port 3503 \
  --components-path ../../dapr-components \
  -- uv run uvicorn src.main:app --host 0.0.0.0 --port 8003
```

### Without Dapr (Direct HTTP)

```bash
cd services/recurring-task-service

# Run without Dapr
uv run uvicorn src.main:app --host 0.0.0.0 --port 8003
```

## Running Tests

```bash
cd services/recurring-task-service

# Run tests
uv run pytest

# Run with coverage
uv run pytest --cov=src --cov-report=html
```

## Health Checks

```bash
# Health check
curl http://localhost:8003/health

# Readiness check
curl http://localhost:8003/ready
```

## Event Flow

```
1. User completes a recurring task
   ↓
2. Backend publishes task.completed event to Kafka
   ↓
3. Dapr delivers event to Recurring Task Service
   ↓
4. Service validates task has recurring_pattern
   ↓
5. Service calculates next_due_date
   ↓
6. Service invokes backend API via Dapr Service Invocation
   ↓
7. Backend creates new task
```

## Recurring Patterns

| Pattern | Calculation | Example |
|---------|-------------|---------|
| `daily` | due_date + 1 day | 2026-01-15 → 2026-01-16 |
| `weekly` | due_date + 1 week | 2026-01-15 → 2026-01-22 |
| `monthly` | due_date + 1 month | 2026-01-15 → 2026-02-15 |

## Docker

### Build Image

```bash
docker build -t recurring-task-service:latest .
```

### Run Container

```bash
docker run -p 8003:8003 \
  -e DAPR_HTTP_PORT=3500 \
  -e BACKEND_APP_ID=backend \
  recurring-task-service:latest
```

## Kubernetes Deployment

The service is deployed via the Helm chart. See `helm/evolution-todo/templates/recurring-task-deployment.yaml`.

### Dapr Annotations

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: recurring-task-service
spec:
  template:
    metadata:
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "recurring-task-service"
        dapr.io/app-port: "8003"
        dapr.io/log-level: "info"
```

## Error Handling

- **Invalid Pattern**: Returns 400 error, logs warning
- **Service Timeout**: Raises `httpx.TimeoutException`, triggers Dapr retry
- **HTTP Error**: Logs error, returns response body
- **Non-Recurring Task**: Skips processing, logs debug message

## Monitoring

### Logs

Logs are structured JSON for easy parsing:

```json
{
  "asctime": "2026-01-15 10:30:00,123",
  "name": "src.scheduler",
  "levelname": "INFO",
  "message": "Calculated next occurrence",
  "current_date": "2026-01-15T10:00:00Z",
  "pattern": "weekly",
  "next_date": "2026-01-22T10:00:00Z"
}
```

### Metrics

The service exposes Prometheus metrics via Dapr sidecar:

```bash
# Access Dapr metrics
curl http://localhost:3503/metrics
```

## Development

### Project Structure

```
recurring-task-service/
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Configuration
│   ├── consumer.py          # Dapr subscription handler
│   └── scheduler.py         # Next occurrence calculator
├── components/
│   └── subscription.yaml    # Dapr subscription resource
├── tests/
│   └── __init__.py
├── pyproject.toml
├── Dockerfile
└── README.md
```

### Adding Tests

Create test files in `tests/` directory:

```python
# tests/test_scheduler.py
import pytest
from src.scheduler import RecurringTaskScheduler
from datetime import datetime

def test_daily_pattern():
    scheduler = RecurringTaskScheduler()
    current = datetime(2026, 1, 15, 10, 0)
    next_date = scheduler.calculate_next_occurrence(current, "daily")
    assert next_date == datetime(2026, 1, 16, 10, 0)
```

## Troubleshooting

### Events Not Being Processed

1. Check Dapr subscription is registered:
   ```bash
   dapr list -k
   ```

2. Verify Kafka topic exists:
   ```bash
   kubectl get kafkatopic task-events -n todo-app
   ```

3. Check service logs:
   ```bash
   kubectl logs -f deployment/recurring-task-service -n todo-app
   ```

### Backend Invocation Fails

1. Verify backend service is running:
   ```bash
   kubectl get pods -n todo-app | grep backend
   ```

2. Check Dapr sidecar connectivity:
   ```bash
   kubectl exec -it recurring-task-service-xxx -n todo-app -- curl http://localhost:3500/v1.0/invoke/backend/method/api/health
   ```

3. Check Dapr HTTP port configuration:
   ```bash
   kubectl logs -f deployment/dapr-sidecar-injector -n dapr-system
   ```

## References

- [Phase 5 Constitution](../../constitution-prompt-phase-5.md)
- [Phase 5 Plan](../../plan-prompt-phase-5.md)
- [Dapr Documentation](https://docs.dapr.io/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
