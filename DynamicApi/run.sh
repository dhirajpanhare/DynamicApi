#!/bin/bash
# Simple script to run DynamicApi in Development mode

echo ""
echo "========================================"
echo "   Dynamic API - Starting on Port 5000"
echo "========================================"
echo ""

# Set environment to Development (allows AllowedHosts: *)
export ASPNETCORE_ENVIRONMENT=Development

# Run the API
dotnet run
