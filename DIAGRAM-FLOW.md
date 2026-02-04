# TaskWhisper - Architecture & Flow Diagrams

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │    User      │
                              │  (Browser)   │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
            ┌───────────┐    ┌───────────┐    ┌───────────┐
            │   Login   │    │   Chat    │    │   Tasks   │
            │  /signup  │    │   Page    │    │   Page    │
            └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
                  │                │                │
                  └────────────────┼────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js :3000)                                │
│  • Better Auth (login/signup)                                               │
│  • Zustand stores (auth, tasks, conversations)                              │
│  • ChatKit UI for AI chat                                                   │
│  • SSE streaming for real-time responses                                    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │ REST API + SSE Streaming  │
                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI :8000)                                 │
│  • JWT validation (Better Auth JWKS)                                        │
│  • Task CRUD endpoints (/api/{user_id}/tasks)                               │
│  • Chat endpoints (/api/{user_id}/chat/stream)                              │
│  • AI Agent orchestration (OpenAI Agents SDK + Gemini)                      │
└──────────────┬──────────────────────────────────┬───────────────────────────┘
               │                                  │
               │ MCP Protocol                     │ SQLModel ORM
               ▼                                  ▼
┌──────────────────────────┐        ┌──────────────────────────┐
│   MCP SERVER (:8001)     │        │   POSTGRESQL (:5432)     │
│  • FastMCP framework     │        │  • Users table           │
│  • 5 task tools:         │        │  • Tasks table           │
│    - add_task            │        │  • Conversations table   │
│    - list_tasks          │        │  • Messages table        │
│    - complete_task       │        │  • Tags, Reminders, etc  │
│    - delete_task         │        │                          │
│    - update_task         │        │  (Neon serverless or     │
│  • Reminder tools        │        │   local PostgreSQL)      │
└──────────────────────────┘        └──────────────────────────┘
```

---

## Event-Driven Architecture (Phase 5)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EVENT-DRIVEN FLOW WITH DAPR + KAFKA                      │
└─────────────────────────────────────────────────────────────────────────────┘

  User creates/updates/deletes task
                │
                ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         BACKEND POD                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Backend Container (:8000)                         │  │
│  │                                                                      │  │
│  │   1. Receives API request                                           │  │
│  │   2. Saves to PostgreSQL                                            │  │
│  │   3. Publishes event via Dapr HTTP API                              │  │
│  │      POST http://localhost:3500/v1.0/publish/kafka-pubsub/task-events│  │
│  │                                                                      │  │
│  └──────────────────────────────┬──────────────────────────────────────┘  │
│                                 │                                          │
│                                 │ localhost:3500                           │
│                                 ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Dapr Sidecar Container (:3500)                    │  │
│  │                                                                      │  │
│  │   • Intercepts publish request                                      │  │
│  │   • Serializes event to CloudEvents format                          │  │
│  │   • Sends to Kafka broker                                           │  │
│  │                                                                      │  │
│  └──────────────────────────────┬──────────────────────────────────────┘  │
└─────────────────────────────────┼──────────────────────────────────────────┘
                                  │
                                  │ Kafka Protocol (9092)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KAFKA CLUSTER (Strimzi)                             │
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │ task-events │  │  reminders  │  │audit-events │  │task-updates │       │
│   │   topic     │  │   topic     │  │   topic     │  │   topic     │       │
│   │ (3 parts)   │  │ (2 parts)   │  │ (2 parts)   │  │ (3 parts)   │       │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│          │                │                │                │               │
└──────────┼────────────────┼────────────────┼────────────────┼───────────────┘
           │                │                │                │
           ▼                ▼                ▼                ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                    CONSUMER MICROSERVICES                     │
    └──────────────────────────────────────────────────────────────┘
```

---

