# Kubernetes Deployment Checklist

Use this checklist to ensure a successful deployment of the Evolution of Todo application to Minikube.

## Pre-Deployment Checklist

### System Requirements
- [ ] Minikube installed (`minikube version`)
- [ ] kubectl installed (`kubectl version --client`)
- [ ] Docker installed and running (`docker --version`)
- [ ] Sufficient system resources (4 CPU, 8GB RAM minimum)

### Docker Images
- [ ] Frontend Dockerfile exists (`frontend/Dockerfile`)
- [ ] Backend Dockerfile exists (`backend/Dockerfile`)
- [ ] MCP Server Dockerfile exists (`backend/Dockerfile.mcp`)
- [ ] All images built successfully:
  ```bash
  docker images | grep todo-frontend
  docker images | grep todo-backend
  docker images | grep todo-mcp-server
  ```

### Minikube Setup
- [ ] Minikube cluster started:
  ```bash
  minikube start --cpus=4 --memory=8192 --disk-size=50gb
  ```
- [ ] Minikube status is Running:
  ```bash
  minikube status
  ```
- [ ] Images loaded into Minikube:
  ```bash
  minikube image list | grep todo
  ```

### Secrets Configuration
- [ ] Neon PostgreSQL DATABASE_URL obtained
- [ ] Gemini GEMINI_API_KEY obtained
- [ ] Better Auth BETTER_AUTH_SECRET generated
- [ ] OpenAI NEXT_PUBLIC_OPENAI_DOMAIN_KEY obtained
- [ ] Secrets configured using one of these methods:
  - [ ] kubectl create secret command executed
  - [ ] 02-secret.yaml updated with values

## Deployment Checklist

### Step 1: Namespace
- [ ] Namespace created:
  ```bash
  kubectl apply -f k8s/00-namespace.yaml
  ```
- [ ] Namespace verified:
  ```bash
  kubectl get namespace todo-app
  ```

### Step 2: ConfigMap
- [ ] ConfigMap created:
  ```bash
  kubectl apply -f k8s/01-configmap.yaml
  ```
- [ ] ConfigMap verified:
  ```bash
  kubectl get configmap app-config -n todo-app
  ```

### Step 3: Secrets
- [ ] Secrets created:
  ```bash
  kubectl apply -f k8s/02-secret.yaml
  # OR
  kubectl create secret generic app-secrets ...
  ```
- [ ] Secrets verified:
  ```bash
  kubectl get secret app-secrets -n todo-app
  ```

### Step 4: MCP Server
- [ ] MCP Server deployment created:
  ```bash
  kubectl apply -f k8s/03-mcp-server-deployment.yaml
  ```
- [ ] MCP Server service created:
  ```bash
  kubectl apply -f k8s/04-mcp-server-service.yaml
  ```
- [ ] MCP Server pod running:
  ```bash
  kubectl get pods -n todo-app -l app=mcp-server
  ```

### Step 5: Backend
- [ ] Backend deployment created:
  ```bash
  kubectl apply -f k8s/05-backend-deployment.yaml
  ```
- [ ] Backend service created:
  ```bash
  kubectl apply -f k8s/06-backend-service.yaml
  ```
- [ ] Backend pods running (2 replicas):
  ```bash
  kubectl get pods -n todo-app -l app=backend
  ```

### Step 6: Frontend
- [ ] Frontend deployment created:
  ```bash
  kubectl apply -f k8s/07-frontend-deployment.yaml
  ```
- [ ] Frontend service created:
  ```bash
  kubectl apply -f k8s/08-frontend-service.yaml
  ```
- [ ] Frontend pods running (2 replicas):
  ```bash
  kubectl get pods -n todo-app -l app=frontend
  ```

## Post-Deployment Verification

### Pod Health
- [ ] All pods are Running:
  ```bash
  kubectl get pods -n todo-app
  ```
  Expected: 5 pods total (2 frontend, 2 backend, 1 mcp-server)

- [ ] No pods in CrashLoopBackOff or Error state
- [ ] All pods show READY 1/1

### Service Health
- [ ] All services exist:
  ```bash
  kubectl get svc -n todo-app
  ```
  Expected: 3 services (frontend, backend, mcp-server)

- [ ] All services have endpoints:
  ```bash
  kubectl get endpoints -n todo-app
  ```

### Resource Verification
- [ ] Resource usage within limits:
  ```bash
  kubectl top pods -n todo-app
  ```

