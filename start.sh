#!/bin/bash

# Kill any existing processes on ports 3000 and 3001
echo "Checking for existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Wait a moment
sleep 1

# Start the server
echo "Starting Acorn Finance server..."
npm start
