@echo off
REM Simple script to run Django Dynamic API in Development mode

echo.
echo ========================================
echo   Django Dynamic API - Starting on Port 8000
echo ========================================
echo.

REM Ensure we're in the correct directory
cd /d "%~dp0"
echo Current directory: %CD%

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo Virtual environment activated
) else (
    echo Warning: venv not found. Please create it with: python -m venv venv
)

echo.
echo Starting API...
echo.

REM Run the development server with startup logging
python run.py

pause
