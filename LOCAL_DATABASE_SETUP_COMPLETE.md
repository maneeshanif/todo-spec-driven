# Local Database Setup - COMPLETE ✅

**Date**: January 1, 2026
**Status**: PostgreSQL deployed and migrations applied successfully

---

## ✅ Database Status

Your local PostgreSQL database in Minikube is now fully configured with all tables!

### Database Connection

- **Host**: `localhost:5432` (via port-forward)
- **Database**: `todo`
- **Username**: `postgres`
- **Password**: `postgres`
- **Connection String**: `postgresql://postgres:postgres@localhost:5432/todo`
- **Async Connection**: `postgresql+asyncpg://postgres:postgres@localhost:5432/todo`

### Tables Created

All 13 tables have been created via Alembic migrations:

| Table | Purpose |
|-------|---------|
| `user` | Better Auth users |
| `account` | Better Auth OAuth accounts |
| `session` | Better Auth sessions |
| `verification` | Better Auth email verification |
| `tasks` | Todo tasks with priorities, due dates, recurring |
| `task_categories` | Task categories |
| `task_category_mappings` | Task-category relationships |
| `tags` | Task tags with colors |
| `task_tags` | Task-tag relationships (junction table) |
| `reminders` | Task reminders |
| `conversations` | AI chat conversations |
| `messages` | AI chat messages |
| `alembic_version` | Migration tracking |

---

## 🔧 Migrations Applied

All Alembic migrations have been successfully applied:

```
✅ initial schema
✅ add_intermediate_features
✅ update_tables_with_enhanced_fields
✅ add_better_auth_tables
✅ drop_old_users_table
✅ cleanup_database_tables
✅ Add conversations and messages tables (Phase 3)
✅ Add Phase 5 models: tags, task_tags, reminders
```

---

## 🎯 How to Use the Application

### Option 1: Use Frontend (Recommended for Testing UI)

The frontend at http://localhost:3000 should now work with the local database!

**Steps:**
1. Open http://localhost:3000 in your browser
2. Sign up for a new account (since this is a fresh database)
3. Start creating tasks!

**Note**: The frontend uses Better Auth for authentication, which connects to the local PostgreSQL database.

### Option 2: Use Backend API Directly

Test the API endpoints directly:

```bash
# Check API health
curl http://localhost:8000/api/health

# View API documentation
open http://localhost:8000/api/docs
# OR
curl http://localhost:8000/api/docs
```

### Option 3: Use MCP Server (for AI Agent)

The MCP server has direct database access:

```bash
# Check MCP health
curl http://localhost:8001/health

# MCP tools available:
# - add_task, list_tasks, complete_task, delete_task, update_task
# - add_tag, list_tags, delete_tag, tag_task, untag_task
# - schedule_reminder, list_reminders, cancel_reminder, get_upcoming_reminders
# - list_recurring, skip_occurrence, stop_recurrence
```

---

## 🗄️ Database Management

### Connect to PostgreSQL

```bash
# Via kubectl exec
kubectl exec -it -n todo-app postgres-7c569b59f9-6dxrp -- psql -U postgres -d todo

# Via psql with port-forward (if you have psql installed)
psql -h localhost -p 5432 -U postgres -d todo
# Password: postgres
```

### Common SQL Queries

```sql
-- List all tables
\dt

-- Count tasks
SELECT COUNT(*) FROM tasks;

-- List all users
SELECT id, email, name, created_at FROM "user";

-- View tasks with details
SELECT id, title, completed, priority, due_date, created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;

-- View tags
SELECT id, name, color, created_at FROM tags;

-- View task-tag relationships
SELECT t.title, tg.name, tg.color
FROM tasks t
JOIN task_tags tt ON t.id = tt.task_id
JOIN tags tg ON tt.tag_id = tg.id;

-- View reminders
SELECT r.id, t.title, r.remind_at, r.status
FROM reminders r
JOIN tasks t ON r.task_id = t.id
ORDER BY r.remind_at;
```

### Create Test Data