## Microservices Pod Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES WITH DAPR SIDECARS                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION SERVICE POD (:8002)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Notification Container                                  │   │
│  │  • Subscribes to: reminders, task-updates                           │   │
│  │  • Sends email/push notifications                                   │   │
│  │  • Endpoint: POST /dapr/subscribe (Dapr calls this)                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Dapr Sidecar (:3500)                                    │   │
│  │  • Subscribes to Kafka topics                                       │   │
│  │  • Delivers messages to app via HTTP POST                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    RECURRING TASK SERVICE POD (:8003)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Recurring Task Container                                │   │
│  │  • Subscribes to: task-events                                       │   │
│  │  • Creates next occurrence for recurring tasks                      │   │
│  │  • Publishes new task-events                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Dapr Sidecar (:3500)                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUDIT SERVICE POD (:8004)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Audit Container                                         │   │
│  │  • Subscribes to: task-events, audit-events                         │   │
│  │  • Logs all operations to audit_logs table                          │   │
│  │  • Compliance and tracking                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Dapr Sidecar (:3500)                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    WEBSOCKET SERVICE POD (:8005)                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              WebSocket Container                                     │   │
│  │  • Subscribes to: task-updates                                      │   │
│  │  • Maintains WebSocket connections with clients                     │   │
│  │  • Pushes real-time updates to browsers                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Dapr Sidecar (:3500)                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Event Flow (Task Creation Example)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              COMPLETE FLOW: User Creates Task via Chat                      │
└─────────────────────────────────────────────────────────────────────────────┘

User: "Add task: Buy groceries tomorrow"
                │
                ▼
┌───────────────────────────────────────┐
│ 1. FRONTEND                           │
│    POST /api/{user}/chat/stream       │
│    Body: {message: "Add task..."}     │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│ 2. BACKEND                            │
│    • Validates JWT                    │
│    • Sends to AI Agent (Gemini)       │
│    • Agent decides: call add_task     │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│ 3. MCP SERVER                         │
│    • Receives add_task(title, date)   │
│    • INSERT INTO tasks                │
│    • Returns {task_id: 123}           │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│ 4. BACKEND (Event Publishing)         │
│    POST localhost:3500/v1.0/publish   │
│    /kafka-pubsub/task-events          │
│    Body: {                            │
│      event_type: "created",           │
│      task_id: 123,                    │
│      user_id: "user-uuid",            │
│      data: {title, due_date, ...}     │
│    }                                  │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│ 5. DAPR SIDECAR                       │
│    • Wraps in CloudEvents             │
│    • Publishes to Kafka               │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│ 6. KAFKA                              │
│    • Stores in task-events topic      │
│    • Partitions by user_id            │
└───────────────┬───────────────────────┘
                │
        ┌───────┴───────┬───────────────┬───────────────┐
        │               │               │               │
        ▼               ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 7a. AUDIT    │ │ 7b. RECURRING│ │ 7c. WEBSOCKET│ │ 7d. NOTIF    │
│    SERVICE   │ │    SERVICE   │ │    SERVICE   │ │    SERVICE   │
│              │ │              │ │              │ │              │
│ Logs event   │ │ If recurring:│ │ Pushes to    │ │ If reminder: │
│ to DB        │ │ schedule next│ │ connected    │ │ queue email  │
└──────────────┘ └──────────────┘ │ browsers     │ └──────────────┘
                                  └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ 8. FRONTEND  │
                                  │ WebSocket    │
                                  │ receives     │
                                  │ update       │
                                  │              │
                                  │ UI refreshes │
                                  │ automatically│
                                  └──────────────┘
