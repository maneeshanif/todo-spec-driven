# Task CRUD Feature Specification

**Feature**: Task Management  
**Version**: 1.0  
**Phase**: Phase 2  
**Author**: Spec-Driven Development  
**Date**: December 2024

---

## Overview

This specification defines the core task management functionality for the Todo Web Application, including Create, Read, Update, and Delete operations with user isolation.

---

## User Stories

### US-001: Create Task
**As a** logged-in user  
**I want to** create a new task  
**So that** I can track things I need to do

**Acceptance Criteria:**
- User can enter task title (required)
- User can enter task description (optional)
- Task is created with `completed: false`
- Task is associated with the current user
- User receives confirmation of creation

### US-002: View Tasks
**As a** logged-in user  
**I want to** view all my tasks  
**So that** I can see what needs to be done

**Acceptance Criteria:**
- User sees only their own tasks
- Tasks display title, description, status
- Tasks show creation date
- Empty state shown when no tasks exist

### US-003: Update Task
**As a** logged-in user  
**I want to** edit my tasks  
**So that** I can correct or update information

**Acceptance Criteria:**
- User can edit title and description
- Changes are saved immediately
- User receives confirmation of update

### US-004: Complete Task
**As a** logged-in user  
**I want to** mark tasks as complete/incomplete  
**So that** I can track progress

**Acceptance Criteria:**
- Single click toggles completion status
- Visual feedback indicates completed tasks
- Completed tasks can be uncompleted

### US-005: Delete Task
**As a** logged-in user  
**I want to** delete tasks  
**So that** I can remove items I no longer need

**Acceptance Criteria:**
- Confirmation prompt before deletion
- Task is permanently removed
- User receives confirmation of deletion

---

## Data Model

### Task Entity

```python
class Task(SQLModel, table=True):
    __tablename__ = "tasks"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### Field Constraints

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| id | int | Auto | Primary key, auto-increment |
| user_id | string | Yes | Foreign key to users.id |
| title | string | Yes | 1-200 characters |
| description | string | No | 0-1000 characters |
| completed | boolean | Yes | Default: false |
| created_at | datetime | Yes | Auto-set on create |
| updated_at | datetime | Yes | Auto-updated on modify |

---

## API Endpoints

### GET /api/{user_id}/tasks

List all tasks for a user.

**Authentication:** Required  
**Authorization:** User can only access their own tasks

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| completed | boolean | - | Filter by completion status |
| sort | string | created_at | Sort field |
| order | string | desc | Sort order (asc/desc) |
| limit | int | 50 | Max results |
| offset | int | 0 | Pagination offset |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "user_id": "uuid",
        "title": "Buy groceries",
        "description": "Milk, eggs, bread",
        "completed": false,
        "created_at": "2024-12-01T10:00:00Z",
        "updated_at": "2024-12-01T10:00:00Z"
      }
    ],
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

### POST /api/{user_id}/tasks

Create a new task.

**Authentication:** Required  
**Authorization:** User can only create tasks for themselves

**Request:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

**Validation:**
- `title`: Required, 1-200 characters, trimmed
- `description`: Optional, max 1000 characters

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T10:00:00Z"
  }
}
```

**Errors:**
- `400`: Validation error
- `401`: Unauthorized
- `403`: Forbidden (user_id mismatch)

### GET /api/{user_id}/tasks/{task_id}

Get a single task.

**Authentication:** Required  
**Authorization:** User can only access their own tasks

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T10:00:00Z"
  }
}
```

**Errors:**
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Task not found

### PUT /api/{user_id}/tasks/{task_id}

Update a task (full replacement).

**Authentication:** Required  
**Authorization:** User can only update their own tasks

**Request:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, cheese",
  "completed": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread, cheese",
    "completed": false,
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-02T15:30:00Z"
  }
}
```

### PATCH /api/{user_id}/tasks/{task_id}/complete

Toggle task completion status.

