#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  万卷阁 · Android Termux 启动脚本
#  用法：bash start.sh   或   ./start.sh
#  停止：在本终端按 Ctrl+C（或下滑通知栏点 Termux 的 Exit）。
# ============================================================
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." 2>/dev/null && pwd)"
if [ ! -f "$ROOT/server.js" ] && [ -f "$HOME/wanjuan-ge/server.js" ]; then
  ROOT="$HOME/wanjuan-ge"
fi
PORT="${WANJUAN_PORT:-7410}"
URL="http://127.0.0.1:${PORT}"

echo "万卷阁 WANJUAN GE · Termux 启动器"

if [ ! -f "$ROOT/server.js" ]; then
  echo "[错误] 找不到 server.js。" >&2
  echo "       请先运行 launchers/android-termux/install.sh 完成安装。" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[错误] 没有找到 Node.js。请执行：pkg install nodejs" >&2
  exit 1
fi
echo "Node 版本：$(node -v) · 项目目录：$ROOT"

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
    echo "[错误] $PORT 及其后 20 个端口都被占用。" >&2
    echo "       请关闭占用程序，或用 WANJUAN_PORT 指定其他端口。" >&2
    exit 1
  fi
  PORT="$FOUND_PORT"
  URL="http://127.0.0.1:${PORT}"
  echo "       已改用端口 $PORT。"
fi

# 尽量阻止 Android 在息屏时冻结 Termux
if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock 2>/dev/null || true
  echo "已申请唤醒锁（termux-wake-lock），可在通知栏释放。"
fi

cd "$ROOT" || exit 1
echo "正在启动服务端……首次启动可能需要几秒。"
WANJUAN_PORT="$PORT" node server.js &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup INT TERM HUP

sleep 2
OPEN_URL="$URL"

echo "浏览器地址：$OPEN_URL"
if command -v termux-open-url >/dev/null 2>&1; then
  termux-open-url "$OPEN_URL" || echo "自动打开失败，请手动在 Chrome 中访问：$OPEN_URL"
else
  echo "未找到 termux-open-url，请手动在 Chrome 中访问：$OPEN_URL"
fi
echo "阅读提示：Chrome 菜单 →「添加到主屏幕」，即可像 App 一样打开。"
echo "按 Ctrl+C 停止服务。"

wait "$SERVER_PID"
