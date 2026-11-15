# 万卷阁 · macOS 启动器

启动文件：`万卷阁.command`。适用于 macOS 11 及更新版本（Intel 与 Apple 芯片通用，程序没有原生依赖）。

## 前置条件

- Node.js **18 或更新版本**（零第三方依赖，不需要 `npm install`）。
- 安装方式：从 <https://nodejs.org/> 下载 macOS `.pkg`，或 `brew install node`。

## 启动

1. 解压 `wanjuan-ge-v1.1.3-macos.zip`，得到 `wanjuan-ge-v1.1.3-macos/` 目录。
2. 双击 `launchers/macos/万卷阁.command`。
3. 终端会显示启动日志，Safari 会自动打开 <http://127.0.0.1:7410>。
4. 停止：关闭终端窗口，或在终端按 `Ctrl+C`。

### 首次打开被系统拦截

若提示“无法打开，因为无法验证开发者”：

- 在 Finder 中**右键**该文件 →「打开」→ 再点「打开」；
- 或执行 `xattr -d com.apple.quarantine launchers/macos/万卷阁.command`。

### 可执行权限

zip 解压工具可能不保留 Unix 执行位。若双击无反应或提示权限不足，在终端执行：

```bash
chmod +x launchers/macos/万卷阁.command
```

`-linux.tar.gz` 与本包内的脚本在打包时已设为 755；若仍丢失，按上面命令补回即可。

## 端口

- 默认 `127.0.0.1:7410`；被占用时自动尝试 `7411`–`7430`，终端会打印实际地址。
- 指定端口：`WANJUAN_PORT=8080 ./launchers/macos/万卷阁.command`
- 局域网访问：`WANJUAN_HOST=0.0.0.0 node server.js`，手机访问 `http://<Mac的IP>:7410`（无鉴权，仅限可信网络）。

## 设为登录项（可选）

系统设置 →「通用」→「登录项与扩展」→ 添加 `万卷阁.command`。注意：这会在登录时弹出终端窗口。

## 数据位置

- `data/user.json`：设置、进度、书签、笔记、API Key（备份时注意保密）；
- `data/translations/`：译文缓存；
- `data/search-index.json`：全文索引，可删除后运行 `node tools/build-index.js` 重建。

升级时保留 `data/`、`library/books/` 即可。
