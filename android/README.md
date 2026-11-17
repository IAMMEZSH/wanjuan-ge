# 万卷阁 · Android WebView 工程（骨架）

本目录是一个可导入 Android Studio 的 **WebView 外壳工程源码**，用于把万卷阁包装成 Android App。它不包含书库与 Node 服务，只负责显示你本机或局域网中的万卷阁服务。

> **重要事实：本仓库没有附带 APK，也没有在本环境中生成或签名 APK。**
> 当前构建环境没有 Android SDK、Gradle 与 adb，无法产出可安装的安装包。本目录只提供工程骨架，需你在 Android Studio 中自行构建；签名必须使用**你自己的 keystore**。请不要相信任何声称由本项目发布的 APK。

## 目录结构

```
android/
├─ settings.gradle.kts          工程与仓库配置
├─ build.gradle.kts             AGP 版本
├─ gradle.properties
└─ app/
   ├─ build.gradle.kts          applicationId、SDK、版本、默认服务器地址
   ├─ proguard-rules.pro
   └─ src/main/
      ├─ AndroidManifest.xml   INTERNET 权限、明文 HTTP、启动 Activity
      ├─ java/ge/wanjuan/reader/MainActivity.java
      ├─ res/layout/activity_main.xml
      ├─ res/values/strings.xml
      ├─ res/mipmap-xxxhdpi/ic_launcher.png
      └─ assets/README.md      assets 使用说明（默认不需要）
```

- `applicationId`：`ge.wanjuan.reader`（可自行修改）
- `minSdk`：24（Android 7.0）
- `targetSdk` / `compileSdk`：34
- 版本：`1.3.0`（`versionCode 5`）
- 依赖：无第三方运行时依赖，仅系统 WebView

## 一、准备环境

1. 安装 **Android Studio**（建议 Koala 2024.1.1 或更新版本），首次启动时安装 Android SDK Platform 34、Build-Tools 与 Platform-Tools。
2. 确认使用 **JDK 17**（Android Studio 自带 JBR 17，可直接用）。
3. 需要 **Android Gradle Plugin 8.5+ 与 Gradle 8.7+**。

> 本工程**没有包含 `gradle-wrapper.jar`**（二进制文件不在源码包内）。Android Studio 打开后若提示缺少 Gradle wrapper，有两种处理方式：
> - 在 Android Studio 的 Gradle 设置中选择「Use Gradle from: Specified location」，指向 Android Studio 自带的 Gradle 发行版；
> - 或在本机安装 Gradle 8.7+ 后，在 `android/` 目录执行：
>
>   ```bash
>   gradle wrapper --gradle-version 8.7
>   ```
>
>   之后即可使用 `./gradlew assembleDebug`。

## 二、用 Android Studio 打开

1. `File → Open`，选择本 `android/` 目录（注意：不是仓库根目录）。
2. 等待 Gradle Sync 完成。若提示 SDK 路径，按向导安装；`local.properties` 由 IDE 自动生成，**不要提交到仓库**。
3. 若 AGP 与你的 Android Studio 版本不匹配，可在 `android/build.gradle.kts` 中调整 AGP 版本，或使用 IDE 建议的升级。

## 三、配置服务器地址

默认地址是 `http://127.0.0.1:7410`。

- **手机本机运行服务（Termux）**：保持默认即可。先在 Termux 中启动万卷阁（见 [`../launchers/android-termux/README.md`](../launchers/android-termux/README.md)），再打开 App。
- **服务在电脑上（局域网）**：
  1. 电脑启动时监听局域网：

     ```bash
     # Linux / macOS
     WANJUAN_HOST=0.0.0.0 node server.js
     ```

     ```bat
     rem Windows
     set WANJUAN_HOST=0.0.0.0
     node server.js
     ```

  2. 查看电脑 IP（如 `192.168.1.20`），确认手机与电脑在同一 Wi-Fi，防火墙放行 7410。
  3. 在 App 右上角菜单 →「服务器地址」填入 `http://192.168.1.20:7410`，保存后立即加载。地址会记住，下次启动继续使用。

