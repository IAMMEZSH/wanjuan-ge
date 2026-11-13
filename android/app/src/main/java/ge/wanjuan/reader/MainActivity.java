package ge.wanjuan.reader;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.text.TextUtils;
import android.view.Menu;
import android.view.MenuItem;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.Toast;

/**
 * 万卷阁 Android WebView 外壳。
 *
 * 说明：
 * - 本应用不内置 Node 服务，也不包含书库；它只是本机/局域网万卷阁服务的浏览器外壳。
 * - 默认地址 http://127.0.0.1:7410 只在手机上运行了服务（例如 Termux）时有效。
 * - 服务在电脑上时，请在右上角菜单“服务器地址”中填写电脑的局域网地址。
 * - 允许明文 HTTP，仅用于家庭局域网中的本地服务；不要在公网暴露无鉴权的万卷阁服务。
 */
public class MainActivity extends Activity {

    private static final String PREFS = "wanjuan";
    private static final String KEY_URL = "server_url";
    private static final int MENU_ADDRESS = 1;
    private static final int MENU_REFRESH = 2;
    private static final int MENU_ABOUT = 3;

    private WebView webView;
    private SharedPreferences prefs;
    private String baseUrl;
    private String lastUrl;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(Color.parseColor("#2a1c10"));
        }

        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        baseUrl = normalize(prefs.getString(KEY_URL, BuildConfig.SERVER_URL));

        webView = findViewById(R.id.webview);
        webView.setBackgroundColor(Color.parseColor("#f3ead7"));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        CookieManager.getInstance().setAcceptCookie(true);

        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl());
            }

            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(Uri.parse(url));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                lastUrl = url;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    String reason = error.getDescription() != null
                            ? error.getDescription().toString()
                            : "无法连接服务器";
                    showOfflinePage(reason);
                }
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            try {
                String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.addRequestHeader("User-Agent", userAgent);
                request.setNotificationVisibility(
                        DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                // 保存到应用专属目录，无需存储权限：
                // Android/data/ge.wanjuan.reader/files/Download/
                request.setDestinationInExternalFilesDir(
                        MainActivity.this, Environment.DIRECTORY_DOWNLOADS, fileName);
                DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                if (manager != null) {
                    manager.enqueue(request);
                    Toast.makeText(this,
                            "已开始下载：" + fileName + "\n保存于应用专属 Download 目录",
                            Toast.LENGTH_LONG).show();
                }
            } catch (Exception error) {
                Toast.makeText(this, "下载失败：" + error.getMessage(), Toast.LENGTH_LONG).show();
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(baseUrl);
        }
    }

    /** 站内链接留在 WebView，站外链接交给系统浏览器，mailto/tel 交给系统应用。 */
    private boolean handleUrl(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme();
        if (scheme == null) return false;

        if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) {
            String host = uri.getHost();
            String baseHost = Uri.parse(baseUrl).getHost();
            if (host != null && host.equalsIgnoreCase(baseHost)) {
                return false;
            }
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (Exception ignored) {
                Toast.makeText(this, "没有可打开此链接的应用", Toast.LENGTH_SHORT).show();
            }
            return true;
        }

        if ("mailto".equalsIgnoreCase(scheme) || "tel".equalsIgnoreCase(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (Exception ignored) {
                // 忽略：设备上没有邮件/电话应用
            }
            return true;
        }

        return false;
    }

    private void showOfflinePage(String reason) {
        String html = "<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<style>body{margin:0;padding:28px 22px;background:#f3ead7;color:#2a2419;"
                + "font-family:serif;line-height:1.8}h1{font-size:22px;color:#9b2d20}"
                + "code{background:#e9dcc4;padding:2px 6px;border-radius:4px;word-break:break-all}"
                + "ol{padding-left:20px}li{margin:8px 0}.tip{color:#6e6350;font-size:14px}"
                + "</style></head><body><h1>无法连接万卷阁服务</h1><p>当前地址：<code>"
                + TextUtils.htmlEncode(baseUrl)
                + "</code></p><p>错误：<code>" + TextUtils.htmlEncode(reason) + "</code></p>"
                + "<ol><li>确认服务器已启动：终端出现“万卷阁 v1.0.0 已启动”。</li>"
                + "<li>手机本机运行（Termux）时，地址应为 <code>http://127.0.0.1:7410</code>。</li>"
                + "<li>服务在电脑上时，在右上角菜单“服务器地址”填写电脑局域网地址，"
                + "例如 <code>http://192.168.1.20:7410</code>，并让电脑以 "
                + "<code>WANJUAN_HOST=0.0.0.0</code> 启动。</li>"
                + "<li>确认手机与电脑在同一 Wi-Fi，且电脑防火墙允许该端口。</li>"
                + "<li>若端口 7410 被占用，服务会自动改用 7411–7430，请以服务端日志为准。</li></ol>"
                + "<p class=\"tip\">本应用只是阅读界面，不包含书库数据；书库保存在运行服务的设备上。</p>"
                + "</body></html>";
        webView.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
    }

    private void showAddressDialog() {
        final EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setText(baseUrl);
        input.setSelection(input.getText().length());

        new AlertDialog.Builder(this)
                .setTitle("服务器地址")
                .setMessage("默认 127.0.0.1 指手机本机（需先用 Termux 运行服务）。\n"
                        + "若服务在电脑上，请填写电脑局域网地址，例如 http://192.168.1.20:7410。")
                .setView(input)
                .setPositiveButton("保存并加载", (dialog, which) -> {
                    String url = normalize(input.getText().toString());
                    if (url.isEmpty()) {
                        Toast.makeText(this, "地址不能为空", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    baseUrl = url;
                    prefs.edit().putString(KEY_URL, baseUrl).apply();
                    webView.loadUrl(baseUrl);
                })
                .setNeutralButton("恢复默认", (dialog, which) -> {
                    baseUrl = normalize(BuildConfig.SERVER_URL);
                    prefs.edit().putString(KEY_URL, baseUrl).apply();
                    webView.loadUrl(baseUrl);
                })
                .setNegativeButton("取消", null)
                .show();
    }

    private void showAboutDialog() {
        new AlertDialog.Builder(this)
                .setTitle("关于万卷阁")
                .setMessage("万卷阁 WANJUAN GE v" + BuildConfig.VERSION_NAME + "\n\n"
                        + "离线古籍与公版典籍阅读器。本应用是 WebView 外壳，"
                        + "书库、搜索、翻译与阅读数据都由你本机或局域网中的万卷阁服务提供。\n\n"
                        + "当前服务器：" + baseUrl + "\n\n"
                        + "程序不收集任何数据；API Key 保存在服务端的 data/user.json 中，"
                        + "不会写入本应用。")
                .setPositiveButton("知道了", null)
                .show();
    }

    /** 补全协议、去掉末尾斜杠。 */
    private String normalize(String raw) {
        String url = raw == null ? "" : raw.trim();
        if (url.isEmpty()) return "";
        if (!url.matches("^[a-zA-Z][a-zA-Z0-9+.-]*://.*")) {
            url = "http://" + url;
        }
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        menu.add(0, MENU_ADDRESS, 0, "服务器地址");
        menu.add(0, MENU_REFRESH, 1, "刷新");
        menu.add(0, MENU_ABOUT, 2, "关于");
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case MENU_ADDRESS:
                showAddressDialog();
                return true;
            case MENU_REFRESH:
                webView.reload();
                return true;
            case MENU_ABOUT:
                showAboutDialog();
                return true;
            default:
                return super.onOptionsItemSelected(item);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
