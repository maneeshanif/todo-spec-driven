# Local Kubernetes Cluster - Access Guide

**Status**: ✅ All services running and tested
**Date**: January 2, 2026
**Cluster**: Minikube (single node)

---

## 🎯 Quick Access URLs

### Core Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Backend Health**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

### Dashboards & Monitoring
- **Kubernetes Dashboard**: http://localhost:8443
- **Grafana**: http://localhost:3001 (user: admin, password: prom-operator)
- **Prometheus**: http://localhost:9090
- **Adminer (Database UI)**: http://localhost:8080

### Service Status
✅ Frontend: Running (Next.js)
✅ Backend: Running (FastAPI)
✅ MCP Server: Running (FastMCP)
✅ PostgreSQL: Running
✅ Kafka Cluster: Running (Strimzi)
✅ Monitoring Stack: Running (Prometheus + Grafana)

---

## 📊 Cluster Information

### Nodes
```bash
kubectl get nodes
# NAME       STATUS   ROLES           AGE   VERSION
# minikube   Ready    control-plane   46h   v1.34.0
```

### Namespaces
- `todo-app` - Main application services
- `kafka` - Kafka cluster (Strimzi)
- `monitoring` - Prometheus & Grafana
- `kubernetes-dashboard` - K8s Dashboard
- `ingress-nginx` - Ingress controller

---

## 🔌 Port Forwards (Currently Active)

The following port forwards are running in the background:

| Service | Local Port | Target Port | Namespace |
|---------|-----------|-------------|-----------|
| Frontend | 3000 | 80 | todo-app |
| Backend | 8000 | 8000 | todo-app |
| Adminer | 8080 | 8080 | todo-app |
| K8s Dashboard | 8443 | 80 | kubernetes-dashboard |
| Grafana | 3001 | 80 | monitoring |
| Prometheus | 9090 | 9090 | monitoring |

### Restart Port Forwards

If port forwards are lost, run:

```bash
# Kill existing
pkill -f "kubectl port-forward"

# Restart all
kubectl port-forward -n todo-app service/evolution-todo-todo-app-frontend 3000:80 &
kubectl port-forward -n todo-app service/evolution-todo-todo-app-backend 8000:8000 &
kubectl port-forward -n todo-app service/adminer 8080:8080 &
kubectl port-forward -n kubernetes-dashboard service/kubernetes-dashboard 8443:80 &
kubectl port-forward -n monitoring service/monitoring-grafana 3001:80 &
kubectl port-forward -n monitoring service/monitoring-kube-prometheus-prometheus 9090:9090 &
```

---

## 🔍 Kafka Cluster Details

### Kafka Topics
```bash
kubectl exec -n kafka todo-kafka-cluster-dual-role-0 -- bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list
```

**Available Topics:**
- `task-events` (3 partitions)
- `task-updates` (3 partitions)
- `reminder-events` (2 partitions)
- `audit-events` (2 partitions)

### Test Kafka

Send a test message:
```bash
echo '{"event":"task.created","task_id":"test-123","title":"Test Task"}' | \
  kubectl exec -i -n kafka todo-kafka-cluster-dual-role-0 -- \
  bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 \
    --topic task-events
```

Consume messages:
```bash
kubectl exec -n kafka todo-kafka-cluster-dual-role-0 -- \
  bin/kafka-console-consumer.sh \
    --bootstrap-server localhost:9092 \
    --topic task-events \
    --from-beginning \
    --max-messages 10
```

---

## 🗄️ Database Access

### PostgreSQL Connection (via Adminer)
- URL: http://localhost:8080
- System: PostgreSQL
- Server: `postgres.todo-app.svc.cluster.local`
- Username: `todouser`
- Password: Check `backend/.env`
- Database: `tododb`

### Direct PostgreSQL Access
```bash
kubectl exec -it -n todo-app postgres-7c569b59f9-6dxrp -- psql -U todouser -d tododb
```

---

## 🧪 Testing Commands

### Check Pod Status
```bash
kubectl get pods -n todo-app
kubectl get pods -n kafka
```

### View Logs
```bash
# Backend logs
kubectl logs -n todo-app -l app=backend --tail=50

# Frontend logs
kubectl logs -n todo-app -l app=frontend --tail=50

# Kafka logs
kubectl logs -n kafka todo-kafka-cluster-dual-role-0 --tail=50
```

### Test Backend API
```bash
# Health check
curl http://localhost:8000/health

# List tasks (requires auth token)
curl http://localhost:8000/api/tasks
```

### Test Frontend
```bash
curl -I http://localhost:3000
```

---

## 🚀 Helm Release

```bash
helm list -n todo-app
# NAME           	NAMESPACE 	REVISION	STATUS  	CHART           	APP VERSION
# evolution-todo	todo-app  	4       	deployed	todo-app-5.0.0  	5.0.0
```

### Upgrade Helm Release
```bash
helm upgrade evolution-todo ./helm/todo-app -n todo-app
```

---

## 🔄 Restart Services

### Restart All Pods
```bash
kubectl rollout restart deployment -n todo-app
```

### Restart Specific Service
```bash
kubectl rollout restart deployment evolution-todo-todo-app-backend -n todo-app
kubectl rollout restart deployment evolution-todo-todo-app-frontend -n todo-app
```

---

## 📈 Monitoring

### Grafana
- URL: http://localhost:3001
- Default credentials: admin / prom-operator
- Pre-configured dashboards for Kubernetes metrics

### Prometheus
- URL: http://localhost:9090
- Query interface for metrics
- Check targets: http://localhost:9090/targets

---

## 🛑 Stop/Start Cluster

### Stop Minikube
```bash
minikube stop
```

### Start Minikube
```bash
minikube start
```

### Delete Cluster (Careful!)
```bash
minikube delete
```

---

## 🐛 Troubleshooting

### Pod Not Starting
```bash
kubectl describe pod <pod-name> -n todo-app
kubectl logs <pod-name> -n todo-app
```

### Kafka Issues
```bash
kubectl get kafka -n kafka
kubectl describe kafka todo-kafka-cluster -n kafka
kubectl logs -n kafka todo-kafka-cluster-dual-role-0
```

### Check Events
```bash
kubectl get events -n todo-app --sort-by='.lastTimestamp'
```

### Check Resource Usage
```bash
kubectl top nodes
kubectl top pods -n todo-app
```

---

## 📝 Notes

- Minikube is running with Docker driver
- All images are built locally and loaded into Minikube
- Kafka cluster uses Strimzi operator
- Monitoring stack uses kube-prometheus-stack
- Database is PostgreSQL with persistent storage

---

**Generated**: January 2, 2026
**Cluster**: minikube v1.37.0
**Kubernetes**: v1.34.0
