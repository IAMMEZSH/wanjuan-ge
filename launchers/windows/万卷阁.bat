@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 万卷阁 WANJUAN GE 启动器

rem ============================================================
rem  万卷阁 · Windows 启动器
rem  作用：检查 Node.js → 进入项目根目录 → 启动 server.js
rem        → 等待 1 秒 → 用默认浏览器打开 http://127.0.0.1:7410
rem  停止：关闭标题为“万卷阁 服务端”的命令行窗口即可。
rem ============================================================

rem 从 launchers\windows 回到项目根目录（两级向上）
pushd "%~dp0..\.." >nul 2>nul
if errorlevel 1 (
  echo [错误] 无法进入项目目录：%~dp0..\..
  echo        请确认压缩包已完整解压，且路径中没有被系统拦截。
  pause
  exit /b 1
)

if not exist "server.js" (
  echo [错误] 当前目录找不到 server.js：
  echo        %CD%
  echo        请把本启动器留在 launchers\windows\ 内，或确认压缩包已完整解压。
  popd
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo ============================================================
  echo  没有找到 Node.js
  echo ============================================================
  echo  万卷阁需要 Node.js 18 或更新版本（零第三方依赖）。
  echo  请到 https://nodejs.org/ 下载 LTS 安装包，
  echo  安装时保持勾选 “Add to PATH”，然后重新双击本文件。
  echo.
  echo  已安装却仍提示找不到？请关闭所有命令行窗口后重试，
  echo  或在“系统属性 → 环境变量”中确认 PATH 包含 Node 目录。
  echo ============================================================
  popd
  pause
  exit /b 1
)

set "NODE_VER="
for /f "delims=" %%V in ('node -v 2^>nul') do set "NODE_VER=%%V"
echo 使用 Node %NODE_VER%

set "NODE_MAJOR=0"
for /f "tokens=1 delims=v." %%A in ("%NODE_VER%") do set "NODE_MAJOR=%%A"
if %NODE_MAJOR% LSS 18 (
  echo [警告] 当前 Node 版本低于 18，部分语法可能无法运行。
  echo        建议升级：https://nodejs.org/
)

rem 检查默认端口是否已被占用（万卷阁会自动改用 7411–7430）
set "PORT_BUSY="
netstat -ano | findstr /C:":7410 " | findstr /I "LISTENING" >nul 2>nul
if not errorlevel 1 set "PORT_BUSY=1"

echo.
echo 正在启动万卷阁服务端……
if defined PORT_BUSY (
  echo [提示] 端口 7410 已被占用。
  echo        若占用者是另一个万卷阁实例，直接访问 7410 即可；
  echo        若是其他程序，万卷阁会自动改用 7411–7430，
  echo        请查看随后弹出的“万卷阁 服务端”窗口里打印的实际地址。
) else (
  echo        服务地址：http://127.0.0.1:7410
)

start "万卷阁 服务端（关闭本窗口即停止）" cmd /k "node server.js"

rem 给服务器 1 秒启动时间，然后打开浏览器
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:7410"

echo.
echo 浏览器已打开 http://127.0.0.1:7410
echo 如果页面没有自动打开，请手动访问上面的地址。
echo.
echo 说明：
echo   · 服务运行在“万卷阁 服务端”窗口中，关闭该窗口即停止；
echo   · 首次启动可能需要数秒读取全部典籍与全文索引；
echo   · 数据、书签、笔记与 API Key 只保存在本机 data\ 目录；
echo   · 想完全无窗口运行，可改用同目录的“万卷阁-无窗口.vbs”。
echo.
popd
timeout /t 3 >nul
endlocal
exit /b 0
