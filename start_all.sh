#!/bin/bash

# Port Configuration
BACKEND_PORT=9100
DASHBOARD_PORT=9101
MOBILE_PORT=9102

ROOT_DIR="$(pwd)"

echo "🚀 Starting TangentCloud AI Bots Unified Environment..."

# Function to track PIDs
track_pid() {
    echo "$1" >> "$ROOT_DIR/.pids"
}

# Clear old PIDs
rm -f "$ROOT_DIR/.pids"
touch "$ROOT_DIR/.pids"

# 1. Start Backend
echo "📡 Starting Backend on port $BACKEND_PORT..."
"$ROOT_DIR/run_backend.sh" > "$ROOT_DIR/backend.out" 2>&1 &
track_pid $!

# 2. Start Dashboard
echo "💻 Starting Dashboard on port $DASHBOARD_PORT..."
(cd "$ROOT_DIR/dashboard" && npm run dev > "$ROOT_DIR/dashboard.out" 2>&1) &
track_pid $!

# 3. Start Mobile (Expo)
echo "📱 Starting Mobile on port $MOBILE_PORT..."
(cd "$ROOT_DIR/mobile" && npx expo start --port $MOBILE_PORT > "$ROOT_DIR/mobile.out" 2>&1) &
track_pid $!

echo "------------------------------------------------"
echo "✅ All services initiated!"
echo "📡 Backend:   http://localhost:$BACKEND_PORT"
echo "💻 Dashboard: http://localhost:$DASHBOARD_PORT"
echo "📱 Mobile:    http://localhost:$MOBILE_PORT"
echo "------------------------------------------------"
echo "Logs are available in: backend.out, dashboard.out, mobile.out"
