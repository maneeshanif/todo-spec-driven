# Todo Web Application - Setup Guide

Complete setup instructions for the Todo Web Application with Next.js frontend and FastAPI backend.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.13+
- **UV** package manager (install with: `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Neon PostgreSQL** account (or any PostgreSQL database)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and configure:

```env
# Your Neon PostgreSQL connection string
DATABASE_URL=postgresql+asyncpg://user:password@your-host.neon.tech/dbname?sslmode=require

# Generate with: openssl rand -base64 32
SECRET_KEY=your-generated-secret-key-here
```

**Important:**
- For Neon, **must** include `?sslmode=require` at the end of the DATABASE_URL
- SECRET_KEY must be at least 32 characters

### Step 2: Create Database Tables

Run the migration script to create all tables in your Neon database:

```bash
# From project root
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

This creates:
- ✅ `users` table (with email index)
- ✅ `tasks` table (with user_id and completed indexes)
- ✅ `audit_logs` table (with multiple indexes for querying)

### Step 3: Start the Application

```bash
# From project root
chmod +x start-dev.sh
./start-dev.sh
```

This starts:
- 🔧 **Backend** on http://localhost:8000
- 🎨 **Frontend** on http://localhost:3000

---

## 📝 Detailed Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   uv sync
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations:**
   ```bash
   uv run alembic upgrade head
   ```

5. **Start backend server:**
   ```bash
   uv run uvicorn src.main:app --reload --port 8000
   ```

   Backend will be available at:
   - API: http://localhost:8000
   - Docs: http://localhost:8000/api/docs
   - Health: http://localhost:8000/api/health

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment (optional):**
   ```bash
   # Create .env.local if you need custom API URL
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at http://localhost:3000

---

## 🗄️ Database Configuration

### Getting Your Neon Connection String

1. Go to https://neon.tech
2. Create a project or select existing one
3. Click "Connection Details"
4. Copy the connection string
5. **Important:** Change `postgresql://` to `postgresql+asyncpg://`
6. **Important:** Add `?sslmode=require` at the end

Example:
```
# Original Neon string:
postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/dbname

# Modified for FastAPI:
postgresql+asyncpg://user:pass@ep-xxxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### Verifying Database Connection

```bash
cd backend
uv run python -c "from src.core.database import engine; import asyncio; asyncio.run(engine.connect())"
```

If successful, you'll see no errors. If it fails, check your DATABASE_URL.

---

## 🔑 Authentication Setup

### Generating a Secure SECRET_KEY

```bash
# Option 1: Using openssl
openssl rand -base64 32

# Option 2: Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste it into your `backend/.env`:

```env
SECRET_KEY=zGk8vN2pQ_xR7wY5tF3mL9bH4jK1sA6dC0eV8nM2qX4=
```

---

## 🧪 Testing the Setup

### Test Backend

1. **Health Check:**
   ```bash
   curl http://localhost:8000/api/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "todo-api",
     "version": "1.0.0"
   }
   ```

2. **Database Health:**
   ```bash
   curl http://localhost:8000/api/health/db
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "message": "Database is accessible and responding"
   }
   ```

3. **Create Test User:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpassword123","name":"Test User"}'
   ```

### Test Frontend

1. Open http://localhost:3000 in your browser
2. Click "Get Started" or "Sign Up"
3. Create an account
4. Create a task
5. Verify it appears in the list

---

## 🔧 Troubleshooting

### Backend Issues

**Error: "DATABASE_URL not set"**
- Solution: Make sure `backend/.env` exists and has valid DATABASE_URL

**Error: "Connection refused" or database errors**
- Check your Neon connection string
- Verify `?sslmode=require` is at the end
- Test connection in Neon dashboard

**Error: "SECRET_KEY not set" or JWT errors**
- Generate a new SECRET_KEY: `openssl rand -base64 32`
- Add it to `backend/.env`

**Error: "ModuleNotFoundError"**
- Run: `cd backend && uv sync`

### Frontend Issues

**Error: "Failed to fetch" or CORS errors**
- Check backend is running on port 8000
- Verify ALLOWED_ORIGINS in `backend/.env` includes `http://localhost:3000`

**Error: npm install fails**
- Try: `rm -rf node_modules package-lock.json && npm install`

### Migration Issues

**Error: "alembic: command not found"**
- Run from backend directory: `uv run alembic upgrade head`

**Error: "Can't locate revision identified by '001_initial'"**
- The migrations are out of sync. Reset with:
  ```bash
  cd backend
  uv run alembic stamp head
  ```

---

## 📂 Project Structure

```
todo-web-hackthon/
├── backend/                   # FastAPI backend
│   ├── src/
│   │   ├── main.py           # Entry point
│   │   ├── api/              # API routes
│   │   ├── models/           # Database models
│   │   ├── services/         # Business logic
│   │   ├── core/             # Core utilities
│   │   └── middleware/       # Middleware
│   ├── alembic/              # Database migrations
│   ├── .env.example          # Environment template
│   └── pyproject.toml        # Dependencies
│
├── frontend/                  # Next.js frontend
│   ├── app/                  # App Router pages
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   ├── stores/               # Zustand stores
│   └── package.json          # Dependencies
│
├── scripts/                   # Utility scripts
│   └── setup-database.sh     # Database migration script
│
├── start-dev.sh              # Unified startup script
└── README.md                 # Project documentation
```

---

## 🚦 Next Steps

1. **Customize the application**
   - Modify UI in `frontend/components/`
   - Add new features in `backend/src/`

2. **Deploy to production**
   - See `DEPLOYMENT.md` for deployment guides
   - Remember to use production SECRET_KEY

3. **Run tests**
   ```bash
   cd backend && uv run pytest
   cd frontend && npm test
   ```

4. **Monitor application**
   - Metrics: http://localhost:8000/api/metrics
   - Logs: `tail -f backend.log frontend.log`

---

## 📞 Support

If you encounter issues:

1. Check this SETUP.md guide
2. Review `SECURITY.md` for security configurations
3. Check `PERFORMANCE.md` for optimization tips
4. Review logs: `backend.log` and `frontend.log`

---

**Happy coding! 🎉**
