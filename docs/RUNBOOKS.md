# Operational Runbooks

**Phase**: Phase 5 - Advanced Cloud Deployment  
**Task**: T175

## Common Operations

### Deploy New Version

```bash
# 1. Update image tags in values-prod.yaml
helm upgrade evolution-todo ./helm/todo-app \
  -f helm/todo-app/values-prod.yaml \
  -n todo-app

# 2. Monitor rollout
kubectl rollout status deployment/backend -n todo-app
```

### Scale Services

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n todo-app

# Scale notification service
kubectl scale deployment notification-service --replicas=3 -n todo-app
```

### Restart Service

```bash
kubectl rollout restart deployment/backend -n todo-app
```

### View Logs

```bash
# Backend logs
kubectl logs -n todo-app -l app=backend --tail=100 -f

# All services
stern -n todo-app .
```

### Check Health

```bash
# All pods
kubectl get pods -n todo-app

# Service endpoints
kubectl get svc -n todo-app

# Ingress
kubectl get ingress -n todo-app
```

## Incident Response

### High Error Rate

1. Check pod logs for errors
2. Check Prometheus alerts
3. Review recent deployments
4. Rollback if necessary

### High Latency

1. Check resource usage (CPU/Memory)
2. Check database connections
3. Check Kafka consumer lag
4. Scale services if needed

### Pod Crashes

1. Check pod events: `kubectl describe pod <pod-name> -n todo-app`
2. Check logs before crash: `kubectl logs <pod-name> --previous -n todo-app`
3. Check resource limits
4. Review recent code changes

### Kafka Issues

1. Check Kafka cluster status
2. Check consumer lag
3. Restart affected consumers
4. Review Dapr pub/sub logs

## Maintenance Windows

### Database Migrations

```bash
# Run migrations
kubectl exec -it <backend-pod> -n todo-app -- \
  uv run alembic upgrade head
```

### Backup Database

```bash
# Using pg_dump
kubectl exec -it <postgres-pod> -n todo-app -- \
  pg_dump -U postgres evolution_todo > backup.sql
```

### Update Secrets

```bash
# Update Redpanda credentials
kubectl create secret generic redpanda-credentials \
  --from-literal=sasl-password='NEW_PASSWORD' \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart affected pods
kubectl rollout restart deployment/backend -n todo-app
```

