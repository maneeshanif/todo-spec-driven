#!/bin/bash
# Quickstart Validation Script
# Validates that the development environment is set up correctly

set -e  # Exit on error

echo "🧪 Todo Web App - Quickstart Validation"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Function to check command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        $1 --version | head -1
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        ((ERRORS++))
    fi
    echo ""
}

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
    else
        echo -e "${RED}✗${NC} $1 is missing"
        ((ERRORS++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
    else
        echo -e "${RED}✗${NC} $1 is missing"
        ((ERRORS++))
    fi
}

# Check Prerequisites
echo "📋 Step 1: Checking Prerequisites"
echo "----------------------------------"
check_command python3
check_command node
check_command npm
check_command git
check_command uv

# Check Project Structure
echo "📁 Step 2: Checking Project Structure"
echo "--------------------------------------"
check_dir "backend"
check_dir "frontend"
check_dir "specs"
check_file "README.md"
check_file "DEPLOYMENT.md"
echo ""

# Check Backend Setup
echo "🐍 Step 3: Checking Backend Setup"
echo "----------------------------------"
cd backend

check_file "pyproject.toml"
check_file ".env.example"
check_file "alembic.ini"
check_dir "src"
check_dir "src/models"
check_dir "src/api"
check_dir "src/core"
check_dir "alembic"

# Check if dependencies are installed
if [ -d ".venv" ] || uv pip list &> /dev/null; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC}  Backend dependencies not installed. Run: uv sync"
fi
echo ""

cd ..

# Check Frontend Setup
echo "⚛️  Step 4: Checking Frontend Setup"
echo "-----------------------------------"
cd frontend

check_file "package.json"
check_file ".env.example"
check_file "next.config.ts"
check_file "tsconfig.json"
check_dir "app"
check_dir "components"
check_dir "lib"
check_dir "stores"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC}  Frontend dependencies not installed. Run: npm install"
fi
echo ""

cd ..

# Check Environment Variables
echo "🔐 Step 5: Checking Environment Variables"
echo "-----------------------------------------"

if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} backend/.env exists"

    if grep -q "DATABASE_URL" backend/.env; then
        echo -e "${GREEN}✓${NC} DATABASE_URL is configured"
    else
        echo -e "${RED}✗${NC} DATABASE_URL is missing in backend/.env"
        ((ERRORS++))
    fi

    if grep -q "JWT_SECRET_KEY" backend/.env; then
        echo -e "${GREEN}✓${NC} JWT_SECRET_KEY is configured"
    else
        echo -e "${YELLOW}⚠${NC}  JWT_SECRET_KEY is missing (will use default)"
    fi
else
    echo -e "${YELLOW}⚠${NC}  backend/.env not found. Copy from .env.example"
fi
echo ""

if [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✓${NC} frontend/.env.local exists"

    if grep -q "NEXT_PUBLIC_API_URL" frontend/.env.local; then
        echo -e "${GREEN}✓${NC} NEXT_PUBLIC_API_URL is configured"
    else
        echo -e "${RED}✗${NC} NEXT_PUBLIC_API_URL is missing"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC}  frontend/.env.local not found (optional)"
fi
echo ""

# Check if services can start (optional - requires services to be stopped first)
echo "🚀 Step 6: Service Availability Check (Optional)"
echo "------------------------------------------------"
echo "To test if services can start, run:"
echo ""
echo "Backend:  cd backend && uv run uvicorn src.main:app"
echo "Frontend: cd frontend && npm run dev"
echo ""

# API Documentation Check
echo "📚 Step 7: API Documentation"
echo "----------------------------"
if grep -q "openapi" backend/src/main.py 2>/dev/null; then
    echo -e "${GREEN}✓${NC} FastAPI auto-documentation enabled"
    echo "  Available at: http://localhost:8000/docs"
else
    echo -e "${YELLOW}⚠${NC}  Could not verify API documentation setup"
fi
echo ""

# Summary
echo "📊 Validation Summary"
echo "===================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start backend:  cd backend && uv run uvicorn src.main:app --reload"
    echo "2. Start frontend: cd frontend && npm run dev"
    echo "3. Visit: http://localhost:3000"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    echo "Refer to quickstart.md for detailed setup instructions."
    echo ""
    exit 1
fi
