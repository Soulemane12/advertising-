#!/bin/bash

# Script to start the Python FastAPI backend
# This script activates the virtual environment and starts the backend server

echo "🐍 Starting Python FastAPI backend..."

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found at .venv"
    echo "💡 Run: python -m venv .venv && source .venv/bin/activate && pip install -r backend/requirements.txt"
    exit 1
fi

# Activate virtual environment
source .venv/bin/activate

# Check if backend dependencies are installed
if ! python -c "import fastapi, uvicorn" 2>/dev/null; then
    echo "📦 Installing backend dependencies..."
    pip install -r backend/requirements.txt
fi

# Change to backend directory and start server
cd backend

# Check if port 8000 is in use and kill existing processes
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "🔄 Port 8000 is in use, stopping existing processes..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo "🚀 Backend server starting on http://localhost:8000"
echo "📖 API docs available at http://localhost:8000/docs"

# Start the FastAPI server with uvicorn
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload