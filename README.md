# 万卷阁 WANJUAN GE

**v1.0.0** · 离线中文典籍阅读器 · 零第三方依赖 · 无水印

> 把经史子集、佛道经咒、圣经与公版世界典籍装进一个只在本机运行的中文阅读器：断网也能读，全文可搜，书签笔记俱全，需要时再调用你自己的翻译接口。

万卷阁不是在线书城，也不是云笔记。它是一个**单目录、单进程、只监听本机**的阅读程序：书库、进度、书签、笔记、译文缓存与 API Key 都保存在你自己的磁盘上。程序没有账号、没有遥测、没有广告，发布包中不含任何用户数据或密钥。

详细中文说明书见 [`docs/manual.html`](docs/manual.html)；启动服务后也可直接访问 <http://127.0.0.1:7410/manual>。

---

## 下载

> 下表为 [GitHub Release v1.0.0](https://github.com/IAMMEZSH/wanjuan-ge/releases/tag/v1.0.0) 附件直链；GitCode 仓库（[gcw_So3EkhfR/wanjuan-ge](https://gitcode.com/gcw_So3EkhfR/wanjuan-ge)）同源。当前未生成任何 APK/IPA。

| 平台 | 发行包 | 启动方式 |
| --- | --- | --- |
| Windows 10 / 11 | [wanjuan-ge-v1.0.0-windows.zip](https://github.com/IAMMEZSH/wanjuan-ge/releases/download/v1.0.0/wanjuan-ge-v1.0.0-windows.zip) | 双击 `launchers/windows/万卷阁.bat` |
| Linux（x64 / ARM64） | [wanjuan-ge-v1.0.0-linux.tar.gz](https://github.com/IAMMEZSH/wanjuan-ge/releases/download/v1.0.0/wanjuan-ge-v1.0.0-linux.tar.gz) | `chmod +x launchers/linux/wanjuan-ge.sh && ./launchers/linux/wanjuan-ge.sh` |
| macOS 11+ | [wanjuan-ge-v1.0.0-macos.zip](https://github.com/IAMMEZSH/wanjuan-ge/releases/download/v1.0.0/wanjuan-ge-v1.0.0-macos.zip) | 双击 `launchers/macos/万卷阁.command` |
| Android · Termux | [wanjuan-ge-v1.0.0-android-termux.zip](https://github.com/IAMMEZSH/wanjuan-ge/releases/download/v1.0.0/wanjuan-ge-v1.0.0-android-termux.zip) | `bash launchers/android-termux/install.sh` |
| iPhone / iPad · iSH | [wanjuan-ge-v1.0.0-iphone-ipad-ish.zip](https://github.com/IAMMEZSH/wanjuan-ge/releases/download/v1.0.0/wanjuan-ge-v1.0.0-iphone-ipad-ish.zip) | `sh launchers/iphone-ipad-ish/install.sh` |
| 全平台源码 | [wanjuan-ge-v1.0.0.zip](https://github.com/IAMMEZSH/wanjuan-ge/releases/download/v1.0.0/wanjuan-ge-v1.0.0.zip) | 含全部启动器、文档与 Android WebView 工程骨架 |
| 校验清单 | [SHA256SUMS.txt](https://github.com/IAMMEZSH/wanjuan-ge/releases/download/v1.0.0/SHA256SUMS.txt) | `sha256sum -c SHA256SUMS.txt`（Windows 可用 `certutil -hashfile`） |

发行包包含完整的 Node 服务、146 部书库、前端、说明文档与对应的平台启动器；**不包含 Node.js 运行时**，也不预置全文索引（首次搜索时自动生成）；请按下方各平台说明安装 Node.js 18 或更新版本。Android WebView 工程只随「全平台源码」包提供。

---

## 功能

- **离线阅读**：内置 146 部典籍、5,942 章、约 1,929 万字，首次启动即可阅读；除“在线翻译”外全部功能无需联网。
- **全文搜索**：301,388 段全文索引，书名、作者、正文均可检索，结果定位到章与段落。
- **书签与笔记**：按书籍与章节保存书签、摘录与笔记，阅读进度自动记录；数据只在本机 `data/user.json`。
- **在线翻译**：按章把文言译成现代汉语或英文，支持 DeepSeek、通义千问、OpenAI 与本地 Ollama 等 OpenAI 兼容接口；译文按书与语言缓存，密钥只存本机且界面掩码显示。
- **世界地图**：内置世界文明站点数据（`data/world-sites.json`），从地理分布进入各地典籍与文明节点。
- **文明时间轴**：内置文明年表（`data/world-timeline.json`），按年代串联经典、事件与文本。
- **书库分类**：经部、史部、子部、道部、释部、圣经、世界、预言、术数、侦探、怪谈、漫画十二个书架分类，另有原创图解（三易、六十四卦、五行、洛书、河图、经典结构等）。
- **PWA 与多端**：Windows / Linux / macOS 浏览器可“安装”为桌面应用；Android 可添加到主屏幕；手机亦可只做浏览器，读取电脑上的书库。
- **可导入、可备份**：通过界面导入纯文本（按“第…章/卷/回”或空行切分），全部数据在 `data/` 与 `library/` 中，复制目录即可迁移。
- **克制与透明**：零第三方 npm 依赖、默认只监听 `127.0.0.1`、无账号、无统计、无广告、无远程字体；发布包自动排除 `_work/`、`.git/`、`release/` 与含密钥的 `data/user.json`。

### 书库分类

| 分类 | 部数 | 代表典籍 |
| --- | ---: | --- |
| 经部 | 14 | 周易、尚书、诗经、周礼、仪礼、礼记、春秋左传、论语、孟子、四书章句集注 |
| 史部 | 6 | 史记、汉书、后汉书、三国志、资治通鉴、战国策 |
| 子部 | 51 | 荀子、墨子、韩非子、淮南子、管子、商君书、吕氏春秋、颜氏家训、日知录、世说新语、搜神记、齐民要术、武经总要 等 |
| 道部 | 17 | 道德经、庄子、列子、黄庭经、度人经、抱朴子内篇、抱朴子外篇、周易参同契、悟真篇 |
| 释部 | 16 | 心经、金刚经、法华经、华严经、楞严经、地藏经、坛经、弘明集、大悲咒 |
| 圣经 | 2 | 和合本 66 卷、1,189 章、31,104 节；死海古卷中文译述 84 章 |
| 世界 | 20 | 神曲（地狱/炼狱/天堂）、埃及死者之书、埃及神话、柯尔布林圣经、希腊罗马神话、世界文明与遗址百科、伊索寓言、安徒生童话、格林童话、人类文明发展史、所罗门大钥匙、所罗门小钥匙、所罗门书、大天使罗杰爱尔之书、天阶序论、威卡与西方神秘学、驱魔者手册与罗马礼书、心理罪全系列导读 |
| 预言 | 8 | 诸世纪、推背图、烧饼歌（通行本全文）、乾坤万年歌（通行本全文）、格庵遗录（六十篇全文）、赫尔墨斯文书（全集译述）、古埃及预言（内费尔提与伊普维尔全文）、波斯圣书·阿维斯陀（伽萨颂全译） |
| 侦探 | 6 | 福尔摩斯探案全集、爱伦·坡侦探与恐怖小说集、世界侦探小说史与名著导读、埃勒里·奎因侦探小说导读、东野圭吾小说导读、十宗罪全系列导读 |
| 怪谈 | 3 | 日本怪谈百物语、世界恐怖小说经典、克苏鲁神话 |
| 漫画 | 2 | DC 漫画宇宙导读、漫威漫画宇宙导读（均为原创导读，不收录原著内容）；另有原创长卷漫画《书灵夜游》 |
| 术数 | 1 | 奇门遁甲（原创整理） |

> 分类与部数以 `npm run index` 的实际输出为准；增删书籍后请重建索引。

---

## 快速开始

所有平台都要求 **Node.js 18+**。程序零第三方依赖，**不需要 `npm install`**。

### Windows 10 / 11

1. 安装 Node.js：<https://nodejs.org/> 下载 LTS，安装时勾选 “Add to PATH”。
2. 解压 `wanjuan-ge-v1.0.0-windows.zip` 到普通目录（如 `D:\万卷阁`，不要放 `C:\Program Files`）。
3. 双击 `launchers\windows\万卷阁.bat`。1 秒后浏览器会自动打开 <http://127.0.0.1:7410>。
4. 想无窗口运行，可双击 `万卷阁-无窗口.vbs`；停止时在任务管理器结束 `node.exe`。

> 端口 7410 被占用时，服务会自动尝试 7411–7430，启动器会提示你查看控制台输出的实际端口。

### Linux

```bash
tar -xzf wanjuan-ge-v1.0.0-linux.tar.gz
cd wanjuan-ge-v1.0.0-linux
chmod +x launchers/linux/wanjuan-ge.sh
./launchers/linux/wanjuan-ge.sh
```

脚本检查 Node、启动服务、等待 1 秒后用 `xdg-open` 打开浏览器；`Ctrl+C` 同时停止服务。没有桌面环境时只打印地址，手动访问即可。

### macOS 11+

```bash
unzip wanjuan-ge-v1.0.0-macos.zip
cd wanjuan-ge-v1.0.0-macos
chmod +x launchers/macos/万卷阁.command
open launchers/macos/万卷阁.command
```

也可以直接在 Finder 中双击该文件；首次被 Gatekeeper 拦截时，右键 →「打开」。若 zip 解压丢失执行位，按上面的 `chmod +x` 补回。

### Android · Termux（推荐）

1. 从 **F-Droid** 安装 Termux（<https://f-droid.org/packages/com.termux/>）。不要用 Google Play 上的停更旧版。
2. 解压 `wanjuan-ge-v1.0.0-android-termux.zip`，在 Termux 中进入 `launchers/android-termux/`：

   ```bash
   termux-setup-storage
   cd ~/storage/downloads/wanjuan-ge-v1.0.0-android-termux/launchers/android-termux
   bash install.sh
   ```

3. 脚本会 `pkg update`、`pkg install nodejs git`、把项目复制到 `~/wanjuan-ge`，然后启动服务并调用 `termux-open-url` 打开 <http://127.0.0.1:7410>。
4. Chrome 菜单 →「添加到主屏幕」，以后从桌面图标进入。

日常启动：`bash ~/wanjuan-ge/launchers/android-termux/start.sh`。本机安装无需 `npm install`。

### iPhone / iPad · iSH

1. 从 App Store 安装 **iSH**。
2. 把 `wanjuan-ge-v1.0.0-iphone-ipad-ish.zip` 通过「文件」App 放入 iSH 可访问的目录并解压。
3. 在 iSH 中执行：

   ```sh
   cd ~/wanjuan-ge-v1.0.0-iphone-ipad-ish/launchers/iphone-ipad-ish
   sh install.sh
   ```

   脚本执行 `apk add nodejs`、复制项目到 `~/wanjuan-ge` 并启动服务。
4. **iSH 内不能自动唤起浏览器**，请手动切到 Safari 打开 <http://127.0.0.1:7410>，再「添加到主屏幕」。

> iSH 是模拟器，Node 版本可能较旧、性能有限；超大书会明显变慢。更流畅的方式是让电脑跑服务，iPhone 通过局域网访问。

### Android · PWA 与 WebView

- **PWA（最快）**：手机浏览器打开服务地址 → Chrome 菜单 →「添加到主屏幕 / 安装应用」。通过 `http://局域网IP` 访问时通常只创建快捷方式；`http://127.0.0.1` 属于安全上下文，体验更接近原生。
- **WebView 工程（需自行构建）**：仓库提供 `android/` 工程骨架，可在 Android Studio 中改地址、Build APK，并使用**你自己的 keystore** 签名。本仓库**没有生成、也没有附带任何 APK**，详见 [`android/README.md`](android/README.md)。

### 端口、停止与局域网

- 默认地址：`http://127.0.0.1:7410`；端口被占用时自动尝试 `7411`–`7430`，以控制台输出为准。
- 指定端口：`WANJUAN_PORT=8080 node server.js`（Windows：`set WANJUAN_PORT=8080` 后运行）。
- 停止：关闭启动器窗口 / 终端按 `Ctrl+C`；无窗口模式在任务管理器结束 `node.exe`。
- 局域网共享（默认关闭）：

  ```bash
  WANJUAN_HOST=0.0.0.0 node server.js
  # 手机访问 http://<电脑的局域网IP>:7410
  ```

> 服务没有登录鉴权。`0.0.0.0` 会让同一网络中的任何人读取你的书库与笔记，只应在可信网络中临时开启。

---

## 书库与来源

万卷阁优先收录**已进入公有领域的原文**，不内置现代出版社的排印、校注、今译或版权译本。

| 来源 | 部数 | 说明 |
| --- | ---: | --- |
| [Kanripo 汉籍全文仓库](https://github.com/kanripo) | 101 | 经史子集、佛道经典的白文文本；原典属公有领域，数字化整理由 Kanripo 社群完成，引用请注明来源与仓库编号 |
| 和合本圣经（Chinese Union Version, 1919） | 1 | 66 卷全本，1,189 章、31,104 节；1919 年版已进入公有领域 |
| 死海古卷（Dead Sea Scrolls） | 1 | 古卷原典属公有领域；84 章中文译述、导读与注释为本项目原创，依据通行校勘本结构整理 |
| Project Gutenberg | 3 | 但丁《神曲》地狱、炼狱、天堂三篇，含 1867 年 Longfellow 英译 |
| Project Gutenberg #68907 | 1 | 诺查丹玛斯《诸世纪》1672 年 Garencieres 英法对照本；中文译诗为本项目原创 |
| Papyrus of Ani（大英博物馆 EA10470） | 1 | 《埃及死者之书》；布奇译本属公有领域，中文译文、导读与年表为本项目原创 |
| Culdian Trust 现代整理本 | 1 | 《柯尔布林圣经》**仅收录原创中文导读，不含受版权保护的正文摘录或节译** |
| [kansini/tuibeitu](https://github.com/kansini/tuibeitu)（MIT） | 1 | 《推背图》数字化文本；原典属公有领域 |
| 本项目原创中文导读 | 8 | 希腊罗马神话、埃及神话、世界文明与遗址百科、伊索寓言、安徒生童话、格林童话、人类文明发展史、心理罪全系列导读；中文重述与导读为原创，不复制现代译本或版权小说原文 |
| Internet Archive / Project Gutenberg 公版扫描本 | 7 | 所罗门大钥匙、所罗门小钥匙、所罗门书、大天使罗杰爱尔之书、天阶序论、威卡与西方神秘学、驱魔者手册与罗马礼书；中文导读、译述与简表为本项目原创，不提供仪式操作步骤 |
| 万卷阁原创导读 | 7 | 三十六计、奇门遁甲、烧饼歌、乾坤万年歌、格庵遗录、连山易、归藏易；原创整理部分采用 MIT 许可 |

合计 **132 部**。

完整的逐书清单、仓库编号、原始链接与许可说明见 **[docs/SOURCES.md](docs/SOURCES.md)**。

关于“佚书”与真伪：连山易、归藏易在汉代以后已散佚，现存只有辑佚与转引；格庵遗录、烧饼歌等托名文献的成书年代有争议。本程序以“存佚考/导读”交代文献与争议，**不伪造全文**。

---

## 版权与不含内容

- **程序代码**：MIT 许可，见 [LICENSE](LICENSE)。
- **古籍原文**：均属公有领域。数字化文本的整理者（如 Kanripo 社群、Project Gutenberg、kansini）保留其整理成果的相应权利，转载或再分发请保留来源与仓库编号。
- **原创内容**：分类导读、年表、图解、封面、说明文档与中文译诗由本项目原创，随程序以 MIT 许可发布；引用古籍原文仍属公有领域。
- **不含现代版权内容**：不包含现代出版社的排印、标点、校注、白话译本、研究著作，也不包含受版权保护的《柯尔布林圣经》正文。
- **圣经范围**：仅新教正典 66 卷；次经/旁经不在其中，故未混入。
- **不含用户数据**：发布包排除 `data/user.json`（含 API Key）、译文缓存与上传文件；构建脚本还会扫描疑似 token 并在发现时中止打包。
- **不含安装包**：仓库不附带 APK 或 IPA，也未声称生成。Android 需自行用 Android Studio 构建并以自己的 keystore 签名；iOS 侧载需要 Apple 开发者账号。
- **在线翻译的边界**：只有你点击“译本章”时，当前章正文才会发往你配置的接口；书目、笔记、书签不会随请求发送。机器翻译质量有限，不能替代权威译本。

---

## 目录结构

```text
wanjuan-ge/
├─ server.js                 本机 HTTP 服务（零依赖，默认 127.0.0.1:7410）
├─ VERSION                   版本号（1.0.0）
├─ package.json              start / index / release / test 等脚本
├─ lib/
│  ├─ library.js             书库、目录、搜索索引
│  ├─ store.js               设置、进度、书签、笔记
│  ├─ translate.js           OpenAI 兼容翻译与缓存
│  ├─ importers.js           章节切分、繁简转换、建书
│  └─ util.js                文件与字符串工具
├─ library/
│  ├─ catalog.json           自动生成的目录（可重建）
│  └─ books/*.json           132 部书，一书一 JSON
├─ public/                   阅读器前端（HTML/CSS/JS/PWA、封面、图解、说明书插图）
├─ docs/
│  ├─ manual.html            详细中文说明书（Windows 上即 MANUAL.html，同一文件）
│  ├─ MANUAL.html            /manual 路由实际读取的文件（发布包内两种文件名并存）
│  ├─ SOURCES.md             书目与公版来源清单
│  └─ RELEASE.md             发布步骤（GitHub / GitCode）
├─ launchers/
│  ├─ windows/               万卷阁.bat、万卷阁-无窗口.vbs、README
│  ├─ linux/                 wanjuan-ge.sh、README
│  ├─ macos/                 万卷阁.command、README
│  ├─ android-termux/        install.sh、start.sh、README
│  └─ iphone-ipad-ish/       install.sh、README
├─ android/                  Android WebView 工程骨架（无 APK、无签名）
├─ tools/
│  ├─ build-index.js         重建目录与全文索引
│  ├─ build-release.js       生成六种发行包与 SHA256SUMS
│  └─ import-*.js            语料导入工具
├─ data/                     ★ 用户数据（备份这个目录；发布包不含 user.json）
│  ├─ user.json              设置 / 进度 / 书签 / 笔记 / API Key
│  ├─ search-index.json      全文索引（可重建）
│  ├─ world-sites.json       世界文明站点
│  ├─ world-timeline.json    文明时间轴
│  └─ translations/          译文缓存（可重建）
├─ release/                  构建产物（不入库、不打包）
└─ _work/                    开发中间文件（不入库、不打包）
```

---

## 构建与发布

要求 Node.js 18+，无需安装任何依赖。

```bash
npm test          # node --check + 关键文件/书库自检
npm run index     # 重建 library/catalog.json 与 data/search-index.json，打印书籍数、搜索条目数
npm run release   # 读取 VERSION，生成 release/ 下六个发行包与 SHA256SUMS.txt
npm start         # 启动服务 http://127.0.0.1:7410
```

`npm run release` 会：

1. 读取 `VERSION`（不存在时写入 `1.0.0`）；
2. 收集项目文件，排除 `_work/`、`node_modules/`、`release/`、`.git/`、日志、`data/user.json`、`data/translations/` 等；
3. 扫描疑似密钥（`sk-…`、`ghp_…`、`glpat-…`、`AKIA…` 等），发现即中止；
4. 生成全平台源码包与五个平台包，写入 `release/SHA256SUMS.txt`。

发布到 GitHub / GitCode 的完整步骤见 [docs/RELEASE.md](docs/RELEASE.md)。**仓库与脚本不会执行 `git push`，也不会打印任何 token**；推送与创建 Release 由你在本地完成。Releases 建好后，请把本文档下载表中的相对路径替换为实际附件链接。

> 当前构建环境没有 Android SDK / Gradle / adb，**无法生成签名 APK**；`android/` 只是工程骨架。应用商店上架所需的资质、隐私政策与 targetSdk 适配也不在本仓库范围内。

---

## 常见问题

**Q：双击 Windows 启动器后窗口一闪而过？**
A：多为未安装 Node.js 或不在 PATH。打开 `cmd` 执行 `node -v` 验证；也可在项目根目录运行 `node server.js` 查看报错。若解压到了受保护目录，请换到 `D:\万卷阁` 一类位置。

**Q：端口 7410 被占用怎么办？**
A：服务会自动尝试 7411–7430，控制台会打印实际地址；`万卷阁.bat` 也会提示你查看控制台。也可用 `WANJUAN_PORT` 指定端口。查看占用：`netstat -ano | findstr :7410`。

**Q：Linux / macOS 提示 Permission denied？**
A：zip 解压可能丢失执行位。执行 `chmod +x launchers/linux/wanjuan-ge.sh` 或 `chmod +x launchers/macos/万卷阁.command`。`.tar.gz` 包已保留权限。

**Q：为什么没有 APK / IPA？**
A：构建 APK 需要 Android SDK、Gradle 与签名 keystore，构建 IPA 需要 macOS、Xcode 与 Apple 开发者签名，本仓库的构建环境不具备这些工具链，也不会伪造安装包。可用 Termux 或 PWA，二者功能与桌面版一致；需要 APK 时请按 `android/README.md` 自行构建并签名。

**Q：真的离线吗？**
A：阅读、搜索、书签、笔记、地图、时间轴、导入导出全部本地完成；只有“在线翻译”需要你配置的 API，且只有点击时才发送当前章。

**Q：API Key 安全吗？会不会被打进发行包？**
A：Key 保存在 `data/user.json`，接口返回始终掩码；构建脚本显式排除该文件并扫描常见 token 格式。请勿把 `data/` 提交到 Git，也不要把 Key 写进脚本或文档。

**Q：换电脑/手机怎么迁移？**
A：复制 `data/`（设置、进度、书签、笔记、译文、Key）与 `library/books/`（含导入的书）到新环境的相同位置即可。`search-index.json` 与 `catalog.json` 可删除后重建。

**Q：Termux 后台被杀、服务停了？**
A：Android 会回收后台进程。重新运行 `start.sh`；脚本会尝试 `termux-wake-lock`，建议同时关闭对 Termux 的电池优化。阅读数据不会丢失。

**Q：iSH 很慢 / Node 版本旧？**
A：iSH 是模拟器，性能有限；其 Alpine 源的 Node 版本可能低于 18。可先 `apk update && apk add nodejs` 升级；仍不满足时，改用电脑跑服务、iPhone Safari 局域网访问。

**Q：首次搜索很慢？**
A：首次搜索若无预生成索引，会扫描全部书籍生成 `data/search-index.json`（约 69 MB）。发行包不预置索引，首次搜索会自动构建；源码运行可先执行 `npm run index`。

**Q：为什么没有现代注释、白话译文？**
A：现代校注与译本受版权保护，不能内置。程序提供可选的机器翻译并明确其局限；需要权威注本时请自行导入合法文本。

**Q：服务能不能给公网用？**
A：不建议。程序没有账号与鉴权，设计目标是本机或可信局域网。若确需远程访问，请自行加反向代理、HTTPS 与访问控制，并自担风险。

---

## 无水印说明

- 所有封面、分类插图、世界地图、图解与说明书配图均由本项目原创或程序生成，**不含任何水印、二维码、广告位或第三方追踪像素**。
- 程序界面不弹广告、不引导注册、不收集设备信息；没有“试用版”“激活码”“会员解锁”等限制。
- 古籍原文属公有领域；原创导读、年表与文档以 MIT 许可发布。欢迎在保留来源与许可的前提下自由复制、修改与再分发。

---

## 许可

- 程序与原创文档：**MIT**，见 [LICENSE](LICENSE)。
- 古籍原文：公有领域。
- 数字化文本：遵循各来源仓库的许可与署名要求，见 [docs/SOURCES.md](docs/SOURCES.md)。
- “万卷阁 / WANJUAN GE”名称为本项目标识；再分发修改版时请注明来源，避免让用户误以为是你方官方发行。
