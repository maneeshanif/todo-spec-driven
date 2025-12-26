# MCP Server Health Endpoint

This document describes the `/health` endpoint added to the FastMCP server for Docker and Kubernetes health checks.

## Overview

The MCP server now exposes a `/health` endpoint that returns the service status, name, and version. This endpoint is designed for container orchestration platforms (Docker, Kubernetes) to perform health checks.

## Endpoint Details

**URL**: `http://localhost:8001/health`
**Method**: `GET`
**Authentication**: None (public endpoint)
**Response Type**: `application/json`

### Response Format

```json
{
  "status": "healthy",
  "service": "todo-mcp-server",
  "version": "1.0.0",
  "timestamp": "2025-12-24T12:34:56.789Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Health status - always "healthy" if endpoint responds |
| `service` | string | Service name identifier |
| `version` | string | Service version |
| `timestamp` | string | ISO 8601 timestamp in UTC |

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Service is healthy and operational |
| `503` | Service unavailable (server not running or crashed) |

## Implementation

The health endpoint is implemented by wrapping the FastMCP HTTP server with a Starlette application that adds the `/health` route.

### Architecture

```
┌─────────────────────────────────────────┐
│         Starlette Wrapper App           │
├─────────────────────────────────────────┤
│  GET /health  →  health_endpoint()      │
│                   Returns 200 + JSON    │
├─────────────────────────────────────────┤
│  /*  →  FastMCP HTTP App                │
│         (MCP protocol handlers)         │
└─────────────────────────────────────────┘
```

### Code Location

**File**: `backend/src/mcp_server/server.py`
**Function**: `run_server()`
**Handler**: `health_endpoint()`

## Usage

### Manual Testing

```bash
# Using curl
curl http://localhost:8001/health

# Using httpx (Python)
python -c "import httpx; print(httpx.get('http://localhost:8001/health').json())"

# Using the test script
python backend/test_health.py
```

### Docker Compose

See `docker-compose-health-check-example.yaml` for a complete example.

```yaml
services:
  mcp-server:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
```

### Kubernetes

See `k8s-health-check-example.yaml` for a complete example.

#### Liveness Probe

Checks if the container is alive. Kubernetes restarts the container if this fails.

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8001
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

#### Readiness Probe

Checks if the container is ready to serve traffic. Kubernetes stops sending traffic if this fails.

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8001
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

#### Startup Probe

Checks if the application has started. Useful for slow-starting applications.

```yaml
startupProbe:
  httpGet:
    path: /health
    port: 8001
  initialDelaySeconds: 0
  periodSeconds: 3
  failureThreshold: 10
```

## Testing

### Run MCP Server

```bash
cd backend
uv run python -m src.mcp_server.server
```

Expected output:
```
🚀 Starting Todo MCP Server on http://0.0.0.0:8001
📦 Database: postgresql://...
🔧 Available tools: add_task, list_tasks, complete_task, delete_task, update_task
🏥 Health check: http://0.0.0.0:8001/health
```

### Test Health Endpoint

```bash
# In another terminal
python backend/test_health.py
```

Expected output:
```
Testing health endpoint at http://localhost:8001/health
Make sure the MCP server is running first!
Start it with: cd backend && uv run python -m src.mcp_server.server

Status: 200
Response: {'status': 'healthy', 'service': 'todo-mcp-server', 'version': '1.0.0', 'timestamp': '2025-12-24T12:34:56.789Z'}

✓ Health check passed!
```

## Troubleshooting

### Health check fails with connection error

**Problem**: `Could not connect to MCP server`

**Solution**:
1. Check if MCP server is running: `ps aux | grep mcp_server`
2. Check port 8001 is not in use: `lsof -i :8001`
3. Check firewall rules allow port 8001
4. Verify environment variable: `echo $MCP_SERVER_PORT`

### Health check returns 404

**Problem**: Endpoint not found

**Solution**:
1. Verify you're using the updated `server.py` with health endpoint
2. Check FastMCP version: `uv run pip show fastmcp`
3. If `create_http_app` import fails, the server falls back to standard mode
4. Use TCP health check instead: check if port 8001 is open

### Kubernetes pod keeps restarting

**Problem**: Liveness probe fails too quickly

**Solution**:
1. Increase `initialDelaySeconds` to 30s or higher
2. Increase `failureThreshold` to 5 or higher
3. Check pod logs: `kubectl logs -n todo-app <pod-name>`
4. Check startup time: database connection might be slow

## Best Practices

### Docker

- Use `start_period` to allow time for database connection
- Set `interval` to 10-30 seconds (balance between responsiveness and load)
- Use `curl` or Python for HTTP checks (avoid installing extra tools)

### Kubernetes

- **Liveness**: Detect and restart crashed containers
  - `initialDelaySeconds`: 10-30s
  - `failureThreshold`: 3-5
  - `periodSeconds`: 10-30s

- **Readiness**: Control traffic routing
  - `initialDelaySeconds`: 5-10s
  - `failureThreshold`: 2-3
  - `periodSeconds`: 5-10s

- **Startup**: Handle slow starts
  - `periodSeconds`: 3-5s
  - `failureThreshold`: 10-20 (allow 30-100s total)

### Monitoring

- Set up alerts for repeated health check failures
- Monitor health check endpoint latency
- Track health check success rate in metrics

## Limitations

- The health endpoint only checks if the HTTP server responds
- Does NOT check:
  - Database connectivity
  - MCP tool functionality
  - Memory usage or resource limits

For production, consider extending the health check to include:
```python
async def health_endpoint(request):
    # Check database
    try:
        with Session(sync_engine) as session:
            session.exec(select(1)).first()
        db_status = "connected"
    except Exception as e:
        db_status = "disconnected"

    return JSONResponse({
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "todo-mcp-server",
        "version": "1.0.0",
        "checks": {
            "database": db_status
        }
    })
```

## References

- [Docker Healthcheck Documentation](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Kubernetes Probes Documentation](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [FastMCP GitHub](https://github.com/jlowin/fastmcp)
- Backend CLAUDE.md for Phase 4 deployment standards
