# Kafka Setup Guide

**Phase**: Phase 5 - Advanced Cloud Deployment  
**Task**: T172

## Overview

This guide covers Kafka deployment for the Evolution Todo application using:
- **Local Development**: Strimzi Kafka on Minikube
- **Production**: Redpanda Cloud

## Table of Contents

- [Local Kafka Setup (Strimzi)](#local-kafka-setup-strimzi)
- [Production Setup (Redpanda Cloud)](#production-setup-redpanda-cloud)
- [Kafka Topics](#kafka-topics)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Local Kafka Setup (Strimzi)

### Prerequisites

```bash
# Minikube running
minikube start --cpus=4 --memory=5000

# kubectl configured
kubectl cluster-info
```

### Deploy Strimzi Operator

```bash
# Apply Strimzi operator
kubectl apply -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

# Wait for operator to be ready
kubectl wait --for=condition=available --timeout=300s \
  deployment/strimzi-cluster-operator -n kafka
```

### Deploy Kafka Cluster

```bash
# Deploy Kafka cluster (single node for local dev)
kubectl apply -f k8s/kafka/kafka-cluster.yaml

# Wait for Kafka to be ready (takes 2-3 minutes)
kubectl wait kafka/todo-kafka-cluster --for=condition=Ready \
  --timeout=300s -n kafka
```

### Create Kafka Topics

```bash
# Deploy topics
kubectl apply -f k8s/kafka/kafka-topics.yaml

# Verify topics
kubectl get kafkatopic -n kafka
```

### Access Kafka Locally

```bash
# Port forward Kafka bootstrap
kubectl port-forward -n kafka svc/todo-kafka-cluster-kafka-bootstrap 9092:9092

# Test with kcat (kafkacat)
echo "test message" | kcat -P -b localhost:9092 -t task-events
```

## Production Setup (Redpanda Cloud)

### Step 1: Create Redpanda Cloud Account

1. Visit https://cloud.redpanda.com
2. Sign up for free tier or paid plan
3. Verify email

### Step 2: Create Cluster

```bash
# Using Redpanda CLI (rpk)
rpk cloud cluster create evolution-todo \
  --region us-east-1 \
  --tier free
  
# Or via Web Console:
# 1. Click "Create Cluster"
# 2. Select region (us-east-1 recommended)
# 3. Choose tier (Free/Starter/Pro)
# 4. Wait for provisioning (2-5 minutes)
```

### Step 3: Create SASL Credentials

```bash
# Via CLI
rpk cloud user create evolution-todo-user

# Or via Web Console:
# 1. Go to Security tab
# 2. Click "Create User"
# 3. Save username and password securely
```

### Step 4: Get Bootstrap Servers

```bash
# Via CLI
rpk cloud cluster list

# Or via Web Console:
# Overview tab → Copy "Bootstrap servers" value
# Example: seed-12345.cloud.redpanda.com:9092
```

### Step 5: Create Kubernetes Secret

```bash
# Create secret with actual values
kubectl create secret generic redpanda-credentials \
  --from-literal=bootstrap-servers='seed-12345.cloud.redpanda.com:9092' \
  --from-literal=sasl-username='evolution-todo-user' \
  --from-literal=sasl-password='YOUR_PASSWORD' \
  --from-literal=sasl-mechanism='SCRAM-SHA-256' \
  --from-literal=security-protocol='SASL_SSL' \
  -n todo-app
```

### Step 6: Create Topics in Redpanda Cloud

```bash
# Using rpk CLI
rpk topic create task-events --partitions 3 --replicas 1
rpk topic create reminder-events --partitions 2 --replicas 1
rpk topic create task-updates --partitions 3 --replicas 1
rpk topic create audit-events --partitions 2 --replicas 1

# Or via Web Console:
# Topics tab → Create Topic
```

### Step 7: Deploy with Redpanda Configuration

```bash
# Deploy Helm chart with production values
helm upgrade --install evolution-todo ./helm/todo-app \
  -f helm/todo-app/values-prod.yaml \
  -n todo-app \
  --set environment=production
```

## Kafka Topics

### Topic Configuration

| Topic | Partitions | Replicas | Retention | Purpose |
|-------|------------|----------|-----------|---------|
| `task-events` | 3 | 1 | 7 days | Task CRUD events |
| `reminder-events` | 2 | 1 | 3 days | Reminder scheduling/firing |
| `task-updates` | 3 | 1 | 1 day | Real-time task updates |
| `audit-events` | 2 | 1 | 30 days | Audit log events |

### Event Schemas

See [EVENT-SCHEMAS.md](./EVENT-SCHEMAS.md) for detailed event schemas.

## Monitoring

### Local Kafka Metrics

```bash
# Port forward Prometheus
kubectl port-forward -n todo-app svc/evolution-todo-prometheus 9090:9090

# Query Kafka metrics
# - kafka_server_replicamanager_leadercount
# - kafka_server_brokertopicmetrics_messagesinpersec
# - kafka_server_brokertopicmetrics_bytesoutpersec
```

### Redpanda Cloud Monitoring

1. Go to Redpanda Cloud Console
2. Navigate to "Monitoring" tab
3. View:
   - Throughput (messages/sec)
   - Latency (p50, p95, p99)
   - Consumer lag by group
   - Disk usage

### Consumer Lag Monitoring

```bash
# Check consumer lag (local)
kubectl exec -n kafka todo-kafka-cluster-kafka-0 -- \
  /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group backend-group

# Check consumer lag (Redpanda Cloud)
rpk group describe backend-group
```

## Troubleshooting

### Issue: Kafka Cluster Not Ready

```bash
# Check Kafka pods
kubectl get pods -n kafka

# Check Kafka logs
kubectl logs -n kafka todo-kafka-cluster-kafka-0

# Check Strimzi operator logs
kubectl logs -n kafka deployment/strimzi-cluster-operator
```

### Issue: Topics Not Created

```bash
# Check topic status
kubectl get kafkatopic -n kafka
kubectl describe kafkatopic task-events -n kafka

# Manually create topic
kubectl exec -n kafka todo-kafka-cluster-kafka-0 -- \
  /opt/kafka/bin/kafka-topics.sh --create \
  --topic test-topic \
  --partitions 1 \
  --replication-factor 1 \
  --bootstrap-server localhost:9092
```

### Issue: Dapr Can't Connect to Kafka

```bash
# Test Kafka connectivity from backend pod
kubectl exec -n todo-app <backend-pod> -c backend -- \
  curl -v telnet://todo-kafka-cluster-kafka-bootstrap.kafka:9092

# Check Dapr pub/sub component
kubectl get component pubsub-kafka -n todo-app -o yaml

# Check Dapr sidecar logs
kubectl logs -n todo-app <backend-pod> -c daprd | grep kafka
```

### Issue: Messages Not Being Consumed

```bash
# Check consumer group membership
kubectl exec -n kafka todo-kafka-cluster-kafka-0 -- \
  /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group notification-service-group

# Check topic messages
kubectl exec -n kafka todo-kafka-cluster-kafka-0 -- \
  /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic task-events \
  --from-beginning --max-messages 10
```

### Issue: High Consumer Lag

```bash
# Check consumer lag
kubectl exec -n kafka todo-kafka-cluster-kafka-0 -- \
  /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group notification-service-group

# Possible causes:
# 1. Slow consumer processing
# 2. Not enough consumer instances
# 3. High message volume

# Solutions:
# - Scale consumer pods: kubectl scale deployment notification-service --replicas=3
# - Increase consumer threads
# - Optimize message processing
```

## Performance Tuning

### Producer Configuration

```python
producer_config = {
    "acks": "all",  # Wait for all replicas
    "compression.type": "snappy",  # Compress messages
    "linger.ms": "10",  # Batch messages for 10ms
    "batch.size": "16384",  # Batch size in bytes
}
```

### Consumer Configuration

```python
consumer_config = {
    "auto.offset.reset": "earliest",  # Start from beginning
    "enable.auto.commit": "true",
    "auto.commit.interval.ms": "5000",
    "max.poll.records": "500",  # Process 500 messages per poll
}
```

## Best Practices

1. **Use separate topics** for different event types
2. **Set appropriate retention** based on use case
3. **Monitor consumer lag** regularly
4. **Use compression** to reduce network bandwidth
5. **Implement idempotent consumers** for at-least-once delivery
6. **Use correlation IDs** for tracing events across services
7. **Test failover scenarios** in staging before production

## References

- [Strimzi Documentation](https://strimzi.io/docs/operators/latest/overview.html)
- [Redpanda Cloud Documentation](https://docs.redpanda.com/current/get-started/rpcloud/)
- [Kafka Best Practices](https://kafka.apache.org/documentation/#bestpractices)
- [Dapr Pub/Sub Component](https://docs.dapr.io/reference/components-reference/supported-pubsub/)

