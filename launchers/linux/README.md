# 万卷阁 · Linux 启动器

脚本：`wanjuan-ge.sh`（Bash）。适用于 x64 / ARM64 的常见发行版（Debian、Ubuntu、Fedora、Arch、树莓派等）。

## 前置条件

- Node.js **18 或更新版本**（零第三方依赖，不需要 `npm install`）；
- 桌面环境下可选 `xdg-open`（用于自动打开浏览器）；无桌面时脚本只打印地址。

安装 Node.js 的常见方式：

```bash
# Debian / Ubuntu
sudo apt update && sudo apt install nodejs

# Fedora
sudo dnf install nodejs

# Arch
sudo pacman -S nodejs
```

用 `node -v` 确认版本。

## 启动

```bash
cd wanjuan-ge-v1.1.3-linux        # 进入解压后的目录
chmod +x launchers/linux/wanjuan-ge.sh
./launchers/linux/wanjuan-ge.sh
```

脚本会：

1. 检查 `node` 与版本；
2. 从脚本位置推导项目根目录（`launchers/linux/../..`）；
3. 启动 `node server.js`；
4. 等待 1 秒，用 `xdg-open` 打开 <http://127.0.0.1:7410>；
5. 前台等待服务；按 `Ctrl+C` 同时停止服务。

> **权限说明**：从 zip 或某些网盘下载后，可执行位可能丢失。若提示 `Permission denied`，执行 `chmod +x launchers/linux/wanjuan-ge.sh`。`-linux.tar.gz` 包已保留可执行权限，通常无需手动 chmod。

## 后台运行

```bash
cd wanjuan-ge-v1.1.3-linux
nohup node server.js > data/server.log 2>&1 &
echo $! > data/server.pid
```

停止：

```bash
kill "$(cat data/server.pid)"
# 或
pkill -f "node server.js"
```

## 端口与局域网

- 默认 `127.0.0.1:7410`；被占用时自动尝试 `7411`–`7430`，以日志为准。
- 指定端口：`WANJUAN_PORT=8080 ./launchers/linux/wanjuan-ge.sh`
- 允许同一 Wi-Fi 下的手机/平板访问：

```bash
WANJUAN_HOST=0.0.0.0 node server.js
# 手机访问 http://<电脑局域网IP>:7410
```

> 程序没有登录鉴权。`0.0.0.0` 会让同一网络中的任何人读取你的书库与笔记，仅在可信网络中临时使用。

## 数据与备份

- `data/user.json`：设置、进度、书签、笔记、API Key（注意保密）；
- `data/translations/`：译文缓存；
- `data/search-index.json`：全文索引，可删除后运行 `node tools/build-index.js` 重建。

升级时保留 `data/` 与 `library/books/`（含你导入的书），其余文件可覆盖。
