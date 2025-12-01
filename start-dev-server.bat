@echo off
setlocal enabledelayedexpansion

:: Enhanced Trading Journal Web Development Server Startup Script
:: This script provides a robust startup experience with comprehensive error handling

title Trading Journal Web - Development Server

:: Set console colors for better visibility
color 0A

:: Display startup banner
echo.
echo ====================================================================
echo    🚀 TRADING JOURNAL WEB - DEVELOPMENT SERVER STARTUP
echo ====================================================================
echo.
echo This script will:
echo   • Check for and terminate conflicting Node.js processes
echo   • Remove lock files and cached data
echo   • Verify port availability
echo   • Start the development server with robust error handling
echo.
echo ====================================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed or not in your PATH
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if npm is available
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm is not available
    echo.
    echo Please ensure Node.js is properly installed
    echo.
    pause
    exit /b 1
)

:: Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ ERROR: package.json not found
    echo.
    echo Please ensure you're running this script from the project root directory
    echo.
    pause
    exit /b 1
)

:: Display menu for user choice
echo Please select an option:
echo.
echo 1. Start development server on port 3000 (default)
echo 2. Start development server on port 3001
echo 3. Start development server on port 3002
echo 4. Perform cleanup only (don't start server)
echo 5. Start multiple servers (ports 3000, 3001, 3002)
echo 6. Use legacy startup method
echo.
set /p choice="Enter your choice (1-6): "

:: Validate user input
if "%choice%"=="" set choice=1
if "%choice%"=="1" goto start3000
if "%choice%"=="2" goto start3001
if "%choice%"=="3" goto start3002
if "%choice%"=="4" goto cleanup
if "%choice%"=="5" goto multi
if "%choice%"=="6" goto legacy

:: Invalid choice
echo.
echo ❌ Invalid choice. Please enter a number between 1 and 6.
echo.
pause
exit /b 1

:start3000
echo.
echo 🚀 Starting development server on port 3000...
echo.
call npm run dev
goto end

:start3001
echo.
echo 🚀 Starting development server on port 3001...
echo.
call npm run dev:3001
goto end

:start3002
echo.
echo 🚀 Starting development server on port 3002...
echo.
call npm run dev:3002
goto end

:cleanup
echo.
echo 🧹 Performing cleanup...
echo.
call npm run cleanup
echo.
echo ✅ Cleanup completed!
echo.
pause
exit /b 0

:multi
echo.
echo 🚀 Starting multiple development servers...
echo.
echo Starting server on port 3000...
start "Trading Journal - Port 3000" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo Starting server on port 3001...
start "Trading Journal - Port 3001" cmd /k "npm run dev:3001"
timeout /t 3 /nobreak >nul

echo Starting server on port 3002...
start "Trading Journal - Port 3002" cmd /k "npm run dev:3002"
timeout /t 3 /nobreak >nul

echo.
echo ✅ All servers started!
echo.
echo Servers are running in separate windows:
echo   • Port 3000: http://localhost:3000
echo   • Port 3001: http://localhost:3001
echo   • Port 3002: http://localhost:3002
echo.
echo Close the server windows to stop the servers.
echo.
pause
exit /b 0

:legacy
echo.
echo ⚠️  Using legacy startup method...
echo.
echo This will use the old fix-lock-file.js script.
echo.
call npm run dev:legacy
goto end

:end
echo.
echo ====================================================================
echo Server process has ended.
echo ====================================================================
echo.
pause