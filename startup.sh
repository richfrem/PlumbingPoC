#!/bin/bash
# Startup script for PlumbingPOC: starts backend and frontend, checks ports, and ensures correct sequence

# Configurable ports
BACKEND_PORT=3000
FRONTEND_PORT=5173

# Helper to check if port is free
is_port_free() {
  ! lsof -i :$1 >/dev/null 2>&1
}

# Kill any existing processes on the ports to ensure clean restart
echo "Freeing ports $BACKEND_PORT and $FRONTEND_PORT..."
kill $(lsof -t -i:$BACKEND_PORT) $(lsof -t -i:$FRONTEND_PORT) 2>/dev/null || true
sleep 2  # Give processes time to shut down

# Verify ports are now free
if ! is_port_free $BACKEND_PORT; then
  echo "Error: Could not free backend port $BACKEND_PORT"
  exit 1
fi

if ! is_port_free $FRONTEND_PORT; then
  echo "Error: Could not free frontend port $FRONTEND_PORT"
  exit 1
fi

# Start backend API (Express/Node) in a new terminal
echo "Starting backend API on port $BACKEND_PORT..."
osascript -e 'tell application "Terminal" to do script "cd ~/Projects/PlumbingPOC/vite-app/api && PORT='$BACKEND_PORT' node server.js"'
sleep 2

# Confirm backend started
if ! lsof -i :$BACKEND_PORT >/dev/null 2>&1; then
  echo "Error: Backend did not start correctly. Check logs."
  exit 1
fi

# Start frontend (Vite) in a new terminal
echo "Starting frontend (Vite) on port $FRONTEND_PORT..."
osascript -e 'tell application "Terminal" to do script "cd ~/Projects/PlumbingPOC && PORT='$FRONTEND_PORT' npm run dev"'
sleep 2

# Confirm frontend started
if ! lsof -i :$FRONTEND_PORT >/dev/null 2>&1; then
  echo "Error: Frontend did not start correctly. Check logs."
  exit 1
fi

echo "Both services started successfully."
echo "Backend: http://localhost:$BACKEND_PORT"
echo "Frontend: http://localhost:$FRONTEND_PORT"
