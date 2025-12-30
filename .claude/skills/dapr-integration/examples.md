# Dapr Integration Examples

## Example 1: Publish Task Created Event

```python
from dapr.clients import DaprClient
import json
from datetime import datetime

async def publish_task_created(task_id: str, user_id: str, task_data: dict):
    """Publish task created event to Kafka via Dapr."""
    with DaprClient() as client:
        client.publish_event(
            pubsub_name="taskpubsub",
            topic_name="task-events",
            data=json.dumps({
                "event_type": "task.created",
                "task_id": task_id,
                "user_id": user_id,
                "task": task_data,
                "timestamp": datetime.utcnow().isoformat()
            }),
            data_content_type="application/json"
        )
```

## Example 2: Subscribe to Task Events

```python
from fastapi import FastAPI
from dapr.ext.fastapi import DaprApp

app = FastAPI()
dapr_app = DaprApp(app)

@dapr_app.subscribe(pubsub="taskpubsub", topic="task-events")
async def handle_task_event(event: dict):
    """Handle incoming task events."""
    event_type = event.get("event_type")
    task_data = event.get("task")
    user_id = event.get("user_id")

    match event_type:
        case "task.created":
            # Log to audit service
            await log_audit(f"Task created: {task_data['title']}", user_id)
        case "task.completed":
            # Send notification
            await send_notification(user_id, f"Task completed: {task_data['title']}")
        case "task.deleted":
            # Archive for compliance
            await archive_task(task_data)
```

## Example 3: State Management

```python
from dapr.clients import DaprClient
import json

class SessionStore:
    """Manage user sessions via Dapr state store."""

    def __init__(self):
        self.store_name = "statestore"

    async def save_session(self, session_id: str, user_data: dict):
        """Save user session to state store."""
        with DaprClient() as client:
            client.save_state(
                store_name=self.store_name,
                key=f"session:{session_id}",
                value=json.dumps(user_data),
                state_metadata={"ttlInSeconds": "3600"}  # 1 hour TTL
            )

    async def get_session(self, session_id: str) -> dict | None:
        """Retrieve user session from state store."""
        with DaprClient() as client:
            state = client.get_state(
                store_name=self.store_name,
                key=f"session:{session_id}"
            )
            return json.loads(state.data) if state.data else None

    async def delete_session(self, session_id: str):
        """Delete user session from state store."""
        with DaprClient() as client:
            client.delete_state(
                store_name=self.store_name,
                key=f"session:{session_id}"
            )
```

## Example 4: Service Invocation

```python
from dapr.clients import DaprClient
import json

async def invoke_notification_service(user_id: str, message: str, channel: str = "email"):
    """Invoke notification service via Dapr service invocation."""
    with DaprClient() as client:
        response = client.invoke_method(
            app_id="notification-service",
            method_name="send",
            data=json.dumps({
                "user_id": user_id,
                "message": message,
                "channel": channel
            }),
            http_verb="POST",
            content_type="application/json"
        )
        return response.json()

async def get_user_preferences(user_id: str):
    """Get user preferences from user service."""
    with DaprClient() as client:
        response = client.invoke_method(
            app_id="user-service",
            method_name=f"users/{user_id}/preferences",
            http_verb="GET"
        )
        return response.json()
```

## Example 5: Secret Management

```python
from dapr.clients import DaprClient
import os

class SecretManager:
    """Manage secrets via Dapr secrets store."""

    def __init__(self):
        self.store_name = os.getenv("SECRET_STORE", "kubernetes-secrets")

    async def get_secret(self, secret_name: str) -> dict:
        """Get secret from Dapr secrets store."""
        with DaprClient() as client:
            secret = client.get_secret(
                store_name=self.store_name,
                key=secret_name
            )
            return secret.secret

    async def get_database_url(self) -> str:
        """Get database URL from secrets."""
        secrets = await self.get_secret("database-credentials")
        return secrets.get("DATABASE_URL", "")

    async def get_api_key(self, service: str) -> str:
        """Get API key for a service."""
        secrets = await self.get_secret(f"{service}-api-key")
        return secrets.get("API_KEY", "")

# Usage
secret_manager = SecretManager()
db_url = await secret_manager.get_database_url()
gemini_key = await secret_manager.get_api_key("gemini")
```

## Example 6: Kubernetes Component Configuration

```yaml
# dapr-components/pubsub.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: taskpubsub
  namespace: todo-app
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "todo-kafka-kafka-bootstrap.kafka.svc.cluster.local:9092"
    - name: consumerGroup
      value: "todo-consumer-group"
    - name: authType
      value: "none"
scopes:
  - backend
  - notification-service
  - recurring-service
  - audit-service
---
# dapr-components/statestore.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
  namespace: todo-app
spec:
  type: state.redis
  version: v1
  metadata:
    - name: redisHost
      value: "redis:6379"
    - name: actorStateStore
      value: "true"
scopes:
  - backend
---
# dapr-components/secrets.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
  namespace: todo-app
spec:
  type: secretstores.kubernetes
  version: v1
```

## Example 7: Local Development with Dapr

```bash
#!/bin/bash
# scripts/run-with-dapr.sh

# Run backend with Dapr sidecar
dapr run \
  --app-id backend \
  --app-port 8000 \
  --dapr-http-port 3500 \
  --components-path ./dapr-components \
  --config ./dapr-components/config.yaml \
  -- uv run uvicorn src.main:app --host 0.0.0.0 --port 8000

# In another terminal, run notification service
dapr run \
  --app-id notification-service \
  --app-port 8002 \
  --dapr-http-port 3502 \
  --components-path ./dapr-components \
  -- uv run uvicorn services.notification.main:app --host 0.0.0.0 --port 8002
```

## Example 8: Testing Pub/Sub

```bash
# Publish a test event
dapr publish \
  --publish-app-id backend \
  --pubsub taskpubsub \
  --topic task-events \
  --data '{"event_type":"task.created","task_id":"123","user_id":"456","task":{"title":"Test Task"}}'

# Check Dapr logs
dapr logs --app-id backend --kubernetes

# List Dapr components
dapr components --kubernetes -n todo-app
```
