# 万卷阁 · 发布步骤

版本 1.1.2 · 面向维护者

本文件说明如何从源码生成发行包，并发布到 GitHub / GitCode。**仓库内没有任何自动推送脚本，也不会读取、打印或提交 token。** `git push`、创建 Release、上传附件都由你在本地手动完成。

---

## 0. 发布前检查

需要：Node.js 18+、git；上传 Release 时可选用 `gh`（GitHub CLI）。**不需要** Android SDK / Gradle / adb——本仓库不生成 APK。

```bash
node -v
git status
```

确认：

- [ ] `VERSION` 是本次要发布的版本号（例如 `1.1.2`，无 `v` 前缀）；
- [ ] `package.json` 的 `version` 与 `VERSION` 一致；
- [ ] `README.md` 首屏版本号与下载表文件名一致；
- [ ] 书库没有未完成的导入（`library/books/` 中无半成品 JSON）；
- [ ] 工作区没有 `data/user.json` 之类的密钥文件被 `git add`；
- [ ] 已获得书籍/文本来源的再分发许可（见 `docs/SOURCES.md`）。

---

## 1. 自检与重建索引

```bash
npm test
npm run index
```

`npm run index` 会打印书籍数、章节数、正文字数与搜索条目数。请把这些数字同步到：

- `README.md` 的功能列表与书库表；
- `docs/manual.html`（以及内容相同的 `docs/MANUAL.html`）中的统计卡片。

如果数字变化较大，还应检查 `docs/SOURCES.md` 的来源汇总是否需要新增条目。

---

## 2. 生成发行包

```bash
npm run release
```

脚本 `tools/build-release.js` 会：

1. 读取 `VERSION`；文件不存在时写入 `1.1.2`；
2. 收集项目文件，排除：
   - `_work/`、`node_modules/`、`release/`、`.git/`；
   - `data/user.json`（**含 API Key**）、`data/translations/`、`data/uploads/`、日志与系统垃圾文件；
3. 扫描 `sk-…`、`ghp_…`、`github_pat_…`、`glpat-…`、`AKIA…` 等疑似密钥，**发现即中止**；
4. 用内置 zlib 生成 zip（无需系统 zip），用自带 tar 写入器生成 `.tar.gz`（保留 `.sh` / `.command` 的 755 权限）；
5. 输出：

```text
release/
├─ wanjuan-ge-v1.1.2.zip                  全平台源码（含 android/、全部启动器）
├─ wanjuan-ge-v1.1.2-windows.zip
├─ wanjuan-ge-v1.1.2-linux.tar.gz
├─ wanjuan-ge-v1.1.2-macos.zip
├─ wanjuan-ge-v1.1.2-android-termux.zip
├─ wanjuan-ge-v1.1.2-iphone-ipad-ish.zip
└─ SHA256SUMS.txt
```

平台包包含完整运行文件（`server.js`、`lib/`、`public/`、`library/`、`data/` 中的世界地图/时间轴、`docs/`、`package.json`、`README.md`、`LICENSE`、`VERSION`）以及**对应的一个启动器目录**；`android/` 只出现在全平台源码包中。发行包**不含预生成索引**（`data/search-index.json` 会被排除，首次搜索时自动生成）。

> `release/` 已被 `.gitignore` 忽略。发行包是构建产物，不提交到 Git；它们通过 Release 附件分发。

---

## 3. 验收发行包

### 3.1 校验哈希

```bash
cd release
sha256sum -c SHA256SUMS.txt        # Linux / macOS / Git Bash
```

Windows PowerShell：

```powershell
Get-FileHash .\wanjuan-ge-v1.1.2-windows.zip -Algorithm SHA256
Get-Content .\SHA256SUMS.txt
```

### 3.2 检查是否误打包

```bash
unzip -l wanjuan-ge-v1.1.2.zip | grep -E "_work|node_modules|\.git/|user\.json|release/" || echo "OK：无敏感/构建目录"
tar -tzf wanjuan-ge-v1.1.2-linux.tar.gz | grep -E "_work|user\.json" || echo "OK：tar 干净"
```

