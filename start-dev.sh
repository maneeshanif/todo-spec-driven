#!/bin/bash
# Unified development server startup script
# Starts both backend (FastAPI) and frontend (Next.js) concurrently

set -e

echo "🚀 Starting Todo Web Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Check if backend .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: backend/.env not found${NC}"
    echo "Creating from example..."
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        echo "✅ Created backend/.env - Please configure DATABASE_URL and JWT_SECRET_KEY"
    else
        echo "❌ backend/.env.example not found. Please create backend/.env manually"
    fi
    echo ""
fi

# Check if frontend .env.local exists
if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    echo -e "${YELLOW}⚠️  Warning: frontend/.env.local not found${NC}"
    echo "Creating default configuration..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > "$FRONTEND_DIR/.env.local"
    echo "✅ Created frontend/.env.local"
    echo ""
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    jobs -p | xargs -r kill 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}🔧 Starting Backend (FastAPI on port 8000)...${NC}"
cd "$BACKEND_DIR"
uv run uvicorn src.main:app --reload --port 8000 --host 0.0.0.0 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo "   Logs: tail -f backend.log"
echo ""

# Wait a bit for backend to start
sleep 2

# Start frontend
echo -e "${GREEN}🎨 Starting Frontend (Next.js on port 3000)...${NC}"
cd "$FRONTEND_DIR"
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
echo "   Logs: tail -f frontend.log"
echo ""

# Show status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Application is running!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Frontend:  http://localhost:3000"
echo "📍 Backend:   http://localhost:8000"
echo "📍 API Docs:  http://localhost:8000/api/docs"
echo "📍 Health:    http://localhost:8000/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Monitor logs in split view
echo "📊 Monitoring logs (Ctrl+C to stop)..."
echo ""

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID
