# Phase 5 Local Testing Checklist

**Date**: January 1, 2026  
**Environment**: Minikube  
**Status**: In Progress

## Pre-Test Setup ✅

- [X] Minikube running
- [X] Kafka cluster deployed and ready
- [X] Kafka topics created (task-events, reminder-events, task-updates, audit-events)
- [ ] Backend Docker image built
- [ ] Frontend Docker image built
- [ ] Application deployed via Helm

## Test Suite 1: Basic Infrastructure

### 1.1 Kubernetes Resources
- [ ] All pods in `todo-app` namespace are Running
- [ ] All services are accessible
- [ ] ConfigMaps and Secrets are created
- [ ] Ingress/LoadBalancer configured (if applicable)

### 1.2 Kafka Infrastructure  
- [X] Kafka cluster is Ready
- [X] All 4 topics exist and Ready
- [ ] Can produce test message to topic
- [ ] Can consume test message from topic

## Test Suite 2: Backend API (FastAPI)

### 2.1 Health & Basic Endpoints
```bash
# Port forward backend
kubectl port-forward -n todo-app svc/evolution-todo-backend 8000:8000

# Test health endpoint
curl http://localhost:8000/health
# Expected: {"status": "healthy"}

# Test API docs
curl http://localhost:8000/docs
# Expected: Swagger UI HTML
```

- [ ] Health endpoint returns 200
- [ ] API docs accessible
- [ ] Database connection working

### 2.2 Task CRUD Operations
```bash
# Create task
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"Testing Phase 5"}'

# List tasks
curl http://localhost:8000/api/tasks

# Get task by ID
curl http://localhost:8000/api/tasks/1

# Update task
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Task"}'

# Delete task
curl -X DELETE http://localhost:8000/api/tasks/1
```

- [ ] Create task (POST /api/tasks)
- [ ] List tasks (GET /api/tasks)
- [ ] Get task by ID (GET /api/tasks/{id})
- [ ] Update task (PUT /api/tasks/{id})
- [ ] Delete task (DELETE /api/tasks/{id})

### 2.3 Phase 5 Features - Priorities (T027-T036)
```bash
# Create task with priority
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"High Priority Task","priority":"high"}'

# Filter by priority
curl "http://localhost:8000/api/tasks?priority=high"
```

- [ ] Create task with priority (high/medium/low)
- [ ] Update task priority
- [ ] Filter tasks by priority

### 2.4 Phase 5 Features - Tags (T037-T048)
```bash
# Create tag
curl -X POST http://localhost:8000/api/tags \
  -H "Content-Type: application/json" \
  -d '{"name":"work","color":"#FF0000"}'

# Create task with tags
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Tagged Task","tags":["work","urgent"]}'

# Filter by tag
curl "http://localhost:8000/api/tasks?tags=work"
```

- [ ] Create tag (POST /api/tags)
- [ ] List tags (GET /api/tags)
- [ ] Create task with tags
- [ ] Filter tasks by tags

### 2.5 Phase 5 Features - Due Dates & Reminders (T049-T058)
```bash
# Create task with due date
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Due Tomorrow","due_date":"2026-01-02T10:00:00Z"}'

# Schedule reminder
curl -X POST http://localhost:8000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{"task_id":1,"remind_at":"2026-01-02T09:00:00Z"}'

# List reminders
curl http://localhost:8000/api/reminders
```

- [ ] Create task with due_date
- [ ] Schedule reminder (POST /api/reminders)
- [ ] List reminders (GET /api/reminders)
- [ ] Test past-due reminder handling (T118)

### 2.6 Phase 5 Features - Recurring Tasks (T060-T070)
```bash
# Create recurring task
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Weekly Meeting","recurring_pattern":"weekly"}'

# List recurring tasks
curl "http://localhost:8000/api/tasks?recurring=true"
```

- [ ] Create recurring task (daily/weekly/monthly)
- [ ] List recurring tasks
- [ ] Verify recurring pattern stored

### 2.7 Phase 5 Features - Search (T068-T072)
```bash
# Search tasks
curl "http://localhost:8000/api/tasks?search=meeting"
```

- [ ] Search by keyword
- [ ] Search across title and description
- [ ] Case-insensitive search

### 2.8 Phase 5 Features - Filter & Sort (T074-T080)
```bash
# Filter by status
curl "http://localhost:8000/api/tasks?status=completed"

# Sort by due date
curl "http://localhost:8000/api/tasks?sort=due_date&order=asc"
```

- [ ] Filter by status
- [ ] Filter by due date range
- [ ] Sort by created_at, due_date, priority
- [ ] Ascending/descending order

