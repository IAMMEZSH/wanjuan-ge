#!/bin/sh
# ============================================================
#  万卷阁 · iPhone / iPad iSH 安装脚本
#
#  iSH 是 iOS 上的 x86 Linux 模拟器（App Store 免费）。
#  iSH 内无法自动唤起 Safari，脚本会提示你在 Safari 打开地址。
#
#  用法：把发行包放到 iSH 可访问的位置并解压，进入
#        launchers/iphone-ipad-ish/，执行：sh install.sh
#  作用：apk add nodejs → 复制项目到 ~/wanjuan-ge
#        → 启动 start.sh（保持前台）。
# ============================================================
set -e

echo "============================================================"
echo " 万卷阁 WANJUAN GE · iPhone / iPad iSH 安装"
echo "============================================================"

if ! command -v apk >/dev/null 2>&1; then
  echo "[错误] 没有找到 apk 命令，当前环境不是 iSH（Alpine Linux）。" >&2
  echo "       在普通 Linux 上请改用 launchers/linux/wanjuan-ge.sh。" >&2
  exit 1
fi

echo "[1/3] 安装 Node.js（iSH 的 Alpine 源，版本可能较旧）……"
apk update || true
apk add --no-cache nodejs

if ! command -v node >/dev/null 2>&1; then
  echo "[错误] Node.js 安装失败，请检查网络后重试：apk add nodejs" >&2
  exit 1
fi
echo "Node 版本：$(node -v)"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "${NODE_MAJOR:-0}" -lt 18 ] 2>/dev/null; then
  echo "[警告] 当前 Node.js 主版本为 $NODE_MAJOR，万卷阁建议 Node 18 及以上。"
  echo "       iSH 的 Alpine 源较旧时可能只提供旧版 Node；"
  echo "       如启动时报语法错误，请先更新 iSH 再重试。"
fi

echo "[2/3] 准备项目目录 ~/wanjuan-ge……"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEST_DIR="$HOME/wanjuan-ge"

if [ ! -f "$SRC_DIR/server.js" ]; then
  echo "[错误] 在 $SRC_DIR 找不到 server.js。" >&2
  echo "       请在解压后的发行包内运行：" >&2
  echo "       cd wanjuan-ge-v1.1.2-iphone-ipad-ish/launchers/iphone-ipad-ish && sh install.sh" >&2
  exit 1
fi

if [ "$SRC_DIR" = "$DEST_DIR" ]; then
  echo "项目已经位于 $DEST_DIR，跳过复制。"
else
  mkdir -p "$DEST_DIR"
  echo "从 $SRC_DIR 复制到 $DEST_DIR（排除构建目录与用户数据）……"
  tar -C "$SRC_DIR" \
      --exclude='./_work' \
      --exclude='./node_modules' \
      --exclude='./release' \
      --exclude='./.git' \
      --exclude='./data/user.json' \
      --exclude='./data/user.json.bak' \
      --exclude='./data/translations' \
      --exclude='./data/uploads' \
      -cf - . | tar -C "$DEST_DIR" -xf -
fi

chmod +x "$DEST_DIR/launchers/iphone-ipad-ish/install.sh" 2>/dev/null || true
chmod +x "$DEST_DIR/launchers/iphone-ipad-ish/start.sh" 2>/dev/null || true

echo "[3/3] 启动万卷阁……"
echo "提示：本项目没有第三方依赖，不需要 npm install。"
echo "      以后再次启动只需执行：sh ~/wanjuan-ge/launchers/iphone-ipad-ish/start.sh"
echo ""
exec sh "$DEST_DIR/launchers/iphone-ipad-ish/start.sh"
