# assets 目录说明

本目录默认为空。

万卷阁 Android 外壳是一个 **WebView 客户端**，页面、书库与接口都由正在运行的万卷阁服务提供（默认 `http://127.0.0.1:7410` 或你填写的局域网地址）。因此不需要把前端文件打进 `assets/`。

请勿只把 `public/` 静态文件放进这里：`public/` 依赖 `/api/*` 接口（书库、搜索、翻译、书签），没有 Node 服务时只能看到空书架。正确做法是：

- 手机本机：用 Termux 运行 `node server.js`，App 访问 `http://127.0.0.1:7410`；
- 局域网：在电脑上运行 `WANJUAN_HOST=0.0.0.0 node server.js`，App 填写电脑地址。

如果你确实需要内置静态资源（例如自定义启动页），可放在本目录并在 `MainActivity` 中用 `file:///android_asset/...` 加载，但书库接口仍需连接服务器。
