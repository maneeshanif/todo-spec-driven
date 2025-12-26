---
id: "0007"
title: "Helm Deployment Fixes - Auth and MCP Server"
stage: green
date: 2025-12-25
surface: agent
model: claude-opus-4-5-20251101
feature: 001-k8s-local-deploy
branch: 001-k8s-local-deploy
user: maneeshanif
command: /sp.implement
labels: ["kubernetes", "helm", "auth", "mcp", "debugging"]
links:
  spec: specs/001-k8s-local-deploy/spec.md
  ticket: null
  adr: null
  pr: null
---

## Prompt

User ran `/sp.implement` to continue implementation workflow after resolving deployment issues in the previous session. The session continued from debugging authentication and MCP server connectivity issues in the Minikube Helm deployment.

## Response

### Issues Diagnosed and Fixed

1. **Backend 500 Error on `/api/tasks`**
   - **Cause**: `BETTER_AUTH_URL` was hardcoded to `localhost:3000` in `jwt_auth.py`, which doesn't work inside K8s pods
   - **Fix**: Made `BETTER_AUTH_URL` configurable via environment variable, set to `http://todo-app-frontend:80` for K8s internal DNS

2. **Frontend "default secret" Error**
   - **Cause**: Frontend deployment missing `BETTER_AUTH_SECRET` env var for Better Auth
   - **Fix**: Added `BETTER_AUTH_SECRET` to frontend-deployment.yaml from secrets

3. **Frontend Database Connection Refused (ECONNREFUSED)**
   - **Cause**: Frontend Better Auth needs database access, but `DATABASE_URL` was using Python asyncpg format
   - **Fix**: Created `FRONTEND_DATABASE_URL` in secret template with Node.js pg driver format (removed `+asyncpg`, changed `ssl=require` to `sslmode=require`)

4. **MCP Server 404 / Chat "Session terminated"**
   - **Cause**: MCP server runs at `/mcp` path but `MCP_SERVER_URL` was pointing to root
   - **Fix**: Updated configmap to include `/mcp` path: `http://todo-app-mcp-server:8001/mcp`

### Files Modified

- `backend/src/middleware/jwt_auth.py` - Made BETTER_AUTH_URL configurable
- `helm/todo-app/templates/configmap.yaml` - Added BETTER_AUTH_URL, fixed MCP_SERVER_URL
- `helm/todo-app/templates/backend-deployment.yaml` - Added BETTER_AUTH_URL env var
- `helm/todo-app/templates/frontend-deployment.yaml` - Added BETTER_AUTH_SECRET and DATABASE_URL
- `helm/todo-app/templates/secret.yaml` - Added FRONTEND_DATABASE_URL with format conversion

### Final Deployment Status

All 65 tasks in Phase 4 marked complete:
- All 3 pods running: frontend, backend, mcp-server
- Helm release at revision 8
- Authentication working end-to-end
- ChatKit AI chatbot responding correctly
- All services communicating via K8s internal DNS

---

## Files Changed

- backend/src/middleware/jwt_auth.py
- helm/todo-app/templates/configmap.yaml
- helm/todo-app/templates/backend-deployment.yaml
- helm/todo-app/templates/frontend-deployment.yaml
- helm/todo-app/templates/secret.yaml

## Tests

- kubectl get pods -n todo-app (all Running)
- helm list -n todo-app (deployed, revision 8)
- Frontend authentication successful
- Task CRUD operations working
- ChatKit AI chat responding

## Outcome

Phase 4 Local Kubernetes Deployment complete. All 65 tasks verified and working. Application deployed to Minikube with Helm, accessible via port-forwarding with full functionality including authentication, task management, and AI chatbot.
