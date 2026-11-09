@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Bridge Guard
:loop
netstat -ano | findstr ":8765" | findstr "LISTENING" >nul
if not errorlevel 1 (
    timeout /t 5 /nobreak >nul
    goto loop
)
node douyin-bridge.mjs
echo Bridge exited, restart in 3s...
timeout /t 3 /nobreak >nul
goto loop
