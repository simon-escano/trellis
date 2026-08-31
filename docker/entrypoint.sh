#!/bin/sh
set -e

echo "[Trellis] Starting production container..."

# Run background Node worker
echo "[Trellis] Starting AI Worker process..."
cd /app/worker && node dist/index.js &
WORKER_PID=$!

# Run Rust GraphQL API Server
echo "[Trellis] Starting Rust GraphQL Server on port ${PORT:-8080}..."
cd /app/server && ./trellis-server &
SERVER_PID=$!

trap "echo '[Trellis] Shutting down...'; kill -TERM $WORKER_PID $SERVER_PID 2>/dev/null; exit 0" INT TERM

# Wait on the server process
wait $SERVER_PID