### Health Endpoints
- [ ] Backend health endpoint responds:
  ```bash
  kubectl run test-pod --rm -it --image=curlimages/curl -n todo-app \
    -- curl http://backend:8000/health
  ```

- [ ] MCP Server health endpoint responds:
  ```bash
  kubectl run test-pod --rm -it --image=curlimages/curl -n todo-app \
    -- curl http://mcp-server:8001/health
  ```

## Application Testing

### Access Application
- [ ] Frontend accessible via Minikube service:
  ```bash
  minikube service frontend -n todo-app
  ```

- [ ] Frontend loads in browser
- [ ] No console errors in browser DevTools

### Functional Testing
- [ ] User can sign up / login
- [ ] User can create a task
- [ ] User can view tasks
- [ ] User can update a task
- [ ] User can delete a task
- [ ] AI chatbot loads
- [ ] AI chatbot responds to messages
- [ ] AI chatbot can perform task operations

### Database Connectivity
- [ ] Tasks persist across page refreshes
- [ ] Database connection successful (check backend logs):
  ```bash
  kubectl logs -f deployment/backend -n todo-app | grep -i database
  ```

### Service Communication
- [ ] Frontend can communicate with backend
- [ ] Backend can communicate with MCP server
- [ ] Backend can communicate with Neon database
- [ ] No CORS errors in browser console

## Logs Review

### Backend Logs
- [ ] Backend logs reviewed:
  ```bash
  kubectl logs deployment/backend -n todo-app
  ```
- [ ] No errors in backend logs
- [ ] Database connection successful
- [ ] MCP server connection successful

### Frontend Logs
- [ ] Frontend logs reviewed:
  ```bash
  kubectl logs deployment/frontend -n todo-app
  ```
- [ ] No build errors
- [ ] Server started successfully

### MCP Server Logs
- [ ] MCP server logs reviewed:
  ```bash
  kubectl logs deployment/mcp-server -n todo-app
  ```
- [ ] Server started successfully
- [ ] Tools registered correctly

## Performance Testing

### Response Times
- [ ] Frontend loads in < 3 seconds
- [ ] Task creation completes in < 1 second
- [ ] AI chatbot responds in < 5 seconds
- [ ] Page navigation is smooth

### Resource Usage
- [ ] CPU usage < 80% of limits
- [ ] Memory usage < 80% of limits
- [ ] No resource throttling in logs

## Security Verification

### Secrets
- [ ] Secrets not exposed in logs
- [ ] Secrets not in git repository
- [ ] Environment variables loaded correctly

### Network Policies
- [ ] Backend and MCP server not externally accessible
- [ ] Only frontend has NodePort/LoadBalancer
- [ ] Internal service communication works

## Documentation

### Deployment Documentation
- [ ] README.md reviewed
- [ ] MANIFEST-GUIDE.md reviewed
- [ ] Deployment commands documented

### Troubleshooting
- [ ] Common issues documented
- [ ] Debug commands available
- [ ] Contact information for support

## Rollback Plan

### Rollback Readiness
- [ ] Know how to delete deployment:
  ```bash
  kubectl delete namespace todo-app
  ```

- [ ] Know how to rollback specific deployment:
  ```bash
  kubectl rollout undo deployment/backend -n todo-app
  ```

- [ ] Know how to scale down:
  ```bash
  kubectl scale deployment backend --replicas=0 -n todo-app
  ```

## Success Criteria

All of the following must be true:
- [ ] All 5 pods are Running
- [ ] All 3 services have endpoints
- [ ] Application is accessible via browser
- [ ] All functional tests pass
- [ ] No errors in logs
- [ ] Resource usage is healthy
- [ ] Performance is acceptable

## Final Sign-Off

- [ ] Deployment completed successfully
- [ ] All tests passed
- [ ] Documentation updated
- [ ] Team notified

**Deployment Date**: _______________
**Deployed By**: _______________
**Minikube Version**: _______________
**kubectl Version**: _______________

## Next Steps After Successful Deployment

1. [ ] Test all application features thoroughly
2. [ ] Monitor resource usage over time
3. [ ] Document any issues encountered
4. [ ] Create Helm chart (see `../helm/` directory)
5. [ ] Prepare for production deployment (Phase 5)
6. [ ] Set up monitoring and alerting
7. [ ] Configure autoscaling (HPA)
8. [ ] Plan backup and disaster recovery

## Notes

Add any deployment notes, issues encountered, or special configurations here:

```
_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________
```
