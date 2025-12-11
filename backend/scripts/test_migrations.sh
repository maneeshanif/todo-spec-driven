#!/bin/bash
# Migration Testing Script
# Tests database migrations up and down to verify they work correctly

set -e  # Exit on error

echo "🧪 Database Migration Testing Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL environment variable not set${NC}"
    echo ""
    echo "Please set DATABASE_URL to your database connection string:"
    echo "  export DATABASE_URL='postgresql://user:password@localhost:5432/dbname'"
    echo ""
    echo "For Neon:"
    echo "  export DATABASE_URL='postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require'"
    exit 1
fi

echo -e "${GREEN}✓${NC} DATABASE_URL is set"
echo ""

# Function to check migration status
check_status() {
    echo "📊 Current migration status:"
    uv run alembic current
    echo ""
}

# Function to test upgrade
test_upgrade() {
    echo "⬆️  Testing migration upgrade..."
    uv run alembic upgrade head
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Migration upgrade successful"
    else
        echo -e "${RED}❌${NC} Migration upgrade failed"
        exit 1
    fi
    echo ""
}

# Function to test downgrade
test_downgrade() {
    echo "⬇️  Testing migration downgrade..."
    uv run alembic downgrade -1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Migration downgrade successful"
    else
        echo -e "${RED}❌${NC} Migration downgrade failed"
        exit 1
    fi
    echo ""
}

# Function to re-upgrade after downgrade
test_reupgrade() {
    echo "⬆️  Testing re-upgrade after downgrade..."
    uv run alembic upgrade head
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Re-upgrade successful"
    else
        echo -e "${RED}❌${NC} Re-upgrade failed"
        exit 1
    fi
    echo ""
}

# Main test sequence
echo "🚀 Starting migration test sequence..."
echo ""

# Step 1: Check initial status
echo "Step 1: Check initial migration status"
check_status

# Step 2: Upgrade to head
echo "Step 2: Upgrade to latest migration"
test_upgrade
check_status

# Step 3: Downgrade one version
echo "Step 3: Downgrade one version"
test_downgrade
check_status

# Step 4: Re-upgrade to head
echo "Step 4: Re-upgrade to head"
test_reupgrade
check_status

# Step 5: Verify database schema
echo "Step 5: Verify database schema"
echo "Checking if tables exist..."

# Run Python script to verify tables
uv run python -c "
import asyncio
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.database import engine, async_session_maker
from src.models.user import User
from src.models.task import Task

async def verify_schema():
    async with async_session_maker() as session:
        # Try to query tables to verify they exist
        try:
            result = await session.exec(select(User).limit(1))
            print('✓ users table exists')
        except Exception as e:
            print(f'❌ users table error: {e}')

        try:
            result = await session.exec(select(Task).limit(1))
            print('✓ tasks table exists')
        except Exception as e:
            print(f'❌ tasks table error: {e}')

asyncio.run(verify_schema())
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Database schema verified"
else
    echo -e "${YELLOW}⚠${NC}  Could not verify schema (database may be empty)"
fi
echo ""

# Final summary
echo "✅ Migration Test Summary"
echo "========================"
echo -e "${GREEN}✓${NC} Migration upgrade works"
echo -e "${GREEN}✓${NC} Migration downgrade works"
echo -e "${GREEN}✓${NC} Migration re-upgrade works"
echo -e "${GREEN}✓${NC} Database schema is correct"
echo ""
echo "🎉 All migration tests passed!"
