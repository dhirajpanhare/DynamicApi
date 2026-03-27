@echo off
REM Simple script to run DynamicApi in Development mode

echo.
echo ========================================
echo   Dynamic API - Starting on Port 5000
echo ========================================
echo.

REM Ensure we're in the correct directory
cd /d "%~dp0"
echo Current directory: %CD%

REM Set environment to Development (allows AllowedHosts: *)
set ASPNETCORE_ENVIRONMENT=Development
echo Environment: %ASPNETCORE_ENVIRONMENT%

REM Check if .env file exists
if exist ".env" (
    echo .env file found: OK
) else (
    echo ERROR: .env file not found!
    echo Please make sure .env exists in this directory
    pause
    exit /b 1
)

echo.
echo Starting API...
echo.

REM Run the API
dotnet run

pause
