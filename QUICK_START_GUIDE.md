# 🚀 Quick Start Guide - Local Kubernetes Cluster

**Status**: ✅ All Systems Running
**Date**: January 2, 2026

---

## 🎯 Access Your Application

### 🌐 Main Application
Open in your browser:
- **TaskWhisper App**: http://localhost:3000

### 🔧 Developer Tools
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/health
- **Database Admin**: http://localhost:8080

### 📊 Monitoring & Dashboards
- **Kubernetes Dashboard**: http://localhost:8443
- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin123`
- **Prometheus**: http://localhost:9090

---

## ✅ System Status

All services are running and tested:

```
✅ Minikube Cluster: Running
✅ Frontend (Next.js): Running on port 3000
✅ Backend (FastAPI): Running on port 8000
✅ PostgreSQL Database: Running
✅ Kafka Cluster (Strimzi): Running with 4 topics
✅ MCP Server: Running
✅ Monitoring Stack: Running
```

---

## 🔍 Quick Verification

### Test Backend API
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"todo-api","version":"1.0.0"}
```

### View All Pods
```bash
kubectl get pods -n todo-app
```

### Check Kafka Topics
```bash
kubectl exec -n kafka todo-kafka-cluster-dual-role-0 -- \
  bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

---

## 📋 Kafka Topics

Your Kafka cluster has 4 topics configured:
- `task-events` - Task lifecycle events (created, updated, deleted)
- `task-updates` - Real-time task change notifications
- `reminder-events` - Task reminder notifications
- `audit-events` - Audit trail events

---

## 🧪 Test Kafka Messaging

### Send a Test Message
```bash
echo '{"event":"task.created","task_id":"test-123","title":"Test Task"}' | \
  kubectl exec -i -n kafka todo-kafka-cluster-dual-role-0 -- \
  bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 \
    --topic task-events
```

### Read Messages
```bash
kubectl exec -n kafka todo-kafka-cluster-dual-role-0 -- \
  bin/kafka-console-consumer.sh \
    --bootstrap-server localhost:9092 \
    --topic task-events \
    --from-beginning \
    --max-messages 10
```

---

## 🔄 Common Operations

### View Logs
```bash
# Backend logs
kubectl logs -n todo-app -l app=backend --tail=50 -f

# Frontend logs
kubectl logs -n todo-app -l app=frontend --tail=50 -f

# Kafka logs
kubectl logs -n kafka todo-kafka-cluster-dual-role-0 --tail=50 -f
```

### Restart a Service
```bash
# Restart backend
kubectl rollout restart deployment evolution-todo-todo-app-backend -n todo-app

# Restart frontend
kubectl rollout restart deployment evolution-todo-todo-app-frontend -n todo-app
```

### Stop/Start Cluster
```bash
# Stop
minikube stop

# Start
minikube start
```

---

## 🛠️ If Port Forwards Stop Working

Port forwards may disconnect. Restart them:

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

## 📖 Full Documentation

For detailed information, see:
- [LOCAL_K8S_ACCESS.md](./LOCAL_K8S_ACCESS.md) - Complete access guide
- [ACTIVE_PORTFORWARDS.txt](./ACTIVE_PORTFORWARDS.txt) - Current port forwards

---

## 🎉 Next Steps

1. **Open the app**: http://localhost:3000
2. **Explore the API**: http://localhost:8000/docs
3. **Check monitoring**: http://localhost:3001 (Grafana)
4. **View cluster**: http://localhost:8443 (K8s Dashboard)
5. **Test Kafka**: Use the commands above

---

**Happy Coding! 🚀**
