#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  万卷阁 · Android Termux 安装脚本
#
#  前置：Termux 必须从 F-Droid 或 Termux GitHub Releases 安装，
#        不要使用 Google Play 上早已停更的旧版本。
#
#  用法：把发行包解压后，进入 launchers/android-termux/，
#       执行：bash install.sh
#  作用：安装 Node.js 与 git → 复制项目到 ~/wanjuan-ge
#        → 启动 server.js → 用 termux-open-url 打开浏览器。
# ============================================================
set -e

echo "============================================================"
echo " 万卷阁 WANJUAN GE · Android Termux 安装"
echo "============================================================"

if [ -z "${PREFIX:-}" ] || [ ! -d "/data/data/com.termux" ]; then
  echo "[警告] 当前似乎不是 Termux 环境。"
  echo "       如果你在普通 Linux 上，请改用 launchers/linux/wanjuan-ge.sh。"
  echo "       继续执行仍会尝试安装依赖并运行，按 Ctrl+C 可中止。"
fi

echo "[1/4] 更新软件源……"
pkg update -y || {
  echo "[提示] pkg update 失败，可能是网络或镜像问题；继续尝试安装。"
}

echo "[2/4] 安装 Node.js 与 git……"
pkg install -y nodejs git

if ! command -v node >/dev/null 2>&1; then
  echo "[错误] Node.js 安装失败。请检查网络后重试：pkg install nodejs" >&2
  exit 1
fi
echo "Node 版本：$(node -v)"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "${NODE_MAJOR:-0}" -lt 18 ] 2>/dev/null; then
  echo "[警告] 当前 Node.js 主版本为 $NODE_MAJOR，万卷阁建议 Node 18 及以上。"
  echo "       请先执行 pkg upgrade -y，再重新运行本脚本。"
fi

# 本项目零第三方依赖，npm install 可以完全跳过。
echo "[3/4] 准备项目目录 ~/wanjuan-ge……"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEST_DIR="$HOME/wanjuan-ge"

if [ ! -f "$SRC_DIR/server.js" ]; then
  echo "[错误] 在 $SRC_DIR 找不到 server.js。" >&2
  echo "       请在解压后的发行包内运行本脚本：" >&2
  echo "       cd wanjuan-ge-v1.1.1-android-termux/launchers/android-termux && bash install.sh" >&2
  exit 1
fi

if [ "$SRC_DIR" = "$DEST_DIR" ]; then
  echo "项目已经位于 $DEST_DIR，跳过复制。"
else
  mkdir -p "$DEST_DIR"
  echo "从 $SRC_DIR 复制到 $DEST_DIR（排除 _work、node_modules、release、.git 与用户数据）……"
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

chmod +x "$DEST_DIR/launchers/android-termux/start.sh" 2>/dev/null || true
chmod +x "$DEST_DIR/launchers/linux/wanjuan-ge.sh" 2>/dev/null || true

echo "[4/4] 启动万卷阁……"
echo "提示：不需要执行 npm install（本项目没有第三方依赖）。"
echo "      首次启动会读取全部典籍，可能需要几秒。"
echo ""

# 交给 start.sh，保持前台运行；按 Ctrl+C 停止。
exec bash "$DEST_DIR/launchers/android-termux/start.sh"
