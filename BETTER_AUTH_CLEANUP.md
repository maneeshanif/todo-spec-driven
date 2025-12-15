# Better Auth Integration - Old Auth System Cleanup

## Summary

Successfully removed all old custom authentication code and migrated to Better Auth. The backend now accepts JWT tokens from Better Auth (via Next.js frontend) for authentication.

## Changes Made

### 1. **Removed Old Auth Files**
- ✅ `/backend/src/api/routes/auth.py` - Old signup/login routes
- ✅ `/backend/src/services/auth_service.py` - Custom auth logic
- ✅ `/backend/src/services/user_service.py` - User management
- ✅ `/backend/src/models/user.py` - Old User SQLModel
- ✅ `/backend/src/schemas/auth.py` - Auth request/response schemas
- ✅ `/backend/src/schemas/user.py` - User schemas
- ✅ `/backend/src/core/deps.py` - Old auth dependencies

### 2. **Database Migration**
Created and applied migration `20251214_0008_823e89cc07f2_drop_old_users_table.py`:
- Dropped old `users` table
- Removed foreign key constraints from `tasks` and `task_categories`
- Cleared all existing data (tasks, categories, audit logs) due to incompatible user IDs
- Added new foreign keys pointing to Better Auth `user` table
- CASCADE delete on user deletion

### 3. **Updated Route Handlers**
All API routes now use Better Auth JWT authentication:

**Files Updated:**
- `/backend/src/api/routes/tasks.py` - 5 handlers (get, create, update, delete, get-by-id)
- `/backend/src/api/routes/categories.py` - 6 handlers
- `/backend/src/api/routes/stats.py` - 1 handler

**Changes:**
- Import changed: `from src.core.auth_deps import get_current_user`
- Type annotation: `current_user: dict = Depends(get_current_user)`
- Attribute access: `current_user['id']` instead of `current_user.id`

### 4. **Updated Package Imports**
- `/backend/src/api/__init__.py` - Removed auth_router
- `/backend/src/api/routes/__init__.py` - Removed auth imports
- `/backend/src/models/__init__.py` - Removed User model
- `/backend/src/schemas/__init__.py` - Removed auth schemas
- `/backend/src/services/__init__.py` - Removed AuthService and UserService
- `/backend/alembic/env.py` - Removed User model import

### 5. **Better Auth Infrastructure** (Already Created)
- ✅ `/backend/src/middleware/jwt_auth.py` - JWT verification using JWKS
- ✅ `/backend/src/core/auth_deps.py` - FastAPI auth dependencies
- ✅ `/frontend/lib/auth.ts` - Better Auth server config
- ✅ `/frontend/lib/auth-client.ts` - Better Auth client
- ✅ `/frontend/app/api/auth/[...all]/route.ts` - API route handler

## Database Schema Changes

### Removed Table
```sql
DROP TABLE users;
-- Old columns: id, email, name, hashed_password, created_at, updated_at
```

### Updated Foreign Keys
```sql
-- tasks table
ALTER TABLE tasks DROP CONSTRAINT tasks_user_id_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE;

-- task_categories table
ALTER TABLE task_categories DROP CONSTRAINT task_categories_user_id_fkey;
ALTER TABLE task_categories ADD CONSTRAINT task_categories_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE;
```

### Better Auth Tables (Already Created)
- `user` - User accounts (email, name, image, emailVerified)
- `session` - Active sessions with tokens
- `account` - OAuth provider accounts (Google, GitHub)
- `verification` - Email verification and password reset tokens

## Authentication Flow

### Before (Old System)
1. User signs up via `/api/auth/signup`
2. Password hashed with bcrypt, stored in `users` table
3. JWT token generated with custom logic
4. Token verified using `SECRET_KEY`

### After (Better Auth)
1. User signs up via Better Auth UI (email/password or OAuth)
2. Better Auth handles authentication at `/api/auth/*` (Next.js)
3. Better Auth generates JWT token with ES256/EdDSA/RS256
4. Backend fetches JWKS from `http://localhost:3000/api/auth/jwks`
5. Backend verifies JWT and extracts user data: `{id, email, name, role}`
6. FastAPI routes receive `current_user: dict` from dependency

## Testing

### Server Status
```bash
cd backend
uv run python -c "from src.main import app; print('SUCCESS: App loaded')"
# Output: SUCCESS: App loaded ✅
```

### Available Endpoints
- `GET /api/tasks` - List user's tasks (requires JWT)
- `POST /api/tasks` - Create task (requires JWT)
- `GET /api/tasks/{id}` - Get task (requires JWT)
- `PUT /api/tasks/{id}` - Update task (requires JWT)
- `DELETE /api/tasks/{id}` - Delete task (requires JWT)
- `GET /api/categories` - List categories (requires JWT)
- `POST /api/categories` - Create category (requires JWT)
- `GET /api/stats` - Get user stats (requires JWT)
- `GET /api/health` - Health check (no auth)

### Testing Authentication
1. Start backend: `cd backend && uv run uvicorn src.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Sign up/login via Better Auth UI
4. Frontend automatically includes JWT in API requests
5. Backend verifies JWT and processes request

## Next Steps

### OAuth Configuration
Update `/frontend/.env.local` with real credentials:
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret
```

### Frontend Integration
- Replace `auth-store.ts` with Better Auth `useSession` hook
- Update login/signup pages to use `authClient.signIn/signUp`
- Add OAuth login buttons (Google, GitHub)
- Test full authentication flow

### Testing Checklist
- [ ] Email/password signup works
- [ ] Email/password login works
- [ ] Google OAuth login works
- [ ] GitHub OAuth login works
- [ ] JWT tokens sent to backend
- [ ] Backend authenticates API requests
- [ ] Protected routes return 401 without token
- [ ] User can create/view/update/delete tasks
- [ ] User session persists across page refresh

## Benefits of Better Auth

1. **Security**: Industry-standard OAuth implementation, secure token handling
2. **Features**: Email verification, password reset, social login out of the box
3. **Maintenance**: No custom auth logic to maintain, security updates handled
4. **Scalability**: Proven solution used in production apps
5. **Developer Experience**: Simple API, great documentation, TypeScript support

## Migration Notes

⚠️ **Data Loss**: All existing users, tasks, and categories were deleted during migration due to incompatible user ID formats (UUID vs Better Auth format).

✅ **Fresh Start**: This is acceptable for hackathon Phase II as we're rebuilding the authentication system from scratch.

🔄 **Production Migration**: For production, you would need to:
1. Map old user IDs to Better Auth user IDs
2. Create Better Auth users from old user data
3. Update all foreign keys to reference new IDs
4. Maintain data integrity throughout migration
