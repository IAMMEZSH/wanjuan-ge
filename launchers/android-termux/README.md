# 万卷阁 · Android（Termux）启动器

Android 上不需要 APK：用 Termux 在手机内运行同一套 Node 服务，再用 Chrome「添加到主屏幕」，即可获得接近原生 App 的阅读体验。

> **重要：Termux 请从 F-Droid 安装**（<https://f-droid.org/packages/com.termux/>），或从 Termux 官方 GitHub Releases 下载。**不要使用 Google Play 上的旧版**——该版本已停止更新，软件源与 Node.js 包都无法正常工作。

## 文件说明

| 文件 | 用途 |
| --- | --- |
| `install.sh` | 一次性安装：`pkg update` → `pkg install nodejs git` → 复制项目到 `~/wanjuan-ge` → 启动并打开浏览器 |
| `start.sh` | 日常启动：进入 `~/wanjuan-ge`，运行 `node server.js`，用 `termux-open-url` 打开浏览器 |
| `README.md` | 本说明 |

本项目**零第三方依赖**，因此 `npm install` 可以完全跳过。

## 安装步骤

1. 从 **F-Droid** 安装 Termux 并打开。
2. 把 `wanjuan-ge-v1.3.0-android-termux.zip` 传到手机并解压（可用手机自带文件管理器，或 Termux 的 `unzip`）。
3. 授权访问共享存储（只需一次）：

   ```bash
   termux-setup-storage
   ```

4. 进入解压目录的启动器目录并安装，例如：

   ```bash
   cd ~/storage/downloads/wanjuan-ge-v1.3.0-android-termux
   cd launchers/android-termux
   bash install.sh
   ```

   脚本会安装 Node.js 与 git，把项目复制到 `~/wanjuan-ge`，然后启动服务器。首次启动会读取全部典籍与全文索引，可能需要几秒。
5. 浏览器自动打开 <http://127.0.0.1:7410>。若未自动打开，手动在 Chrome 输入该地址。
6. Chrome 菜单 →「添加到主屏幕」/「安装应用」，以后从桌面图标进入。

## 日常启动

```bash
cd ~/wanjuan-ge/launchers/android-termux
bash start.sh
```

或直接：

```bash
cd ~/wanjuan-ge
node server.js
```

然后在 Chrome 打开 <http://127.0.0.1:7410>。按 `Ctrl+C` 停止服务（Termux 通知栏 → Exit 也可以）。

## 可执行权限

zip 解压后脚本可能没有执行位。用 `bash install.sh` / `bash start.sh` 调用即可，不依赖执行位；若想直接 `./start.sh`，先执行：

```bash
chmod +x ~/wanjuan-ge/launchers/android-termux/*.sh
```

`-android-termux.zip` 在打包时已将 `.sh` 设为 755，但部分手机解压工具会丢失权限。

## 后台与耗电

- 脚本会尝试执行 `termux-wake-lock`，减少息屏后被系统冻结的概率；可在 Termux 通知栏释放。
- Android 仍可能在内存紧张时杀掉 Termux。重新打开 Termux，再运行一次 `start.sh` 即可，阅读数据不会丢失（保存在 `~/wanjuan-ge/data/`）。
- 建议在系统设置中关闭对 Termux 的电池优化。
- 低端手机打开《资治通鉴》等超大书会较慢，请耐心等待。

## 端口与局域网

- 默认 `127.0.0.1:7410`；被占用时自动尝试 `7411`–`7430`，以控制台日志为准。
- 指定端口：`WANJUAN_PORT=8080 bash start.sh`
- 让同一 Wi-Fi 下的电脑访问手机书库：`WANJUAN_HOST=0.0.0.0 node server.js`，电脑访问 `http://<手机IP>:7410`（无鉴权）。

## 更新与卸载

- **更新**：解压新版本，重新运行 `install.sh`。它不会覆盖 `~/wanjuan-ge` 中的 `data/`（安装时的复制会更新程序文件；升级前建议先备份 `data/`）。
- **卸载**：删除 `~/wanjuan-ge` 目录，并在 Termux 中执行 `pkg uninstall nodejs`（可选）。

## 数据与备份

- `data/user.json`：设置、进度、书签、笔记、API Key（注意保密）；
- `data/translations/`：译文缓存；
- `data/search-index.json`：全文索引，可删除后重建。

备份：`cp -r ~/wanjuan-ge/data ~/storage/shared/wanjuan-ge-backup/`。

## 为什么没有 APK？

构建签名 APK 需要 Android SDK、Gradle 与开发者自己的 keystore。本项目提供的是 WebView 工程骨架（见仓库 `android/` 目录），需要你在 Android Studio 中自行构建并签名，仓库不附带也未声称生成任何 APK。Termux 方案与 PWA 方案无需签名即可使用，功能与桌面版一致。
