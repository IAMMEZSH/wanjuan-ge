# 万卷阁 · iPhone / iPad（iSH）启动器

iSH 是 iOS 上的 x86 Linux 模拟器，可从 App Store 免费安装。它能在 iPhone / iPad 上直接运行万卷阁的 Node 服务，再用 Safari 阅读。

> **现实提醒**
> - iSH 是**模拟器**，性能明显低于桌面，打开超大书（如《资治通鉴》）会慢，旧设备尤其明显。
> - iSH 的 Alpine 软件源提供的 Node.js 版本**可能较旧**。程序需要 Node 18+ 的语法特性，若 `node -v` 低于 18，请先考虑升级方案：用 `apk update && apk add nodejs` 获取源内最新版；仍不满足时，改用“电脑运行服务 + iPhone 局域网访问”（见下文）。
> - iSH 内**不能自动唤起浏览器**：脚本启动服务后，你需要手动切到 Safari 打开 <http://127.0.0.1:7410>。
> - iOS 可能冻结后台的 iSH。首次加载书库时请让 iSH 保持在前台，加载完成后再切到 Safari。

## 文件说明

| 文件 | 用途 |
| --- | --- |
| `install.sh` | 一次性安装：`apk add nodejs` → 复制项目到 `~/wanjuan-ge` → 启动服务 |
| `README.md` | 本说明 |

零第三方依赖，不需要 `npm install`。

## 安装步骤

1. 从 App Store 安装 **iSH** 并打开。
2. 把 `wanjuan-ge-v1.0.0-iphone-ipad-ish.zip` 保存到「文件」App（例如“我的 iPhone → 下载”）。
3. 在 iSH 中让 Alpine 能访问该文件。可用以下任一方式：
   - 在「文件」App 中把 zip 解压后，将 `wanjuan-ge-v1.0.0-iphone-ipad-ish` 文件夹移动到 iSH 的目录（iSH 在「文件」App 中显示为“iSH”）；
   - 或把文件放到 iCloud Drive，再在 iSH 中通过 `/iSH` 或挂载路径访问。
4. 在 iSH 中进入启动器目录并安装：

   ```sh
   cd ~/wanjuan-ge-v1.0.0-iphone-ipad-ish/launchers/iphone-ipad-ish
   sh install.sh
   ```

   脚本会执行 `apk update`、`apk add nodejs`，把项目复制到 `~/wanjuan-ge`，然后前台启动 `node server.js`。
5. 保持 iSH 在前台，等待终端出现 `万卷阁 v1.0.0 已启动：http://127.0.0.1:7410`。
6. 切到 **Safari**，打开 <http://127.0.0.1:7410>。
7. 点 Safari 分享按钮 →「添加到主屏幕」，以后可从桌面图标进入。

## 日常启动

```sh
cd ~/wanjuan-ge
node server.js
```

然后在 Safari 打开 <http://127.0.0.1:7410>。停止：在 iSH 中按 `Ctrl+C`。

若终端提示权限不足，用 `sh install.sh` 调用即可，不依赖执行位；也可 `chmod +x install.sh`。zip 解压可能丢失执行权限，`-iphone-ipad-ish.zip` 在打包时已设为 755。

## 更流畅的替代方案：电脑跑服务，iPhone 只做浏览器

1. 在电脑上启动万卷阁，并监听局域网：

   ```bash
   # Linux / macOS
   WANJUAN_HOST=0.0.0.0 node server.js
   ```

   ```bat
   rem Windows
   set WANJUAN_HOST=0.0.0.0
   node server.js
   ```

2. 查看电脑的局域网 IP（如 `192.168.1.20`）。
3. iPhone Safari 访问 `http://192.168.1.20:7410`，再「添加到主屏幕」。

> 该模式没有登录鉴权，只应在可信的家庭 Wi-Fi 中临时开启，用完把 `WANJUAN_HOST` 改回默认的 `127.0.0.1`。

## 已知限制

- iSH 模拟层会放大 CPU 与内存开销；低端 iPhone/iPad 建议只读短篇。
- 息屏或切换 App 后 iSH 可能被挂起，服务随之暂停；回到 iSH 前台通常会恢复。
- iSH 的 Node 版本取决于 Alpine 源，可能低于 18；脚本会打印版本，请自行确认。
- 没有 IPA。构建 IPA 需要 macOS、Xcode 与 Apple 开发者签名，本项目不提供也未声称生成。

## 数据与备份

数据都在 `~/wanjuan-ge/data/`：

- `user.json`：设置、进度、书签、笔记、API Key（注意保密）；
- `translations/`：译文缓存；
- `search-index.json`：全文索引，可删除后重建。

备份可复制整个 `~/wanjuan-ge/data` 到「文件」App 中。
