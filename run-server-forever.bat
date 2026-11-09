@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Server Guard
:loop
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if not errorlevel 1 (
    timeout /t 5 /nobreak >nul
    goto loop
)
where python >nul 2>nul
if not errorlevel 1 (
    python launch.py --server-only
) else (
    py -3 launch.py --server-only
)
echo Server exited, restart in 3s...
timeout /t 3 /nobreak >nul
goto loop
