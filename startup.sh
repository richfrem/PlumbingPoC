#!/bin/bash
# Startup script for PlumbingPOC: starts both frontend and backend services
# Usage: ./startup.sh [--help]
#   --help: Show this help message

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
    echo -e "${BLUE}✓${NC} Loaded environment variables from .env"
else
    echo -e "${YELLOW}⚠${NC} No .env file found, using default values"
fi

# Configurable ports
BACKEND_PORT=${BACKEND_PORT:-3000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# Parse command line arguments
USE_NETLIFY=false
if [[ "$1" == "--netlify" ]]; then
    USE_NETLIFY=true
    echo -e "${BLUE}ℹ${NC} Using Netlify Dev mode (includes SMS function support)"
elif [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "PlumbingPOC Development Startup Script"
    echo "Starts both frontend (Vite) and backend (ESM Node.js) services"
    echo ""
    echo "Options:"
    echo "  --netlify    Use netlify dev for full environment (includes functions for SMS testing)"
    echo "  --help, -h   Show this help message"
    echo ""
    echo "Services:"
    echo "  Frontend: http://localhost:$FRONTEND_PORT (Vite dev server)"
    echo "  Backend:  http://localhost:$BACKEND_PORT (Pure ESM API)"
    if command -v netlify &> /dev/null; then
        echo "  Netlify:  Usually http://localhost:8888 (when using --netlify)"
    fi
    echo ""
    echo "Environment Variables:"
    echo "  BACKEND_PORT   Backend server port (default: 3000)"
    echo "  FRONTEND_PORT  Frontend dev server port (default: 5173)"
    echo ""
    exit 0
fi

echo -e "${BLUE}🚀${NC} Starting PlumbingPOC Development Environment"
echo -e "${BLUE}═══${NC}═══════════════════════════════════════════════"
echo ""

# Function to check if port is in use
is_port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -t -i:$port 2>/dev/null || echo "")
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚡${NC} Killing process on port $port (PID: $pid)"
        kill $pid 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${BLUE}⏳${NC} Waiting for $service_name to be ready on port $port..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} $service_name is ready on port $port"
            return 0
        fi
        echo -e "${BLUE}⋯${NC} Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        ((attempt++))
    done

    echo -e "${RED}✗${NC} $service_name failed to start within $(($max_attempts * 2)) seconds"
    return 1
}

# Clean up any existing processes
echo -e "${YELLOW}🧹${NC} Cleaning up existing processes..."
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

# Kill any existing npm processes
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "node api/server.js" 2>/dev/null || true
sleep 3

# Verify ports are free
if is_port_in_use $BACKEND_PORT; then
    echo -e "${RED}✗${NC} Port $BACKEND_PORT is still in use. Please free it manually."
    exit 1
fi

if is_port_in_use $FRONTEND_PORT; then
    echo -e "${RED}✗${NC} Port $FRONTEND_PORT is still in use. Please free it manually."
    exit 1
fi

if [[ "$USE_NETLIFY" == true ]]; then
    # Netlify Dev mode - runs all services with Netlify for SMS testing
    echo -e "${BLUE}🚀${NC} Starting with Netlify Dev mode..."
    echo -e "${BLUE}═══${NC}═══════════════════════════════════════════════"

    # Kill any existing processes
    pkill -f "netlify dev" 2>/dev/null || true
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    sleep 3

    # Check if Netlify CLI is available
    if ! command -v netlify &> /dev/null; then
        echo -e "${RED}✗${NC} Netlify CLI not found. Install with: npm install -g netlify-cli"
        exit 1
    fi

    # Start Netlify dev (this will handle both frontend and backend routing)
    echo -e "${BLUE}⏳${NC} Starting Netlify Dev..."
    npx netlify dev &
    NETLIFY_PID=$!

    # Wait for Netlify to be ready
    sleep 10

    # Check if Netlify started successfully
    if ! kill -0 $NETLIFY_PID 2>/dev/null; then
        echo -e "${RED}✗${NC} Netlify Dev failed to start"
        exit 1
    fi

    echo ""
    echo -e "${GREEN}🎉${NC} Netlify Dev started successfully!"
    echo -e "${GREEN}═══${NC}═══════════════════════════════════════════════"
    echo -e "${GREEN}✓${NC} Netlify Dev: Check terminal output for port (usually 8888)"
    echo -e "${GREEN}✓${NC} SMS functions: Available for testing"
    echo ""
    echo -e "${BLUE}ℹ${NC}  Netlify Dev is running in the background (PID: $NETLIFY_PID)"
    echo -e "${BLUE}ℹ${NC}  Press Ctrl+C to stop Netlify Dev"
    echo ""

    # Wait for the Netlify process
    wait $NETLIFY_PID

else
    # Standard mode - unified frontend/backend startup
    echo -e "${GREEN}✓${NC} Ports $BACKEND_PORT and $FRONTEND_PORT are free"
    echo ""

    # Start the development environment
    echo -e "${BLUE}🚀${NC} Starting development services..."
    echo -e "${BLUE}═══${NC}═══════════════════════════════════════════════"

    # Start both services using npm-run-all
    echo -e "${BLUE}⏳${NC} Starting both frontend and backend services..."
    BACKEND_PORT=$BACKEND_PORT FRONTEND_PORT=$FRONTEND_PORT npm run dev &
    DEV_PID=$!

    # Wait a moment for services to start
    sleep 5

    # Check if the process is still running
    if ! kill -0 $DEV_PID 2>/dev/null; then
        echo -e "${RED}✗${NC} Development services failed to start"
        exit 1
    fi

    # Wait for backend to be ready
    if wait_for_service $BACKEND_PORT "Backend API"; then
        echo -e "${GREEN}✓${NC} Backend API: http://localhost:$BACKEND_PORT"
    else
        echo -e "${RED}✗${NC} Backend API failed to start properly"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi

    # Wait for frontend to be ready
    if wait_for_service $FRONTEND_PORT "Frontend (Vite)"; then
        echo -e "${GREEN}✓${NC} Frontend: http://localhost:$FRONTEND_PORT"
    else
        echo -e "${RED}✗${NC} Frontend failed to start properly"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi

    echo ""
    echo -e "${GREEN}🎉${NC} All services started successfully!"
    echo -e "${GREEN}═══${NC}═══════════════════════════════════════════════"
    echo -e "${GREEN}✓${NC} Frontend (Vite): http://localhost:$FRONTEND_PORT"
    echo -e "${GREEN}✓${NC} Backend (ESM):   http://localhost:$BACKEND_PORT"
    echo ""
    echo -e "${BLUE}ℹ${NC}  Services are running in the background (PID: $DEV_PID)"
    echo -e "${BLUE}ℹ${NC}  Press Ctrl+C to stop all services"
    echo ""

    # Wait for the development process
    wait $DEV_PID
fi
