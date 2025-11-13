#!/bin/bash

echo "Starting Certificate Generator Backend..."
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"

# Navigate to backend directory
cd /app/backend

# Start the Node.js server
exec node server.js
