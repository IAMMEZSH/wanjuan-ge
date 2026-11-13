#!/bin/bash
# ============================================================
#  万卷阁 · macOS 启动器
#  用法：双击本文件；若提示“无法验证开发者”，右键 → 打开。
#  首次或在 zip 解压后若没有执行权限：
#      chmod +x 万卷阁.command
#  停止：关闭终端窗口，或在本终端按 Ctrl+C。
# ============================================================
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PORT="${WANJUAN_PORT:-7410}"
URL="http://127.0.0.1:${PORT}"

echo "万卷阁 WANJUAN GE · macOS 启动器"

if [ ! -f "$ROOT/server.js" ]; then
  echo "[错误] 在 $ROOT 找不到 server.js。" >&2
  echo "       请把本文件留在 launchers/macos/ 内，或确认压缩包已完整解压。" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  cat >&2 <<'EOF'
[错误] 没有找到 Node.js。

万卷阁需要 Node.js 18 或更新版本（零第三方依赖）。
安装方式（任选一种）：
  1. 打开 https://nodejs.org/ 下载 macOS 安装包（.pkg）；
  2. 已安装 Homebrew：brew install node
安装后在终端执行 node -v 确认版本，再重新双击本文件。
EOF
  exit 1
fi

NODE_VER="$(node -v 2>/dev/null || echo unknown)"
NODE_MAJOR="$(printf '%s' "$NODE_VER" | sed 's/^v//; s/\..*$//')"
echo "使用 Node $NODE_VER"
case "$NODE_MAJOR" in
  ''|*[!0-9]*) echo "[警告] 无法识别 Node 版本，继续尝试启动。" ;;
  *) if [ "$NODE_MAJOR" -lt 18 ]; then
       echo "[警告] Node 版本低于 18，部分语法可能无法运行，建议升级。"
     fi ;;
esac

port_busy() {
  local p="$1"
  (exec 3<>"/dev/tcp/127.0.0.1/$p") >/dev/null 2>&1 && return 0
  return 1
}
if port_busy "$PORT"; then
  echo "[提示] 端口 $PORT 已被占用，正在 7411–7430 中寻找空闲端口……"
  FOUND_PORT=""
  for p in $(seq $((PORT + 1)) $((PORT + 20))); do
    if ! port_busy "$p"; then FOUND_PORT="$p"; break; fi
  done
  if [ -z "$FOUND_PORT" ]; then
    echo "[错误] $PORT 及其后 20 个端口都被占用，无法启动。" >&2
    echo "       请关闭占用程序，或用 WANJUAN_PORT 指定其他端口。" >&2
    exit 1
  fi
  PORT="$FOUND_PORT"
  URL="http://127.0.0.1:${PORT}"
  echo "       已改用端口 $PORT。"
fi

cd "$ROOT" || exit 1
echo "正在启动服务端……（按 Ctrl+C 停止）"

WANJUAN_PORT="$PORT" node server.js &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup INT TERM HUP

sleep 1
OPEN_URL="$URL"

echo "浏览器地址：$OPEN_URL"
if command -v open >/dev/null 2>&1; then
  open "$OPEN_URL" >/dev/null 2>&1 || true
else
  echo "未检测到 open 命令，请手动在 Safari 打开：$OPEN_URL"
fi

wait "$SERVER_PID"