### 2.9 Phase 5 Features - Audit Service (T110-T111)
```bash
# Get task audit history
curl http://localhost:8000/audit/task/1

# Get user activity
curl "http://localhost:8000/audit/user/user-123?entity_type=task"
```

- [ ] GET /audit/task/{task_id} returns history
- [ ] GET /audit/user/{user_id} returns activity
- [ ] Pagination works
- [ ] Filtering by action_type works

## Test Suite 3: MCP Server (FastMCP)

### 3.1 Server Health
```bash
# Check MCP server (if running as separate service)
curl http://localhost:8001/health
```

- [ ] MCP server responds
- [ ] Tools endpoint accessible

### 3.2 MCP Tools
- [ ] add_task tool available
- [ ] list_tasks tool available
- [ ] update_task tool available
- [ ] delete_task tool available
- [ ] add_tag tool available
- [ ] schedule_reminder tool available

## Test Suite 4: Frontend (Next.js)

### 4.1 Access Frontend
```bash
# Get frontend URL
minikube service evolution-todo-frontend -n todo-app
```

- [ ] Frontend loads successfully
- [ ] No JavaScript errors in console
- [ ] Authentication flow works (if implemented)

### 4.2 Phase 5 UI - Quick Filters (T059)
- [ ] "Due Today" filter chip visible
- [ ] "Due This Week" filter chip visible
- [ ] Clicking filter updates task list
- [ ] Active filter highlighted

### 4.3 Phase 5 UI - Priority Features (T032-T036)
- [ ] Priority selector in task creation form
- [ ] Priority badge displays on task items
- [ ] Priority colors correct (high=red, medium=yellow, low=green)
- [ ] Filter by priority works

### 4.4 Phase 5 UI - Tag Features (T043-T047)
- [ ] Tag manager component visible
- [ ] Can create new tags with colors
- [ ] Tags display as badges on tasks
- [ ] Tag filter chips work

### 4.5 Phase 5 UI - Due Date & Reminders (T055-T058)
- [ ] Due date picker in task form
- [ ] Reminder scheduler component
- [ ] Due date displays on task items
- [ ] Overdue indicator shows (red text/icon)

### 4.6 Phase 5 UI - Recurring Tasks (T065-T067)
- [ ] Recurring pattern selector visible
- [ ] Recurring indicator badge on task items
- [ ] Next occurrence date displays

### 4.7 Phase 5 UI - Search (T071-T073)
- [ ] Search input with debouncing
- [ ] Search updates task list
- [ ] Search state persists in store

## Test Suite 5: Event-Driven Features (Kafka + Dapr)

### 5.1 Dapr Sidecars
```bash
# Check Dapr sidecars
kubectl get pods -n todo-app | grep daprd
```

- [ ] All services have Dapr sidecar (if Dapr enabled)
- [ ] Dapr sidecars healthy

### 5.2 Event Publishing
```bash
# Check Dapr logs for event publishing
kubectl logs -n todo-app <backend-pod> -c daprd | grep "Published"
```

- [ ] Task created → event published to task-events
- [ ] Task updated → event published to task-events
- [ ] Task deleted → event published to task-events
- [ ] Reminder scheduled → event published to reminder-events

### 5.3 Event Consumption
```bash
# Check notification service logs
kubectl logs -n todo-app <notification-service-pod> | grep "Received event"
```

- [ ] Notification service receives task events
- [ ] Audit service receives task events
- [ ] WebSocket service receives task-updates events

### 5.4 Kafka Messages
```bash
# Consume messages from Kafka topic
kubectl exec -n kafka todo-kafka-cluster-dual-role-0 -- \
  /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic task-events \
  --from-beginning --max-messages 10
```

- [ ] Messages visible in task-events topic
- [ ] Messages visible in reminder-events topic
- [ ] Messages visible in task-updates topic
- [ ] CloudEvents format correct

## Test Suite 6: WebSocket Real-time Sync (T127-T132)

