@echo off
echo Restarting AlphaTerminal Server...
echo.

REM Find and kill Node.js process on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Stopping process %%a...
    taskkill /F /PID %%a
    timeout /t 2 >nul
)

echo Starting enhanced server with Bloomberg dashboard...
echo.

cd /d "%~dp0"
npm start

pause