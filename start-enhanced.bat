@echo off
echo Starting AlphaTerminal Enhanced Server...
echo.

REM Set environment variables
set NODE_ENV=production
set COINGECKO_PRO_API_KEY=CG-MVg68aVqeVyu8fzagC9E1hPj
set PORT=3337

REM Kill any existing Node processes on port 3337
echo Stopping any existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3337') do (
    taskkill /F /PID %%a 2>nul
)

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start the enhanced server
echo Starting enhanced server on port 3337...
node dist/server-enhanced.js

pause