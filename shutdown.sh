#!/bin/bash
# Shutdown script for PlumbingPOC: stops backend and frontend processes and closes terminal windows

# Configurable ports (must match startup.sh)
BACKEND_PORT=3000
FRONTEND_PORT=5173

echo "Stopping PlumbingPOC services..."

# Kill processes on the ports
echo "Killing processes on ports $BACKEND_PORT and $FRONTEND_PORT..."
kill $(lsof -t -i:$BACKEND_PORT) $(lsof -t -i:$FRONTEND_PORT) 2>/dev/null || echo "No processes found on specified ports"

# Close Terminal windows that contain the specific processes
echo "Closing associated Terminal windows..."
osascript -e '
tell application "Terminal"
    set windowList to windows
    repeat with aWindow in windowList
        try
            set tabList to tabs of aWindow
            repeat with aTab in tabList
                set tabProcesses to processes of aTab
                repeat with aProcess in tabProcesses
                    if aProcess contains "node server.js" or aProcess contains "npm run dev" or aProcess contains "vite" then
                        tell aTab to close
                        exit repeat
                    end if
                end repeat
            end repeat
        end try
    end repeat
end tell
'

echo "Shutdown complete."