逐项确认：

- [ ] 没有 `_work/`、`node_modules/`、`release/`、`.git/`；
- [ ] 没有 `data/user.json`（密钥）；
- [ ] 没有 `*.log`、`.DS_Store`、`Thumbs.db`；
- [ ] `launchers/` 下只包含对应平台目录（全平台包除外）；
- [ ] 包内**没有** `data/search-index.json`（索引在首次搜索时自动生成）；`library/catalog.json` 为本次 `npm run index` 的结果；
- [ ] 中文文件名（`万卷阁.bat`、`万卷阁.command`）在 zip 中显示正常（zip 使用 UTF-8 标志）。

### 3.3 启动冒烟测试

至少测试本机平台：

```bash
# 解压到临时目录
cd /tmp && unzip ~/wanjuan-ge/release/wanjuan-ge-v1.1.2-linux.tar.gz
cd wanjuan-ge-v1.1.2-linux
node server.js
# 浏览器访问 http://127.0.0.1:7410
```

再抽查：

- 书架能加载、分类数量正确；
- 搜索“上善若水”有结果；
- 打开一本书能翻章；
- `http://127.0.0.1:7410/manual` 能打开说明书（读取 `docs/MANUAL.html`）；
- 设置页能保存 API Key（测试后清除 `data/user.json`，勿提交）。

Windows / macOS 包建议在对应系统上双击启动器确认中文路径、空格路径与端口提示正常。

---

## 4. 提交与打标签

确认无误后，由你本人提交并推送。**不要把 token 写进命令、URL、提交信息或脚本**；使用 SSH key、系统凭据管理器或 `gh auth login` 交互式登录。

```bash
git status
git add README.md VERSION package.json docs/ launchers/ android/ tools/build-index.js tools/build-release.js
git commit -m "release: 万卷阁 v1.1.2"
git tag -a v1.1.2 -m "万卷阁 v1.1.2"
git push origin main
git push origin v1.1.2
```

> 上面的分支名 `main` 请按实际分支调整。不要使用 `git push --force`；不要在命令行中拼接 `https://<token>@github.com/...`。

如需检查将要推送的内容：

```bash
git show --stat
git diff --cached
```

---

## 5. 发布 GitHub Release

### 方式 A：网页

1. 打开仓库 → `Releases` → `Draft a new release`；
2. 选择标签 `v1.1.2`（或新建）；
3. 标题：`万卷阁 WANJUAN GE v1.1.2`；
4. 说明可粘贴 `README.md` 的功能与安装摘要，并注明：
   - 需要 Node.js 18+；
   - 不包含 APK/IPA；
   - Android 请用 Termux 或自行构建 WebView 工程；
5. 上传 `release/` 下六个发行包与 `SHA256SUMS.txt`（共 7 个附件）；
6. 发布。

### 方式 B：GitHub CLI（已登录）

```bash
gh release create v1.1.2 \
  release/wanjuan-ge-v1.1.2.zip \
  release/wanjuan-ge-v1.1.2-windows.zip \
  release/wanjuan-ge-v1.1.2-linux.tar.gz \
  release/wanjuan-ge-v1.1.2-macos.zip \
  release/wanjuan-ge-v1.1.2-android-termux.zip \
  release/wanjuan-ge-v1.1.2-iphone-ipad-ish.zip \
  release/SHA256SUMS.txt \
  --title "万卷阁 WANJUAN GE v1.1.2" \
  --notes "离线中文典籍阅读器 v1.1.2。需要 Node.js 18+；不包含 APK/IPA。校验见 SHA256SUMS.txt。"
```

`gh` 的凭据由 `gh auth login` 管理；**不要**在命令中传 `--header "Authorization: token ..."`，也不要把 token 贴进终端历史。

---

## 6. 发布 GitCode Release

