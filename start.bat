@echo off
setlocal
cd /d "%~dp0"
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5174') do taskkill /f /pid %%a >nul 2>&1
start "TicketEase Backend (Port 5000)" /D "%~dp0backend" cmd /k "npm run dev"
start "TicketEase Frontend (Port 5173)" /D "%~dp0frontend" cmd /k "npm run dev"
ping 127.0.0.1 -n 4 >nul
start http://localhost:5173
endlocal