**Authentication:** Required  
**Authorization:** User can only modify their own tasks

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "completed": true,
    "updated_at": "2024-12-02T15:30:00Z"
  }
}
```

### DELETE /api/{user_id}/tasks/{task_id}

Delete a task permanently.

**Authentication:** Required  
**Authorization:** User can only delete their own tasks

**Response (204):**
No content

**Errors:**
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Task not found

---

## Business Rules

### User Isolation

1. All task queries MUST filter by `user_id`
2. User can only access tasks where `task.user_id == current_user.id`
3. API MUST verify `user_id` path parameter matches JWT user
4. Violation results in `403 Forbidden`

### Validation Rules

| Rule | Error Message |
|------|---------------|
| Title empty | "Title is required" |
| Title > 200 chars | "Title must be 200 characters or less" |
| Description > 1000 chars | "Description must be 1000 characters or less" |
| Invalid task_id | "Task not found" |

### Timestamps

- `created_at`: Set once on creation, never modified
- `updated_at`: Updated on any modification (PUT, PATCH)

---

## Frontend Integration

### Task State Management

```typescript
interface Task {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}
```

### API Client

```typescript
const taskApi = {
  list: (userId: string, params?: TaskFilters) => 
    api.get(`/api/${userId}/tasks`, { params }),
  
  create: (userId: string, data: TaskCreate) => 
    api.post(`/api/${userId}/tasks`, data),
  
  get: (userId: string, taskId: number) => 
    api.get(`/api/${userId}/tasks/${taskId}`),
  
  update: (userId: string, taskId: number, data: TaskUpdate) => 
    api.put(`/api/${userId}/tasks/${taskId}`, data),
  
  toggleComplete: (userId: string, taskId: number) => 
    api.patch(`/api/${userId}/tasks/${taskId}/complete`),
  
  delete: (userId: string, taskId: number) => 
    api.delete(`/api/${userId}/tasks/${taskId}`),
};
```

### Optimistic Updates

For better UX, implement optimistic updates:

```typescript
const toggleComplete = async (taskId: number) => {
  // Optimistically update UI
  setTasks(tasks.map(t => 
    t.id === taskId ? { ...t, completed: !t.completed } : t
  ));
  
  try {
    await taskApi.toggleComplete(userId, taskId);
  } catch (error) {
    // Revert on failure
    setTasks(originalTasks);
    showError("Failed to update task");
  }
};
```

---

## UI Components

### Task List

- Display tasks in cards or list items
- Show completion checkbox
- Show title prominently
- Show description (truncated if long)
- Show created date
- Provide edit/delete actions

### Task Form

- Title input (required)
- Description textarea (optional)
- Submit button
- Clear/cancel button
- Validation messages

### Empty State

- Friendly message when no tasks
- Call-to-action to create first task
- Illustration (optional)

---

## Performance Considerations

### Pagination

- Default limit: 50 tasks
- Maximum limit: 100 tasks
- Use offset-based pagination
- Consider cursor-based for large datasets

### Caching

- Cache task list on frontend
- Invalidate on create/update/delete
- Use React Query or SWR for cache management

### Database Indexes

```sql
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);
```

---

## Testing Requirements

### Unit Tests

- [ ] Task model validation
- [ ] Task service CRUD operations
- [ ] Authorization checks

### Integration Tests

- [ ] Create task via API
- [ ] List tasks with filters
- [ ] Update task via API
- [ ] Toggle completion via API
- [ ] Delete task via API
- [ ] User isolation enforcement

### Frontend Tests

- [ ] Task list rendering
- [ ] Create task form
- [ ] Edit task functionality
- [ ] Delete confirmation
- [ ] Optimistic updates

---

## Error Codes

| Code | Message | HTTP Status |
|------|---------|-------------|
| TASK_001 | Task not found | 404 |
| TASK_002 | Validation error | 400 |
| TASK_003 | Access denied | 403 |
| TASK_004 | Title required | 400 |
| TASK_005 | Title too long | 400 |
