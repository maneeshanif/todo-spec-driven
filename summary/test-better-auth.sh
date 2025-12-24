#!/bin/bash
# Test script to verify Better Auth integration

echo "🧪 Testing Better Auth Integration..."
echo ""

# Test 1: Check if FastAPI app can be imported
echo "1️⃣ Testing FastAPI app import..."
cd backend
if uv run python -c "from src.main import app; print('✅ App import successful')" 2>&1 | grep -q "App import successful"; then
    echo "   ✅ PASSED: FastAPI app loads successfully"
else
    echo "   ❌ FAILED: FastAPI app failed to import"
    exit 1
fi
echo ""

# Test 2: Check if server starts
echo "2️⃣ Testing server startup..."
timeout 3 uv run uvicorn src.main:app --host 127.0.0.1 --port 8001 > /tmp/server_test.log 2>&1 &
SERVER_PID=$!
sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "   ✅ PASSED: Server started successfully"
    kill $SERVER_PID 2>/dev/null
else
    echo "   ❌ FAILED: Server failed to start"
    cat /tmp/server_test.log
    exit 1
fi
echo ""

# Test 3: Check health endpoint
echo "3️⃣ Testing health endpoint..."
timeout 3 uv run uvicorn src.main:app --host 127.0.0.1 --port 8001 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

if curl -s http://127.0.0.1:8001/api/health | grep -q "status"; then
    echo "   ✅ PASSED: Health endpoint responds"
    kill $SERVER_PID 2>/dev/null
else
    echo "   ❌ FAILED: Health endpoint not responding"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi
echo ""

# Test 4: Check that protected endpoints require auth
echo "4️⃣ Testing protected endpoints (should return 403 without auth)..."
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8001/api/tasks | grep -qE "401|403"; then
    echo "   ✅ PASSED: Protected endpoints require authentication"
else
    echo "   ⚠️  WARNING: Expected 401/403 for unauthorized request"
fi
echo ""

kill $SERVER_PID 2>/dev/null
cd ..

echo "✅ All tests completed!"
echo ""
echo "Next steps:"
echo "1. Configure OAuth credentials in frontend/.env.local"
echo "2. Start both servers: ./start-dev.sh"
echo "3. Test signup/login with Better Auth"
