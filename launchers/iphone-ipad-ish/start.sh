#!/bin/sh
# ============================================================
#  万卷阁 · iPhone / iPad iSH 启动脚本
#  用法：cd ~/wanjuan-ge/launchers/iphone-ipad-ish && sh start.sh
#  停止：在本终端按 Ctrl+C。
#  iSH 内无法自动唤起 Safari，脚本会提示你在 Safari 打开地址。
# ============================================================
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." 2>/dev/null && pwd)"
if [ ! -f "$ROOT/server.js" ] && [ -f "$HOME/wanjuan-ge/server.js" ]; then
  ROOT="$HOME/wanjuan-ge"
fi

if [ ! -f "$ROOT/server.js" ]; then
  echo "[错误] 找不到 server.js。" >&2
  echo "       请先运行本目录下的 install.sh：sh install.sh" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[错误] 没有找到 Node.js。请先运行：sh install.sh" >&2
  exit 1
fi

PORT="${WANJUAN_PORT:-7410}"

port_free() {
  node -e "const net=require('net');const s=net.createServer();s.once('error',()=>process.exit(1));s.listen(process.argv[1],'127.0.0.1',()=>s.close(()=>process.exit(0)))" "$1" >/dev/null 2>&1
}

if ! port_free "$PORT"; then
  echo "[提示] 端口 $PORT 已被占用，正在 7411–7430 中寻找空闲端口……"
  FOUND=""
  p=7411
  while [ "$p" -le 7430 ]; do
    if port_free "$p"; then FOUND="$p"; break; fi
    p=$((p + 1))
  done
  if [ -z "$FOUND" ]; then
    echo "[错误] 7410–7430 都被占用。" >&2
    echo "       请关闭占用程序，或用 WANJUAN_PORT 指定其他端口。" >&2
    exit 1
  fi
  PORT="$FOUND"
  echo "       已改用端口 $PORT。"
fi

echo "万卷阁 WANJUAN GE · iSH 启动器"
echo "Node 版本：$(node -v) · 项目目录：$ROOT"
echo "正在启动服务端……首次启动可能需要几秒。"
echo "启动后请在 Safari 打开：http://127.0.0.1:${PORT}"
echo "（iSH 无法自动唤起 Safari，请手动切换。）"
echo "按 Ctrl+C 停止服务。"
cd "$ROOT" || exit 1
exec env WANJUAN_PORT="$PORT" node server.js
