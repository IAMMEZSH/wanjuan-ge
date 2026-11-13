@echo off
setlocal EnableExtensions
title WanJuan Ge Launcher

rem ============================================================
rem  WanJuan Ge - Windows launcher
rem  1. check Node.js
rem  2. start server.js in a visible console window
rem  3. wait for the local server, then open the browser
rem  Stop: close the "WanJuan Ge Server" console window.
rem  This file is ASCII-only on purpose: cmd.exe parses batch
rem  files with the OEM code page, so non-ASCII text can break.
rem ============================================================

pushd "%~dp0..\.." >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Cannot enter the project directory:
  echo         %~dp0..\..
  echo         Please extract the whole archive and keep this file
  echo         inside launchers\windows\.
  pause
  exit /b 1
)

if not exist "server.js" (
  echo [ERROR] server.js was not found in:
  echo         %CD%
  echo         Please extract the whole archive and keep this file
  echo         inside launchers\windows\.
  popd
  pause
  exit /b 1
)

"%SystemRoot%\System32\where.exe" node >nul 2>nul
if errorlevel 1 (
  echo ============================================================
  echo   Node.js was not found
  echo ============================================================
  echo   WanJuan Ge needs Node.js 18 or newer. No npm packages are required.
  echo   Download the LTS installer from https://nodejs.org/
  echo   Keep "Add to PATH" checked during installation, then
  echo   double-click this file again.
  echo.
  echo   Already installed but still not found? Close all console
  echo   windows and retry, or check that PATH contains Node.
  echo ============================================================
  popd
  pause
  exit /b 1
)

set "NODE_VER="
for /f "delims=" %%V in ('node -v 2^>nul') do set "NODE_VER=%%V"
echo Using Node %NODE_VER%

set "NODE_MAJOR=0"
for /f "tokens=1 delims=v." %%A in ("%NODE_VER%") do set "NODE_MAJOR=%%A"
if %NODE_MAJOR% LSS 18 (
  echo [WARN] Node.js is older than 18. Some syntax may fail.
  echo        Please upgrade: https://nodejs.org/
)

rem If WanJuan Ge is already listening on 7410, just open it.
set "ALREADY="
node -e "const h=require('http');const r=h.get({host:'127.0.0.1',port:7410,path:'/api/health',timeout:800},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{try{const j=JSON.parse(b);process.exit(j.ok===true&&typeof j.books==='number'?0:2)}catch(e){process.exit(2)}})});r.on('error',()=>process.exit(2));r.on('timeout',()=>{r.destroy();process.exit(2)})" >nul 2>nul
if not errorlevel 1 set "ALREADY=1"

if defined ALREADY (
  echo WanJuan Ge is already running at http://127.0.0.1:7410
  start "" "http://127.0.0.1:7410"
  popd
  exit /b 0
)

set "PORT_BUSY="
"%SystemRoot%\System32\netstat.exe" -ano | "%SystemRoot%\System32\findstr.exe" /C:":7410 " | "%SystemRoot%\System32\findstr.exe" /I "LISTENING" >nul 2>nul
if not errorlevel 1 set "PORT_BUSY=1"

echo.
echo Starting WanJuan Ge server...
if defined PORT_BUSY (
  echo [INFO] Port 7410 is used by another program.
  echo        The server will try 7411-7430 automatically.
  echo        Please read the actual address printed in the
  echo        "WanJuan Ge Server" window.
) else (
  echo        Address: http://127.0.0.1:7410
)

start "WanJuan Ge Server (close this window to stop)" cmd /k "node server.js"

rem Give the server time to read the catalog and bind the port.
"%SystemRoot%\System32\timeout.exe" /t 2 /nobreak >nul 2>nul
start "" "http://127.0.0.1:7410"

echo.
echo Browser opened: http://127.0.0.1:7410
echo If it did not open, visit the address manually.
echo.
echo Notes:
echo   - The server runs in the "WanJuan Ge Server" window.
echo     Closing that window stops the server.
echo   - First start may take a few seconds.
echo   - Data, bookmarks, notes and the API key stay in data\.
echo   - For a silent start, use the VBS launcher in this folder.
echo.
echo Chinese manual: docs\MANUAL.html
echo.
popd
"%SystemRoot%\System32\timeout.exe" /t 3 /nobreak >nul 2>nul
endlocal
exit /b 0