```

---

## Kubernetes Service Communication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KUBERNETES SERVICE MESH                                  │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────────────┐
                         │      INGRESS CONTROLLER     │
                         │      (nginx / todo.local)   │
                         └─────────────┬───────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ frontend-service    │  │ backend-service     │  │ mcp-server-service  │
│ ClusterIP :80       │  │ ClusterIP :8000     │  │ ClusterIP :8001     │
│         │           │  │         │           │  │         │           │
│         ▼           │  │         ▼           │  │         ▼           │
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │
│ │ Frontend Pod    │ │  │ │ Backend Pod     │ │  │ │ MCP Server Pod  │ │
│ │ (Next.js)       │ │  │ │ (FastAPI)       │ │  │ │ (FastMCP)       │ │
│ └─────────────────┘ │  │ │ + Dapr Sidecar  │ │  │ └─────────────────┘ │
└─────────────────────┘  │ └─────────────────┘ │  └─────────────────────┘
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
      ┌─────────────────────┐         ┌─────────────────────┐
      │ postgres-service    │         │ kafka-bootstrap     │
      │ ClusterIP :5432     │         │ ClusterIP :9092     │
      │         │           │         │         │           │
      │         ▼           │         │         ▼           │
      │ ┌─────────────────┐ │         │ ┌─────────────────┐ │
      │ │ PostgreSQL Pod  │ │         │ │ Kafka Broker    │ │
      │ └─────────────────┘ │         │ │ (Strimzi)       │ │
      └─────────────────────┘         │ └─────────────────┘ │
                                      └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONSUMER SERVICES (Subscribe via Dapr)                   │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│ notification-svc    │ recurring-task-svc  │ audit-svc    │ websocket-svc   │
│ :8002               │ :8003               │ :8004        │ :8005           │
│ + Dapr Sidecar      │ + Dapr Sidecar      │ + Dapr       │ + Dapr          │
└─────────────────────┴─────────────────────┴──────────────┴─────────────────┘
```

---

## Dapr Component Configuration

```yaml
# How Dapr connects services to Kafka
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DAPR COMPONENTS (dapr-components/)                       │
└─────────────────────────────────────────────────────────────────────────────┘

pubsub-kafka.yaml:
┌─────────────────────────────────────────┐
│ apiVersion: dapr.io/v1alpha1            │
│ kind: Component                         │
│ metadata:                               │
│   name: kafka-pubsub                    │
│ spec:                                   │
│   type: pubsub.kafka                    │
│   metadata:                             │
│     - name: brokers                     │
│       value: "kafka-bootstrap:9092"     │
│     - name: consumerGroup               │
│       value: "{appid}-group"            │
└─────────────────────────────────────────┘
           │
           │ Dapr reads this config
           │ and creates pub/sub binding
           ▼
┌─────────────────────────────────────────┐
│ Backend publishes:                      │
│   POST localhost:3500/v1.0/publish      │
│        /kafka-pubsub/task-events        │
│                                         │
│ Consumers subscribe:                    │
│   @app.subscribe(pubsub="kafka-pubsub", │
│                  topic="task-events")   │
│   def handle_event(event):              │
│       ...                               │
└─────────────────────────────────────────┘
```

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✅ Running | Next.js on :3000 |
| Backend | ✅ Running | FastAPI on :8000 |
| MCP Server | ✅ Running | FastMCP on :8001 |
| PostgreSQL | ✅ Running | Local pod :5432 |
| Kafka | ✅ Running | Strimzi cluster |
| Dapr | ✅ Installed | Needs sidecar config |
| Notification Service | ⏳ Pending | Code fix needed |
| Recurring Task Service | ⏳ Pending | Code fix needed |
| Audit Service | ⏳ Pending | Code fix needed |
| WebSocket Service | ⏳ Pending | Code fix needed |

---

## Port Reference

| Service | Internal Port | External (port-forward) |
|---------|---------------|------------------------|
| Frontend | 80 | 3000 |
| Backend | 8000 | 8000 |
| MCP Server | 8001 | 8001 |
| PostgreSQL | 5432 | 5432 |
| Adminer | 8080 | 8082 |
| Grafana | 80 | 3001 |
| Prometheus | 9090 | 9090 |
| Kafka UI | 8080 | 8080 |
| Dapr Dashboard | 8080 | 9999 |
| Notification | 8002 | - |
| Recurring Task | 8003 | - |
| Audit | 8004 | - |
| WebSocket | 8005 | - |