### 6.1 WebSocket Connection
- [ ] WebSocket service running
- [ ] WebSocket endpoint accessible (ws://localhost:8005/ws)
- [ ] Connection establishes successfully

### 6.2 Real-time Sync
**Test Steps:**
1. Open frontend in Browser Tab 1
2. Open frontend in Browser Tab 2
3. In Tab 1: Create a new task
4. In Tab 2: Verify task appears automatically
5. In Tab 1: Update the task
6. In Tab 2: Verify update appears automatically
7. In Tab 1: Delete the task
8. In Tab 2: Verify task disappears automatically

- [ ] Task created syncs to other tabs
- [ ] Task updated syncs to other tabs
- [ ] Task deleted syncs to other tabs
- [ ] Task completed syncs to other tabs

### 6.3 Toast Notifications (T132)
- [ ] "Task created" toast appears
- [ ] "Task updated" toast appears
- [ ] "Task deleted" toast appears
- [ ] Toasts auto-dismiss after 3 seconds
- [ ] Clicking toast navigates to task (if applicable)

### 6.4 Reconnection Logic (T131)
**Test Steps:**
1. Establish WebSocket connection
2. Restart WebSocket service
3. Verify client reconnects automatically

- [ ] Reconnection attempts with exponential backoff
- [ ] Connection re-establishes after service restart
- [ ] Max retry limit respected (10 retries)

## Test Suite 7: Monitoring & Observability (T162-T169)

### 7.1 Prometheus
```bash
# Port forward Prometheus
kubectl port-forward -n todo-app svc/evolution-todo-prometheus 9090:9090
# Access: http://localhost:9090
```

- [ ] Prometheus UI accessible
- [ ] Scraping targets are UP
- [ ] Metrics available (http_requests_total, etc.)
- [ ] Kafka metrics visible

### 7.2 Grafana
```bash
# Port forward Grafana
kubectl port-forward -n todo-app svc/evolution-todo-grafana 3000:3000
# Access: http://localhost:3000 (admin/admin)
```

- [ ] Grafana UI accessible
- [ ] Prometheus datasource configured
- [ ] Pod metrics dashboard loads
- [ ] Kafka consumer lag dashboard loads

### 7.3 Dapr Dashboard
```bash
# Port forward Dapr Dashboard
kubectl port-forward -n todo-app svc/evolution-todo-dapr-dashboard 8080:8080
# Access: http://localhost:8080
```

- [ ] Dapr Dashboard accessible
- [ ] All services visible
- [ ] Component status correct

### 7.4 Alerting Rules
```bash
# Check alerting rules in Prometheus
# Navigate to Status → Rules
```

- [ ] HighLatency rule configured
- [ ] HighErrorRate rule configured
- [ ] HighCPUUsage rule configured
- [ ] KafkaConsumerLag rule configured

## Test Suite 8: Performance & Load

### 8.1 Basic Load Test
```bash
# Create 100 tasks
for i in {1..100}; do
  curl -X POST http://localhost:8000/api/tasks \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Load Test Task $i\"}" &
done
wait
```

- [ ] All tasks created successfully
- [ ] Response time < 500ms (p95)
- [ ] No errors in logs
- [ ] Database handles concurrent writes

### 8.2 Real-time Sync Load
**Test Steps:**
1. Open 5 browser tabs
2. Create/update/delete tasks rapidly in Tab 1
3. Verify all tabs stay in sync

- [ ] WebSocket connections stable with multiple clients
- [ ] No message loss
- [ ] UI remains responsive

## Test Suite 9: Error Handling & Edge Cases

### 9.1 Validation
- [ ] Cannot create task without title
- [ ] Invalid priority rejected
- [ ] Invalid recurring pattern rejected
- [ ] Invalid date format rejected

### 9.2 Error Responses
- [ ] 404 for non-existent task
- [ ] 400 for invalid request body
- [ ] 500 errors logged properly
- [ ] Error messages are user-friendly

### 9.3 Edge Cases
- [ ] Creating task with past due date
- [ ] Scheduling past-due reminder (T118)
- [ ] Completing recurring task generates next occurrence
- [ ] Searching with special characters
- [ ] Filtering with empty results

## Test Suite 10: Data Persistence

### 10.1 Database Persistence
**Test Steps:**
1. Create tasks, tags, reminders
2. Restart backend pod: `kubectl rollout restart deployment/backend -n todo-app`
3. Verify data persists

- [ ] Tasks survive pod restart
- [ ] Tags survive pod restart
- [ ] Reminders survive pod restart
- [ ] Audit logs survive pod restart

### 10.2 Kafka Persistence
**Test Steps:**
1. Publish events
2. Restart Kafka pod
3. Consume events

- [ ] Events survive Kafka restart
- [ ] Consumer offsets preserved

## Summary

**Total Tests**: ~150  
**Passed**: ___ / 150  
**Failed**: ___ / 150  
**Skipped**: ___ / 150

## Issues Found

| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## Notes

- Add any observations, performance metrics, or recommendations here
- Document any configuration changes made during testing
- List any features that need additional work

---

**Tester**: Claude  
**Date Completed**: _______________  
**Sign-off**: _______________

