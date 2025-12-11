# REST API Specification

**API Version**: 1.0  
**Base URL**: `http://localhost:8000/api` (dev) | `https://api.todoapp.com/api` (prod)  
**Phase**: Phase 2  
**Date**: December 2024

---

## Overview

This document specifies all REST API endpoints for the Todo Web Application backend.

---

## Authentication

All protected endpoints require JWT Bearer authentication:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `/api/auth/login` or `/api/auth/signup`.

---

## Base Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

---

## Authentication Endpoints

### POST /api/auth/signup

Create a new user account.

| Property | Value |
|----------|-------|
| Auth Required | No |
| Rate Limit | 3/min |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 604800
  }
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Validation failed |
| 409 | EMAIL_EXISTS | Email already registered |

---

### POST /api/auth/login

Authenticate existing user.

| Property | Value |
|----------|-------|
| Auth Required | No |
| Rate Limit | 5/min |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 604800
  }
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 401 | INVALID_CREDENTIALS | Invalid email or password |

---

### POST /api/auth/logout

Invalidate current session.

| Property | Value |
|----------|-------|
| Auth Required | Yes |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /api/auth/refresh

Refresh access token.

| Property | Value |
|----------|-------|
| Auth Required | No |
| Rate Limit | 10/min |

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 604800
  }
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 401 | INVALID_TOKEN | Invalid or expired refresh token |

---

### GET /api/auth/me

Get current user profile.

| Property | Value |
|----------|-------|
| Auth Required | Yes |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2024-12-01T10:00:00Z"
  }
}
```

---

## Task Endpoints

### GET /api/{user_id}/tasks

List all tasks for a user.

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| User Isolation | Yes (must match JWT user) |

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| user_id | string | User UUID |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| completed | boolean | - | Filter by status |
| sort | string | created_at | Sort field |
| order | string | desc | asc or desc |
| limit | int | 50 | Max results (1-100) |
| offset | int | 0 | Pagination offset |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Buy groceries",
        "description": "Milk, eggs, bread",
        "completed": false,
        "created_at": "2024-12-01T10:00:00Z",
        "updated_at": "2024-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 50,
      "offset": 0,
      "has_more": false
    }
  }
}
```

---

### POST /api/{user_id}/tasks

Create a new task.

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| User Isolation | Yes |

**Request Body:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| title | Required, 1-200 chars |
| description | Optional, max 1000 chars |

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T10:00:00Z"
  }
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Title is required |
| 403 | ACCESS_DENIED | Cannot create tasks for other users |

---

### GET /api/{user_id}/tasks/{task_id}

Get a single task.

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| User Isolation | Yes |

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| user_id | string | User UUID |
| task_id | int | Task ID |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T10:00:00Z"
  }
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | Task not found |

---

### PUT /api/{user_id}/tasks/{task_id}

Update a task (full replacement).

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| User Isolation | Yes |

**Request Body:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, cheese",
  "completed": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread, cheese",
    "completed": false,
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-02T15:30:00Z"
  }
}
```

---

### PATCH /api/{user_id}/tasks/{task_id}/complete

Toggle task completion status.

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| User Isolation | Yes |

**Response (200 OK):**
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

---

### DELETE /api/{user_id}/tasks/{task_id}

Delete a task permanently.

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| User Isolation | Yes |

**Response (204 No Content):**
Empty body

---

## Health Check

### GET /api/health

Check API health status.

| Property | Value |
|----------|-------|
| Auth Required | No |

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Rate Limits

| Endpoint Category | Limit |
|-------------------|-------|
| Auth endpoints | 5-10/min |
| Task read | 100/min |
| Task write | 30/min |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

---

## CORS Configuration

Allowed origins:
- `http://localhost:3000` (development)
- `https://todoapp.vercel.app` (production)

Allowed methods:
- GET, POST, PUT, PATCH, DELETE, OPTIONS

Allowed headers:
- Content-Type
- Authorization

---

## OpenAPI Documentation

Auto-generated Swagger docs available at:
- Development: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