1. 先把标签推送到 GitCode 远端（若与 GitHub 同一仓库镜像）：

   ```bash
   git remote -v
   git push gitcode main
   git push gitcode v1.1.2
   ```

2. 打开 GitCode 仓库 → `Releases` → `新建 Release`；
3. 选择标签 `v1.1.2`，标题与说明同 GitHub；
4. 上传同样 7 个附件；
5. 发布。

GitCode 的上传入口与字段名称可能随版本变化，以页面提示为准。不要为了“自动上传”把个人访问令牌写进脚本或提交到仓库。

---

## 7. 发布后收尾

- 把 `README.md` 下载表中的 **相对路径**替换为实际 Release 附件链接（GitHub 与 GitCode 各一份，或保留一个主站 + 一个镜像说明）。
- 确认 `docs/manual.html` 与 `docs/MANUAL.html` 版本号、下载表、统计数字一致。
- 在 Release 说明中附上 `SHA256SUMS.txt` 的校验方法。
- 若发现打包错误：删除本次 Release 附件，修复后重新运行 `npm run release`，**递增补丁版本**（如 1.0.1）再发布，不要静默替换同名附件。
- 保留 `release/` 本地副本与哈希，便于复核。
- **清理旧版本（本项目约定）**：确认 v1.1.2 两个平台的 Release 与附件都能正常下载后，删除上一版 v1.0.0 的 Release 与 Git 标签（GitHub 可用 `gh release delete v1.0.0 --yes --cleanup-tag`；GitCode 在 Release 页面删除，并在标签管理中删除 `v1.0.0`）。只保留最新版，避免旧包继续被下载。

---

## 8. 版本号升级流程

1. 修改 `VERSION` 与 `package.json` 的 `version`；
2. 更新 `README.md`、`docs/manual.html`、`docs/MANUAL.html` 中的版本号与下载文件名；
3. `npm test && npm run index && npm run release`；
4. 重新验收、打标签、发布。

版本号采用 `主版本.次版本.补丁`（例如 `1.1.2`），Git 标签使用 `v1.1.2`。

---

## 9. 不在本仓库范围内的事项

- **APK 构建与签名**：需要 Android SDK、Gradle、JDK 17 与**你自己的 keystore**，请在 Android Studio 中按 `android/README.md` 操作。不要提交 keystore，也不要把未签名/来路不明的 APK 作为官方附件发布。
- **iOS IPA**：需要 macOS、Xcode 与 Apple 开发者账号；本仓库只提供 iSH + PWA 方案。
- **应用商店上架**：需要开发者资质、隐私政策、内容合规审查与 targetSdk 适配。
- **自动化 CI 发布**：如后续加入 GitHub Actions，请使用仓库 Secrets 保存凭据，并避免在日志中回显；当前仓库未配置任何 CI 发布流程。

---

## 10. 故障排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `VERSION` 被写成 1.1.2 | 文件缺失或为空 | 正常兜底；确认后重新编辑为正确版本 |
| 打包中止：检测到疑似密钥 | 某个文本文件含 `sk-…` 等 | 按提示把密钥移出项目目录；不要用忽略规则掩盖真实密钥 |
| `release/` 没有产物 | 脚本报错 | 直接运行 `node tools/build-release.js` 查看完整错误；可设 `WANJUAN_DEBUG=1` 输出堆栈 |
| zip 中 `.sh` 无执行权限 | 解压工具丢弃 Unix 位 | README 已提示 `chmod +x`；tar.gz 包保留 755 |
| 发行包启动后书库为空 | 未带 `library/books/` 或 JSON 损坏 | 重新打包；在干净目录解压后运行 `npm run index` 检查 |
| 说明书 404 | `docs/MANUAL.html` 缺失（服务读取该文件名） | 保持 `manual.html` 与 `MANUAL.html` 同时存在 |
| 上传附件失败 | 文件过大/网络中断 | 重试；确认六个包与 SHA256SUMS 均已生成，必要时分次上传 |
