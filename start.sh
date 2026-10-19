#!/usr/bin/env bash
# PlantCare AI — Launcher script for Backend and Frontend

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting PlantCare AI..."

# Free up ports 8000 and 8080 if in use
fuser -k 8000/tcp 2>/dev/null
fuser -k 8080/tcp 2>/dev/null

# 1. Start Backend
echo "Starting Backend on http://localhost:8000..."
cd "$SCRIPT_DIR/backend"
if [ ! -d "venv" ]; then
    echo "Virtual environment not found! Creating..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# 2. Start Frontend
echo "Starting Frontend on http://localhost:8080..."
cd "$SCRIPT_DIR/frontend"
python3 -m http.server 8080 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "  🌱 PlantCare AI is running!"
echo "  🌐 Frontend:  http://localhost:8080"
echo "  ⚡ Backend:   http://localhost:8000"
echo "  📖 API Docs:  http://localhost:8000/docs"
echo "=========================================================="
echo "Press [Ctrl+C] to stop all servers."
echo ""

# Handle shutdown gracefully
cleanup() {
    echo ""
    echo "Stopping PlantCare AI servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT
wait
