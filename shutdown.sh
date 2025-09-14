#!/bin/bash
# Shutdown script for PlumbingPOC: stops backend and frontend processes and closes terminal windows

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

# Configurable ports (loaded from .env or defaults)
BACKEND_PORT=${BACKEND_PORT:-3000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

echo -e "\033[0;31m🛑\033[0m Stopping PlumbingPOC services..."
echo -e "\033[0;31m═══\033[0m═══════════════════════════════════════════════"

# Kill processes on the ports
echo -e "\033[0;33m⚡\033[0m Killing processes on ports $BACKEND_PORT and $FRONTEND_PORT..."
kill $(lsof -t -i:$BACKEND_PORT) $(lsof -t -i:$FRONTEND_PORT) 2>/dev/null || echo -e "\033[0;32m✓\033[0m No processes found on specified ports"

# Kill npm processes
echo -e "\033[0;33m⚡\033[0m Killing npm and node processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "node packages/backend/api/server.js" 2>/dev/null || true

# Close Terminal windows that contain the specific processes
echo -e "\033[0;33m⚡\033[0m Closing associated Terminal windows..."
osascript -e '
tell application "Terminal"
    set windowList to windows
    repeat with aWindow in windowList
        try
            set tabList to tabs of aWindow
            repeat with aTab in tabList
                set tabProcesses to processes of aTab
                repeat with aProcess in tabProcesses
                    if aProcess contains "node api/server.js" or aProcess contains "npm run dev" or aProcess contains "vite" or aProcess contains "startup.sh" then
                        tell aTab to close
                        exit repeat
                    end if
                end repeat
            end repeat
        end try
    end repeat
end tell
' 2>/dev/null || echo -e "\033[0;32m✓\033[0m Terminal cleanup completed"

echo "Shutdown complete."