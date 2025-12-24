# Minikube Setup Skill - API Reference

## Command Reference

### minikube start

```bash
minikube start [flags]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--driver` | string | auto | Driver: docker, virtualbox, kvm2, hyperkit |
| `--nodes` | int | 1 | Number of nodes (control-plane + workers) |
| `--cpus` | int | 2 | CPUs allocated per node |
| `--memory` | string | 2200 | Memory allocated per node (MB or with suffix) |
| `--disk-size` | string | 20000mb | Disk size allocated |
| `--kubernetes-version` | string | stable | Kubernetes version |
| `--container-runtime` | string | docker | Runtime: docker, containerd, cri-o |
| `--cni` | string | auto | CNI: auto, bridge, calico, cilium, flannel |
| `--profile` | string | minikube | Profile name |
| `--addons` | []string | [] | Addons to enable at start |
| `--mount` | bool | false | Mount host directory |
| `--mount-string` | string | /home:/minikube-host | Mount paths |

### minikube stop

```bash
minikube stop [flags]
```

| Flag | Description |
|------|-------------|
| `--profile` | Profile to stop |
| `--all` | Stop all profiles |

### minikube delete

```bash
minikube delete [flags]
```

| Flag | Description |
|------|-------------|
| `--profile` | Profile to delete |
| `--all` | Delete all profiles |
| `--purge` | Purge minikube config and cache |

### minikube status

```bash
minikube status [flags]
```

| Flag | Description |
|------|-------------|
| `-o, --output` | Output format: text, json |
| `--profile` | Profile to check |

### minikube addons

```bash
minikube addons <command> [flags]
```

| Command | Description |
|---------|-------------|
| `list` | List available addons |
| `enable <name>` | Enable addon |
| `disable <name>` | Disable addon |
| `configure <name>` | Configure addon |

### minikube service

```bash
minikube service <service-name> [flags]
```

| Flag | Description |
|------|-------------|
| `-n, --namespace` | Service namespace |
| `--url` | Return URL only |
| `--https` | Use HTTPS endpoint |

### minikube node

```bash
minikube node <command> [flags]
```

| Command | Description |
|---------|-------------|
| `add` | Add node to cluster |
| `delete <name>` | Delete node |
| `list` | List all nodes |
| `start <name>` | Start stopped node |
| `stop <name>` | Stop node |

### minikube image

```bash
minikube image <command> [flags]
```

| Command | Description |
|---------|-------------|
| `load <image>` | Load image from host |
| `build -t <tag> .` | Build image in minikube |
| `list` | List images |
| `rm <image>` | Remove image |
| `pull <image>` | Pull image |

### minikube ssh

```bash
minikube ssh [flags] [-- command]
```

| Flag | Description |
|------|-------------|
| `-n, --node` | Node to SSH into |
| `--native-ssh` | Use native SSH |

### minikube tunnel

```bash
minikube tunnel [flags]
```

| Flag | Description |
|------|-------------|
| `--cleanup` | Cleanup old tunnels |

### minikube docker-env

```bash
minikube docker-env [flags]
```

| Flag | Description |
|------|-------------|
| `-u, --unset` | Unset environment |
| `--shell` | Shell type |

### minikube config

```bash
minikube config <command>
```

| Command | Description |
|---------|-------------|
| `set <key> <value>` | Set config value |
| `get <key>` | Get config value |
| `unset <key>` | Unset config value |
| `view` | View all config |

## Available Addons

| Addon | Description |
|-------|-------------|
| `ambassador` | Ambassador API Gateway |
| `auto-pause` | Auto pause when idle |
| `csi-hostpath-driver` | CSI Hostpath Driver |
| `dashboard` | Kubernetes Dashboard |
| `default-storageclass` | Default StorageClass |
| `efk` | Elasticsearch, Fluentd, Kibana |
| `freshpod` | Restart pods on image change |
| `gcp-auth` | GCP authentication |
| `gvisor` | gVisor sandbox |
| `headlamp` | Headlamp Dashboard |
| `helm-tiller` | Helm Tiller |
| `inaccel` | InAccel FPGA Operator |
| `ingress` | NGINX Ingress Controller |
| `ingress-dns` | Ingress DNS |
| `istio` | Istio Service Mesh |
| `istio-provisioner` | Istio Provisioner |
| `kong` | Kong API Gateway |
| `kubevirt` | KubeVirt |
| `logviewer` | Log Viewer |
| `metallb` | MetalLB Load Balancer |
| `metrics-server` | Metrics Server |
| `nvidia-driver-installer` | NVIDIA Driver |
| `nvidia-gpu-device-plugin` | NVIDIA GPU Plugin |
| `olm` | Operator Lifecycle Manager |
| `pod-security-policy` | Pod Security Policy |
| `portainer` | Portainer |
| `registry` | Docker Registry |
| `registry-aliases` | Registry Aliases |
| `registry-creds` | Registry Credentials |
| `storage-provisioner` | Storage Provisioner |
| `storage-provisioner-gluster` | Gluster Provisioner |
| `volumesnapshots` | Volume Snapshots |

## Drivers

| Driver | Platform | Description |
|--------|----------|-------------|
| `docker` | All | Docker containers (recommended) |
| `virtualbox` | All | VirtualBox VMs |
| `kvm2` | Linux | KVM/QEMU VMs |
| `hyperkit` | macOS | HyperKit VMs |
| `hyperv` | Windows | Hyper-V VMs |
| `vmware` | All | VMware VMs |
| `parallels` | macOS | Parallels VMs |
| `podman` | Linux | Podman containers |
| `ssh` | All | Remote machine via SSH |
| `none` | Linux | Bare metal (requires root) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MINIKUBE_HOME` | Minikube home directory |
| `MINIKUBE_PROFILE` | Default profile |
| `MINIKUBE_WANTUPDATENOTIFICATION` | Update notifications |
| `MINIKUBE_WANTREPORTERROR` | Error reporting |
| `MINIKUBE_WANTKUBECTLDOWNLOADMSG` | kubectl download message |
| `MINIKUBE_DRIVER` | Default driver |

## File Locations

| Path | Description |
|------|-------------|
| `~/.minikube/` | Minikube home |
| `~/.minikube/profiles/` | Cluster profiles |
| `~/.minikube/machines/` | Machine configs |
| `~/.minikube/cache/` | Downloaded images/binaries |
| `~/.minikube/config/config.json` | Configuration |

## Node Naming

| Node Type | Name Pattern |
|-----------|--------------|
| Control plane | `<profile>` |
| Worker 1 | `<profile>-m02` |
| Worker 2 | `<profile>-m03` |
| Worker N | `<profile>-m<N+1>` |

## Container Runtimes

| Runtime | Description |
|---------|-------------|
| `docker` | Docker (default) |
| `containerd` | Containerd |
| `cri-o` | CRI-O |

## CNI Plugins

| Plugin | Description |
|--------|-------------|
| `auto` | Automatic selection |
| `bridge` | Simple bridge (default) |
| `calico` | Calico networking |
| `cilium` | Cilium networking |
| `flannel` | Flannel networking |
| `kindnet` | KIND networking |

## Common Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid argument |
| 3 | Command not supported |
| 4 | Permission denied |
| 5 | Not found |
| 6 | Provider error |
| 7 | Host error |
| 8 | Runtime error |
| 9 | Bootstrap error |

## Status Values

| Status | Description |
|--------|-------------|
| `Running` | Cluster is running |
| `Stopped` | Cluster is stopped |
| `Paused` | Cluster is paused |
| `Configured` | Configured but not running |
| `Deleting` | Being deleted |
| `Nonexistent` | Does not exist |
