#!/bin/bash

echo "🛑 Stopping all TangentCloud AI Bots services..."

if [ -f .pids ]; then
    while read pid; do
        if ps -p $pid > /dev/null; then
            echo "Killing process $pid..."
            kill $pid
        fi
    done < .pids
    rm .pids
else
    echo "No .pids file found. Trying to kill by port..."
    lsof -ti :9100,9101,9102 | xargs kill -9 2>/dev/null
fi

echo "✅ All services stopped."
