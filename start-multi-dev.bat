@echo off
echo Starting multiple Next.js development servers...

REM Remove any existing lock files
if exist .next\dev\lock del .next\dev\lock

REM Start the first server on port 3000
start "Next.js Dev Server 1" cmd /k "npm run dev"

REM Wait a moment for the first server to initialize
timeout /t 3 /nobreak >nul

REM Remove any lock files that might have been created
if exist .next\dev\lock del .next\dev\lock

REM Start the second server on port 3001
start "Next.js Dev Server 2" cmd /k "npm run dev -- --port 3001"

echo Multiple development servers started!
echo Server 1: http://localhost:3000
echo Server 2: http://localhost:3001