也可以在编译时改默认值：编辑 `app/build.gradle.kts` 中的

```kotlin
buildConfigField("String", "SERVER_URL", "\"http://192.168.1.20:7410\"")
```

> 万卷阁服务默认没有登录鉴权。`0.0.0.0` 只应在可信家庭网络中临时使用，不要在公网暴露。

## 四、构建 APK

### 调试包（无需签名配置）

1. 菜单 `Build → Build Bundle(s) / APK(s) → Build APK(s)`。
2. 产物：`android/app/build/outputs/apk/debug/app-debug.apk`。
3. 可用 `adb install app-debug.apk` 安装（需要本机已安装 Platform-Tools 并开启 USB 调试）。

命令行等价：

```bash
cd android
./gradlew assembleDebug        # 有 wrapper 时
# 或
gradle assembleDebug           # 使用本机 Gradle 时
```

### 正式签名包（必须使用你自己的 keystore）

1. 菜单 `Build → Generate Signed Bundle / APK`。
2. 选择 **APK** → `Next`。
3. 在 `Key store path` 处点击 `Create new...` 新建 keystore，或选择你已有的 `.jks` / `.keystore`。
4. 填写 keystore 密码、key alias、key 密码与有效期，`Next`。
5. 选择 `release` → `Create`。
6. 产物：`android/app/build/outputs/apk/release/app-release.apk`。

注意事项：

- **keystore 与密码由你自己保管**，不要提交到 Git，不要发给他人；丢失后将无法为同一应用发布升级包。
- 本仓库**不包含也不要求**任何官方签名密钥，更不会提供“已签名 APK”。
- 若要上架应用商店，还需满足商店的资质、隐私政策、内容合规与 targetSdk 要求；本骨架未做商店适配。
- 当前工程允许明文 HTTP（`android:usesCleartextTraffic="true"`），只是为了访问家庭局域网中的本机服务。若你改为公网 HTTPS 服务，建议收紧该配置并配置网络安全策略。

## 五、不构建 APK 的替代方案

### 方案 A：PWA「添加到主屏幕」（最快）

1. 在手机浏览器打开万卷阁服务地址。
2. Chrome 菜单 →「添加到主屏幕」/「安装应用」。
3. 桌面会出现图标，可全屏阅读。

说明：完整 PWA 安装提示通常要求 HTTPS 或 `localhost`。通过 `http://局域网IP` 访问时，Chrome 一般只创建快捷方式，功能仍然可用；若在手机本机用 Termux 的 `http://127.0.0.1:7410`，则属于安全上下文，体验更接近原生。

### 方案 B：Termux 运行服务 + 浏览器

不需要 APK、不需要签名，功能与桌面版一致。详见 [`../launchers/android-termux/README.md`](../launchers/android-termux/README.md)。

## 六、已知限制

- 本工程仅是一个 WebView 壳，**离线时无法阅读**，必须能连到运行中的万卷阁服务。
- 未适配沉浸式状态栏、分屏、横屏 specialized 布局；系统 WebView 版本过旧时可能显示异常。
- 未集成文件选择器、分享、推送、后台服务等原生能力。
- 未包含任何第三方统计、广告或追踪 SDK。

## 七、常见问题

- **Gradle Sync 失败，提示找不到 wrapper**：按上文用 Android Studio 自带 Gradle，或执行 `gradle wrapper --gradle-version 8.7`。
- **App 显示“无法连接万卷阁服务”**：服务未启动、地址填错、端口不是 7410、电脑防火墙拦截，或手机与电脑不在同一 Wi-Fi。App 内置的排错页列出了排查顺序。
- **能打开书架但很慢**：首次加载要读取书库与全文索引；低端机更明显。服务端可用 `node tools/build-index.js` 预生成索引并随包携带。
- **想改应用名/图标**：改 `res/values/strings.xml` 与 `res/mipmap-xxxhdpi/ic_launcher.png`。
