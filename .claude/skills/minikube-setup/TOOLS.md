# Minikube Setup Skill - Tools Reference

## Installation

### macOS

```bash
# Using Homebrew
brew install minikube

# Verify installation
minikube version
```

### Linux

```bash
# Download binary
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Verify installation
minikube version
```

### Windows

```powershell
# Using Chocolatey
choco install minikube

# Using winget
winget install minikube

# Verify installation
minikube version
```

## Prerequisites

### Docker Driver (Recommended)

```bash
# Check Docker installation
docker --version

# Docker daemon must be running
docker info
```

### Alternative Drivers

```bash
# VirtualBox
brew install virtualbox  # macOS
sudo apt install virtualbox  # Linux

# KVM (Linux)
sudo apt install qemu-kvm libvirt-daemon-system

# Hyper-V (Windows)
# Enable via Windows Features
```

## Core Commands

### Cluster Lifecycle

```bash
# Start cluster
minikube start

# Start with options
minikube start --nodes=3 --cpus=2 --memory=4096

# Stop cluster
minikube stop

# Delete cluster
minikube delete

# Delete all clusters
minikube delete --all

# Pause/unpause cluster
minikube pause
minikube unpause
```

### Status & Information

```bash
# Cluster status
minikube status

# Kubernetes version
minikube kubectl -- version

# IP address
minikube ip

# SSH info
minikube ssh-host

# Logs
minikube logs
minikube logs --file=logs.txt
```

### Profile Management

```bash
# List profiles
minikube profile list

# Create with profile
minikube start --profile=dev

# Switch profile
minikube profile dev

# Delete profile
minikube delete --profile=dev
```

### Node Management

```bash
# Add node
minikube node add

# Delete node
minikube node delete minikube-m02

# List nodes
minikube node list

# Start specific node
minikube node start minikube-m02

# Stop specific node
minikube node stop minikube-m02
```

### Addon Management

```bash
# List addons
minikube addons list

# Enable addon
minikube addons enable <addon-name>

# Disable addon
minikube addons disable <addon-name>

# Configure addon
minikube addons configure <addon-name>
```

### Essential Addons

| Addon | Purpose |
|-------|---------|
| `ingress` | NGINX Ingress controller |
| `dashboard` | Kubernetes Dashboard |
| `metrics-server` | Resource metrics |
| `storage-provisioner` | Dynamic storage |
| `registry` | Local Docker registry |
| `ingress-dns` | DNS for ingress |

### Image Management

```bash
# List images in minikube
minikube image list

# Load image from host
minikube image load myimage:tag

# Build in minikube
minikube image build -t myimage:tag .

# Remove image
minikube image rm myimage:tag

# Pull image
minikube image pull nginx:latest
```

### Docker Environment

```bash
# Use minikube's Docker daemon
eval $(minikube docker-env)

# Build directly in minikube
docker build -t myapp:latest .

# Return to host Docker
eval $(minikube docker-env --unset)

# Check current environment
echo $DOCKER_HOST
```

### Service Access

```bash
# Get service URL
minikube service <service-name> --url

# Open service in browser
minikube service <service-name>

# Open in specific namespace
minikube service <service-name> -n <namespace>

# List services
minikube service list
```

### Tunnel for LoadBalancer

```bash
# Start tunnel (requires sudo)
minikube tunnel

# Background tunnel
minikube tunnel &

# Check tunnel status
ps aux | grep "minikube tunnel"
```

### SSH Access

```bash
# SSH into primary node
minikube ssh

# SSH into specific node
minikube ssh -n minikube-m02

# Run command via SSH
minikube ssh -- "cat /etc/os-release"

# Copy files
minikube cp localfile:/path/in/minikube
minikube cp minikube:/path/in/minikube localfile
```

## Configuration Options

### Start Options

| Option | Description | Example |
|--------|-------------|---------|
| `--nodes` | Number of nodes | `--nodes=3` |
| `--cpus` | CPUs per node | `--cpus=2` |
| `--memory` | Memory per node (MB) | `--memory=4096` |
| `--disk-size` | Disk size | `--disk-size=20g` |
| `--driver` | VM driver | `--driver=docker` |
| `--kubernetes-version` | K8s version | `--kubernetes-version=v1.29.0` |
| `--container-runtime` | Container runtime | `--container-runtime=containerd` |
| `--cni` | CNI plugin | `--cni=calico` |
| `--profile` | Profile name | `--profile=prod` |

### Persistent Configuration

```bash
# Set default driver
minikube config set driver docker

# Set default memory
minikube config set memory 4096

# Set default CPUs
minikube config set cpus 2

# View configuration
minikube config view

# Unset configuration
minikube config unset memory
```

## Resource Requirements

### Minimum Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPUs | 2 | 4+ |
| Memory | 2GB | 8GB+ |
| Disk | 20GB | 50GB+ |

### Multi-Node Requirements

| Nodes | CPUs | Memory |
|-------|------|--------|
| 1 | 2 | 4GB |
| 3 | 2 per node | 4GB per node |
| 5 | 2 per node | 4GB per node |

## Troubleshooting

### Common Issues

```bash
# Cluster won't start
minikube delete && minikube start

# Out of disk space
minikube ssh -- "df -h"
minikube delete --purge

# Network issues
minikube stop && minikube start

# Driver issues
minikube start --driver=docker  # Try different driver
```

### Debug Commands

```bash
# View logs
minikube logs

# Detailed logs
minikube logs --problems

# Check system resources
minikube ssh -- "free -h && df -h && top -bn1 | head -5"

# Kubelet status
minikube ssh -- "systemctl status kubelet"
```

### Reset Commands

```bash
# Soft reset (keep config)
minikube stop && minikube start

# Hard reset (delete cluster)
minikube delete

# Complete reset (all profiles)
minikube delete --all --purge
```

## Integration with kubectl

```bash
# Use minikube's kubectl
minikube kubectl -- get pods

# Update kubectl config
minikube update-context

# Get kubectl config
minikube kubectl -- config view
```
