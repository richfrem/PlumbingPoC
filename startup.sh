#!/bin/bash
# Startup script for PlumbingPOC: starts backend and frontend, checks ports, and ensures correct sequence
# Usage: ./startup.sh [--netlify] [--help]
#   --netlify: Use netlify dev for full environment (includes functions for SMS testing)
#   --help: Show this help message

# Load environment variables from .env
set -a
source .env
set +a

# Configurable ports (now loaded from .env)
BACKEND_PORT=${BACKEND_PORT:-3000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# Parse command line arguments
USE_NETLIFY=false
if [[ "$1" == "--netlify" ]]; then
    USE_NETLIFY=true
    echo "Using Netlify Dev mode (includes SMS function support)"
elif [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --netlify    Use netlify dev for full environment (includes functions for SMS testing)"
    echo "  --help, -h   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0           Start frontend/backend separately (default)"
    echo "  $0 --netlify Start with netlify dev (for SMS testing)"
    exit 0
fi

# Helper to check if port is free
is_port_free() {
  ! lsof -i :$1 >/dev/null 2>&1
}

if [[ "$USE_NETLIFY" == true ]]; then
    # Netlify Dev mode - runs frontend/backend separately + netlify dev for SMS testing
    echo "Starting with Netlify Dev mode (separate terminals for all services)..."

    # Kill any existing processes
    kill $(pgrep -f "netlify dev") 2>/dev/null || true
    kill $(lsof -t -i:$BACKEND_PORT) 2>/dev/null || true
    kill $(lsof -t -i:$FRONTEND_PORT) 2>/dev/null || true
    sleep 2

    # Start backend API (Express/Node) in a new terminal
    echo "Starting backend API on port $BACKEND_PORT..."
    osascript -e 'tell application "Terminal" to do script "cd ~/Projects/PlumbingPOC/vite-app/api && BACKEND_PORT='$BACKEND_PORT' node server.js"'
    sleep 2

    # Start frontend (Vite) in a new terminal
    echo "Starting frontend (Vite) on port $FRONTEND_PORT..."
    osascript -e 'tell application "Terminal" to do script "cd ~/Projects/PlumbingPOC && PORT='$FRONTEND_PORT' npm run dev"'
    sleep 2

    # Start netlify dev in a new terminal
    echo "Starting Netlify Dev for SMS function support..."
    osascript -e 'tell application "Terminal" to do script "cd ~/Projects/PlumbingPOC && npx netlify dev"'

    echo "All services started in separate terminals!"
    echo "Backend: http://localhost:$BACKEND_PORT"
    echo "Frontend: http://localhost:$FRONTEND_PORT"
    echo "Netlify Dev: Check the new terminal for the port (usually 8888)"
    echo "SMS functions are now available for testing!"

else
    # Standard mode - separate frontend/backend
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
    osascript -e 'tell application "Terminal" to do script "cd ~/Projects/PlumbingPOC/vite-app/api && BACKEND_PORT='$BACKEND_PORT' node server.js"'
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
    echo "Note: SMS functions not available in this mode. Use --netlify for SMS testing."
fi
