# Minikube Setup Guide

Complete guide for setting up Minikube for local Kubernetes development with the Evolution of Todo application.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Starting Minikube](#starting-minikube)
4. [Essential Addons](#essential-addons)
5. [Working with Docker Images](#working-with-docker-images)
6. [Common Commands](#common-commands)
7. [Troubleshooting](#troubleshooting)

---

## Installation

### macOS

```bash
# Using Homebrew
brew install minikube

# Using curl
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
sudo install minikube-darwin-amd64 /usr/local/bin/minikube
```

### Linux

```bash
# Using curl (x86_64)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Using apt (Debian/Ubuntu)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube_latest_amd64.deb
sudo dpkg -i minikube_latest_amd64.deb

# Using dnf (Fedora)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-latest.x86_64.rpm
sudo rpm -Uvh minikube-latest.x86_64.rpm
```

### Windows

```powershell
# Using winget
winget install Kubernetes.minikube

# Using Chocolatey
choco install minikube

# Using scoop
scoop install minikube
```

### Verify Installation

```bash
minikube version
# minikube version: v1.33.1
```

---

## Configuration

### Recommended Settings

```bash
# Set default memory (8GB recommended for this project)
minikube config set memory 8192

# Set default CPUs (4 recommended)
minikube config set cpus 4

# Set default driver (docker recommended)
minikube config set driver docker

# View current config
minikube config view
```

### Available Drivers

| Driver | Platform | Recommended |
|--------|----------|-------------|
| docker | All | ✅ Yes |
| hyperkit | macOS | Yes |
| hyperv | Windows | Yes |
| virtualbox | All | Fallback |
| podman | Linux | Alternative |

---

## Starting Minikube

### Basic Start

```bash
# Start with default settings
minikube start

# Start with specific resources
minikube start --cpus=4 --memory=8192 --driver=docker
```

### For This Project

```bash
# Recommended configuration for Evolution of Todo
minikube start \
  --cpus=4 \
  --memory=8192 \
  --driver=docker \
  --kubernetes-version=v1.28.0
```

### Multi-Node Cluster (Optional)

```bash
# Start with multiple nodes (for testing replicas)
minikube start --nodes=3 --cpus=2 --memory=4096
```

### Check Status

```bash
minikube status
# minikube
# type: Control Plane
# host: Running
# kubelet: Running
# apiserver: Running
# kubeconfig: Configured
```

---

## Essential Addons

### Enable Required Addons

```bash
# Ingress controller (required for external access)
minikube addons enable ingress

# Metrics server (for kubectl top)
minikube addons enable metrics-server

# Dashboard (optional but useful)
minikube addons enable dashboard
```

### List All Addons

```bash
# View addon status
minikube addons list

# Common useful addons:
# - ingress: NGINX Ingress Controller
# - metrics-server: Resource metrics
# - dashboard: Kubernetes Dashboard
# - storage-provisioner: Dynamic storage
# - registry: Local Docker registry
```

### Verify Addon Status

```bash
# Check ingress controller pods
kubectl get pods -n ingress-nginx

# Check metrics server
kubectl get pods -n kube-system | grep metrics-server
```

---

## Working with Docker Images

### Building Images in Minikube

The key to avoiding `ImagePullBackOff` errors is to build images directly in Minikube's Docker daemon.

```bash
# Point Docker CLI to Minikube's Docker daemon
eval $(minikube docker-env)

# Build all project images
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend
docker build -f backend/Dockerfile.mcp -t todo-mcp-server:latest ./backend

# Verify images are in Minikube
docker images | grep todo

# Return to host Docker
eval $(minikube docker-env --unset)
```

### Using imagePullPolicy: Never

When using locally built images, set `imagePullPolicy: Never` in your deployments:

```yaml
containers:
- name: backend
  image: todo-backend:latest
  imagePullPolicy: Never  # Don't try to pull from registry
```

### Loading Existing Images

```bash
# Load an image from your host into Minikube
minikube image load todo-backend:latest

# List images in Minikube
minikube image ls
```

---

## Common Commands

### Cluster Management

```bash
# Start cluster
minikube start

# Stop cluster (preserves state)
minikube stop

# Delete cluster
minikube delete

# Pause cluster (save resources)
minikube pause

# Resume cluster
minikube unpause
```

### Accessing Services

```bash
# Get Minikube IP
minikube ip

# Access a service via URL
minikube service frontend -n todo-app --url

# Open service in browser
minikube service frontend -n todo-app

# Tunnel for LoadBalancer services
minikube tunnel
```

### Debugging

```bash
# SSH into Minikube VM
minikube ssh

# View Minikube logs
minikube logs

# Open Kubernetes Dashboard
minikube dashboard
```

### Docker Environment

```bash
# Use Minikube's Docker
eval $(minikube docker-env)

# Reset to host Docker
eval $(minikube docker-env --unset)

# Check which Docker you're using
docker info | grep Name
```

---

## Troubleshooting

### Common Issues

#### 1. "ImagePullBackOff" Error

**Cause**: Kubernetes is trying to pull images from a remote registry but they only exist locally.

**Solution**:
```bash
# Build images in Minikube's Docker
eval $(minikube docker-env)
docker build -t todo-backend:latest ./backend
eval $(minikube docker-env --unset)

# Ensure imagePullPolicy: Never in manifests
```

#### 2. Insufficient Resources

**Cause**: Minikube doesn't have enough CPU/memory.

**Solution**:
```bash
# Delete and recreate with more resources
minikube delete
minikube start --cpus=4 --memory=8192
```

#### 3. Ingress Not Working

**Cause**: Ingress addon not enabled or not ready.

**Solution**:
```bash
# Enable ingress
minikube addons enable ingress

# Wait for ingress controller
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Verify with curl
curl http://$(minikube ip)
```

#### 4. "No space left on device"

**Cause**: Minikube VM disk is full.

**Solution**:
```bash
# Clean up Docker images
minikube ssh
docker system prune -af

# Or increase disk size
minikube delete
minikube start --disk-size=50g
```

#### 5. DNS Resolution Issues

**Cause**: CoreDNS not working properly.

**Solution**:
```bash
# Restart CoreDNS
kubectl rollout restart deployment/coredns -n kube-system

# Check CoreDNS pods
kubectl get pods -n kube-system -l k8s-app=kube-dns
```

### Reset Everything

```bash
# Complete reset
minikube delete --all
minikube start --cpus=4 --memory=8192 --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server
```

---

## Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `minikube start` | Start cluster |
| `minikube stop` | Stop cluster |
| `minikube status` | Check status |
| `minikube ip` | Get cluster IP |
| `minikube dashboard` | Open dashboard |
| `minikube addons list` | List addons |
| `minikube logs` | View logs |
| `minikube ssh` | SSH into VM |
| `minikube delete` | Delete cluster |

### Docker Integration

| Command | Description |
|---------|-------------|
| `eval $(minikube docker-env)` | Use Minikube Docker |
| `eval $(minikube docker-env --unset)` | Use host Docker |
| `minikube image load <image>` | Load image to Minikube |
| `minikube image ls` | List Minikube images |

### Service Access

| Command | Description |
|---------|-------------|
| `minikube service <name> --url` | Get service URL |
| `minikube service <name>` | Open in browser |
| `minikube tunnel` | Enable LoadBalancer |

---

## Recommended Workflow

1. **Start Minikube**
   ```bash
   minikube start --cpus=4 --memory=8192 --driver=docker
   minikube addons enable ingress
   ```

2. **Build Images**
   ```bash
   eval $(minikube docker-env)
   docker build -t todo-frontend:latest ./frontend
   docker build -t todo-backend:latest ./backend
   docker build -f backend/Dockerfile.mcp -t todo-mcp-server:latest ./backend
   eval $(minikube docker-env --unset)
   ```

3. **Deploy**
   ```bash
   kubectl apply -f k8s/ -n todo-app
   # Or with Helm
   helm install todo-app ./helm/todo-app -f helm/todo-app/values-dev.yaml
   ```

4. **Access**
   ```bash
   echo "$(minikube ip) todo.local" | sudo tee -a /etc/hosts
   open http://todo.local
   ```

5. **Monitor**
   ```bash
   minikube dashboard
   kubectl get pods -n todo-app -w
   ```

---

**Version**: 1.0.0
**Last Updated**: December 25, 2025
**Phase**: Phase 4 - Local Kubernetes Deployment