```sql
-- Create a test user (if not using Better Auth signup)
-- Note: Better Auth handles user creation, so prefer using the frontend signup

-- Create a test task (requires user_id)
INSERT INTO tasks (user_id, title, description, completed, priority, created_at, updated_at)
VALUES ('test-user-id', 'My First Task', 'This is a test task', false, 'high', NOW(), NOW());

-- Create a tag
INSERT INTO tags (user_id, name, color, created_at)
VALUES ('test-user-id', 'Important', '#ff0000', NOW());
```

---

## 🔄 Running Migrations Again

If you need to re-run migrations (e.g., after adding new models):

```bash
# From your local machine
cd backend

# Create new migration
uv run alembic revision --autogenerate -m "description of changes"

# Apply migrations to local database
kubectl exec -n todo-app evolution-todo-todo-app-backend-c44474455-hxzdc -- alembic upgrade head
```

---

## 🐛 Troubleshooting

### Issue: Frontend shows "Network Error" or "Connection Refused"

**Solution**: Make sure all port-forwards are running:
```bash
# Check if port-forwards are active
ps aux | grep "kubectl port-forward"

# Restart port-forwards if needed
kubectl port-forward -n todo-app svc/evolution-todo-todo-app-frontend 3000:80 &
kubectl port-forward -n todo-app svc/evolution-todo-todo-app-backend 8000:8000 &
kubectl port-forward -n todo-app svc/postgres 5432:5432 &
```

### Issue: "Database connection error"

**Solution**: Verify PostgreSQL is running:
```bash
kubectl get pods -n todo-app | grep postgres
kubectl logs -n todo-app postgres-7c569b59f9-6dxrp
```

### Issue: "Table does not exist"

**Solution**: Run migrations:
```bash
kubectl exec -n todo-app evolution-todo-todo-app-backend-c44474455-hxzdc -- alembic upgrade head
```

### Issue: "Authentication failed" or "Invalid credentials"

**Solution**:
1. This is a fresh database - you need to sign up for a new account
2. The frontend uses Better Auth which stores users in the local PostgreSQL `user` table
3. Go to http://localhost:3000 and sign up with a new account

**Check if user was created:**
```bash
kubectl exec -n todo-app postgres-7c569b59f9-6dxrp -- psql -U postgres -d todo -c "SELECT email, name FROM \"user\";"
```

---

## 🔐 Important Notes

### Local vs Production Database

**Current Setup (Local Testing):**
- PostgreSQL pod running in Minikube
- Database URL: `postgresql+asyncpg://postgres:postgres@postgres:5432/todo`
- Data is NOT persistent (lost when pod is deleted)
- Use for local development and testing only

**Phase 2-4 Setup (Neon):**
- Neon Serverless PostgreSQL (cloud)
- Data persists across deployments
- Used for production/staging environments

### Data Persistence

⚠️ **WARNING**: Data in the local PostgreSQL pod is NOT persistent!

If you delete the pod or namespace, all data will be lost.

To make data persistent, you need to:
1. Configure PersistentVolumeClaim (PVC) - Already done in `helm/todo-app/templates/postgresql.yaml`
2. The PVC is bound to a PersistentVolume (PV) in Minikube

**Check PVC status:**
```bash
kubectl get pvc -n todo-app
```

---

## ✅ Next Steps

Now that your database is set up:

1. **Test the Frontend**:
   - Open http://localhost:3000
   - Sign up for a new account
   - Create some tasks, add tags, set reminders

2. **Test the API**:
   - Explore http://localhost:8000/api/docs
   - Try creating tasks via API

3. **Test the MCP Server**:
   - Use the MCP tools to manipulate tasks
   - Check http://localhost:8001/health

4. **Explore the Database**:
   - Connect with psql and run queries
   - Inspect the data structure

---

## 📚 Related Documentation

- **Full Deployment**: `PHASE5_LOCAL_DEPLOYMENT_COMPLETE.md`
- **Port-Forward Reference**: `ACTIVE_PORTFORWARDS.txt`
- **Database Schema**: `backend/alembic/versions/`
- **Models**: `backend/src/models/`

---

**Database Setup: COMPLETE! 🎉**
All tables created, migrations applied, ready for use!
