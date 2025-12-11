#!/bin/bash
# Database setup script - Creates all tables in Neon PostgreSQL

set -e  # Exit on error

echo "🗄️  Setting up database tables..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found in backend directory"
    echo "Please create backend/.env with your DATABASE_URL"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env file"
    echo "Please add: DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname?sslmode=require"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "📍 Database: ${DATABASE_URL%%@*}@***"  # Hide credentials
echo ""

# Check current migration status
echo "📊 Checking current migration status..."
uv run alembic current || true
echo ""

# Show pending migrations
echo "📋 Pending migrations:"
uv run alembic heads
echo ""

# Run migrations
echo "🚀 Running migrations..."
uv run alembic upgrade head

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Tables created:"
echo "  - users (with email index)"
echo "  - tasks (with user_id and completed indexes)"
echo "  - audit_logs (with multiple indexes)"
echo ""
echo "You can now start the application with: npm run dev (from root)"
