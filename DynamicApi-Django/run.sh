#!/bin/bash
# Simple script to run Django Dynamic API in Development mode

echo ""
echo "========================================"
echo "   Django Dynamic API - Starting"
echo "   Port: 8000"
echo "========================================"
echo ""

# Ensure we're in the correct directory
cd "$(dirname "$0")"
echo "Current directory: $(pwd)"

# Activate virtual environment if it exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "Warning: venv not found. Please create it with: python -m venv venv"
fi

echo ""
echo "Starting API..."
echo ""

# Run the development server
python run.py
