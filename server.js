'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { URL } = require('url');

const library = require('./lib/library');
const store = require('./lib/store');
const translate = require('./lib/translate');
const importers = require('./lib/importers');
const { safeJoin, ensureDir, readJson, formatBytes } = require('./lib/util');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DOCS_DIR = path.join(ROOT, 'docs');
// 发布包内 manual.html 与 MANUAL.html 并存，Git 源码只有小写文件名
const MANUAL_FILE = fs.existsSync(path.join(DOCS_DIR, 'MANUAL.html'))
  ? path.join(DOCS_DIR, 'MANUAL.html')
  : path.join(DOCS_DIR, 'manual.html');
const WORLD_FILE = path.join(ROOT, 'data', 'world-sites.json');
const TIMELINE_FILE = path.join(ROOT, 'data', 'world-timeline.json');
const VERSION = (fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8') || '1.1.0').trim();
const NAME = '万卷阁';
const HOST = process.env.WANJUAN_HOST || '127.0.0.1';
const BASE_PORT = Number(process.env.WANJUAN_PORT) || 7410;
const MAX_BODY = 48 * 1024 * 1024;

let worldCache = null;

function fileStamp(file) {
  try {
    const stat = fs.statSync(file);
    return `${stat.mtimeMs}:${stat.size}`;
  } catch {
    return 'missing';
  }
}

function loadWorldPayload() {
  const key = `${fileStamp(WORLD_FILE)}|${fileStamp(TIMELINE_FILE)}`;
  if (worldCache && worldCache.key === key) return worldCache.payload;
  const sites = readJson(WORLD_FILE, null);
  const timeline = readJson(TIMELINE_FILE, null);
  if (!sites || !Array.isArray(sites.sites)) {
    throw Object.assign(new Error('世界遗址数据缺失或格式错误'), { statusCode: 500 });
  }
  if (!timeline || !Array.isArray(timeline.eras)) {
    throw Object.assign(new Error('世界时间轴数据缺失或格式错误'), { statusCode: 500 });
  }
  const payload = {
    sites: sites.sites,
    civilizations: Array.isArray(sites.civilizations) ? sites.civilizations : [],
    timeline,
    version: sites.version || timeline.version || 1,
    updatedAt: sites.updatedAt || timeline.updatedAt || null
  };
  worldCache = { key, payload };
  return payload;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

function log(message) {
  const time = new Date().toTimeString().slice(0, 8);
  console.log(`[${time}] ${message}`);
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' http://127.0.0.1:* http://localhost:*; font-src 'self' data:; object-src 'none'; base-uri 'self'"
  );
}

function sendJson(req, res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  const accept = String((req && req.headers && req.headers['accept-encoding']) || '');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (body.length > 16384 && accept.includes('gzip')) {
    const zipped = zlib.gzipSync(body, { level: 6 });
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    res.writeHead(status);
    res.end(zipped);
    return;
  }
  res.writeHead(status, { 'Content-Length': body.length });
  res.end(body);
}

function sendError(res, status, message, extra = {}) {
  sendJson({}, res, status, { error: message, ...extra });
}

function readBody(req, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('请求体过大'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve(null);
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error('JSON 格式错误'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function sendFile(req, res, file, { cache = false } = {}) {
  const ext = path.extname(file).toLowerCase();
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  const stat = fs.statSync(file);
  const type = MIME[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', type);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', cache ? 'public, max-age=86400' : 'no-cache');
  if (req.method === 'HEAD') {
    res.writeHead(200);
    res.end();
    return true;
  }
  fs.createReadStream(file).pipe(res);
  return true;
}

function routeParts(pathname) {
  return pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
}

async function handleApi(req, res, url) {
  const parts = routeParts(url.pathname);
  const method = req.method.toUpperCase();

  if (method === 'GET' && parts[1] === 'health') {
    return sendJson(req, res, 200, {
      ok: true,
      name: NAME,
      version: VERSION,
      node: process.version,
      uptime: Math.round(process.uptime()),
      books: library.stats().books
    });
  }

  if (method === 'GET' && parts[1] === 'world' && !parts[2]) {
    try {
      return sendJson(req, res, 200, loadWorldPayload());
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message || '世界地图数据读取失败');
    }
  }

  if (method === 'GET' && parts[1] === 'catalog') {
    return sendJson(req, res, 200, {
      name: NAME,
      version: VERSION,
      stats: library.stats(),
      books: library.listBooks()
    });
  }

  if (method === 'GET' && parts[1] === 'stats') {
    const stats = library.stats();
    return sendJson(req, res, 200, {
      ...stats,
      version: VERSION,
      dataSize: formatBytes(JSON.stringify(library.listBooks()).length),
      categories: stats.categories
    });
  }

  if (method === 'GET' && parts[1] === 'search') {
    const q = url.searchParams.get('q') || '';
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 60));
    const result = library.search(q, { limit });
    return sendJson(req, res, 200, result);
  }

  if (method === 'POST' && parts[1] === 'reindex') {
    const index = library.buildSearchIndex();
    return sendJson(req, res, 200, { ok: true, entries: index.entries.length });
  }

  if (method === 'GET' && parts[1] === 'books' && parts[2] && !parts[3]) {
    const book = library.getBook(parts[2]);
    if (!book) return sendError(res, 404, '没有这本书');
    return sendJson(req, res, 200, {
      ...book,
      chapterCount: library.chapterCount(book),
      charCount: library.charCount(book)
    });
  }

  if (method === 'GET' && parts[1] === 'books' && parts[2] && parts[3] === 'download') {
    const book = library.getBook(parts[2]);
    if (!book) return sendError(res, 404, '没有这本书');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${book.id}.json"`);
    res.writeHead(200);
    res.end(JSON.stringify(book, null, 2));
    return;
  }

  if (method === 'DELETE' && parts[1] === 'books' && parts[2]) {
    const deleted = library.deleteBook(parts[2]);
    return sendJson(req, res, 200, { ok: deleted });
  }

  if (method === 'GET' && parts[1] === 'user') {
    const user = store.getUser();
    return sendJson(req, res, 200, {
      settings: store.publicSettings(),
      progress: user.progress,
      bookmarks: user.bookmarks,
      notes: user.notes
    });
  }

  if (method === 'GET' && parts[1] === 'settings') {
    return sendJson(req, res, 200, { settings: store.publicSettings() });
  }

  if (method === 'POST' && parts[1] === 'settings') {
    const body = await readBody(req);
    if (!body || typeof body !== 'object') return sendError(res, 400, '设置内容为空');
    return sendJson(req, res, 200, { settings: store.updateSettings(body) });
  }

  if (method === 'POST' && parts[1] === 'progress') {
    const body = await readBody(req);
    if (!body?.bookId) return sendError(res, 400, '缺少 bookId');
    const progress = store.setProgress(body.bookId, body.chapter, body.percent);
    return sendJson(req, res, 200, { progress });
  }

  if (method === 'POST' && parts[1] === 'bookmarks') {
    const body = await readBody(req);
    if (!body?.bookId) return sendError(res, 400, '缺少 bookId');
    return sendJson(req, res, 200, { bookmark: store.addBookmark(body) });
  }

  if (method === 'DELETE' && parts[1] === 'bookmarks' && parts[2]) {
    return sendJson(req, res, 200, store.removeBookmark(parts[2]));
  }

  if (method === 'POST' && parts[1] === 'notes') {
    const body = await readBody(req);
    if (!body?.bookId) return sendError(res, 400, '缺少 bookId');
    return sendJson(req, res, 200, { note: store.addNote(body) });
  }

  if (method === 'PATCH' && parts[1] === 'notes' && parts[2]) {
    const body = await readBody(req);
    const note = store.updateNote(parts[2], body?.text);
    if (!note) return sendError(res, 404, '找不到这条笔记');
    return sendJson(req, res, 200, { note });
  }

  if (method === 'DELETE' && parts[1] === 'notes' && parts[2]) {
    return sendJson(req, res, 200, store.deleteNote(parts[2]));
  }

  if (method === 'POST' && parts[1] === 'translate' && parts[2] === 'test') {
    const body = await readBody(req);
    const result = await translate.testConnection(body || {});
    return sendJson(req, res, 200, result);
  }

  if (method === 'POST' && parts[1] === 'translate') {
    const body = await readBody(req);
    if (!body?.bookId) return sendError(res, 400, '缺少 bookId');
    const chapter = Math.max(0, Number(body.chapter) || 0);
    const target = body.target === 'en' ? 'en' : 'zh-modern';
    const result = await translate.translateChapter(body.bookId, chapter, target, {
      force: Boolean(body.force)
    });
    return sendJson(req, res, 200, result);
  }

  if (method === 'POST' && parts[1] === 'grade') {
    const body = await readBody(req);
    if (!body?.bookId) return sendError(res, 400, '缺少 bookId');
    const chapter = Math.max(0, Number(body.chapter) || 0);
    const exerciseIndex = Math.max(0, Number(body.exerciseIndex) || 0);
    const answer = String(body.answer || '').trim();
    if (!answer) return sendError(res, 400, '请先写下你的答案');
    if (answer.length > 4000) return sendError(res, 400, '答案过长，请控制在 4000 字以内');
    const result = await translate.gradeAnswer({ bookId: body.bookId, chapter, exerciseIndex, answer });
    return sendJson(req, res, 200, result);
  }

  if (method === 'POST' && parts[1] === 'import') {
    const body = await readBody(req);
    const title = String(body?.title || '').trim();
    const text = String(body?.text || '');
    if (!title) return sendError(res, 400, '请填写书名');
    if (text.trim().length < 20) return sendError(res, 400, '正文太短，至少 20 个字符');
    const chapters = importers.parsePlainText(text, {
      defaultChapterTitle: '正文',
      ...(body.chapterTitle ? { defaultChapterTitle: body.chapterTitle } : {})
    });
    const author = String(body.author || '').trim();
    const id = importers.makeImportId(title, author);
    const tags = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || '')
          .split(/[,，、\s]+/)
          .filter(Boolean);
    const book = importers.buildBook({
      id,
      title,
      author,
      era: String(body.era || '').trim(),
      category: String(body.category || '其他').trim(),
      tags,
      intro: String(body.intro || '').trim() || '由用户导入的文本，章节按「第…章/卷/回」或空行自动切分。',
      script: body.simplified ? 'simplified' : 'mixed',
      chapters,
      source: { provider: '用户导入', license: '用户自备', note: '仅存于本机，未上传' },
      builtin: false,
      order: 5000
    });
    library.saveBook(book);
    return sendJson(req, res, 200, { ok: true, book: library.bookToMeta(book) });
  }

  if (method === 'GET' && parts[1] === 'version') {
    return sendJson(req, res, 200, { name: NAME, version: VERSION });
  }

  return sendError(res, 404, '接口不存在');
}

async function handler(req, res) {
  setSecurityHeaders(res);
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || `${HOST}:${server.address()?.port || BASE_PORT}`}`);
  } catch {
    return sendError(res, 400, '无效的 URL');
  }

  try {
    if (url.pathname.startsWith('/api/')) {
      return await handleApi(req, res, url);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return sendError(res, 405, '不支持的请求方法');
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return sendFile(req, res, path.join(PUBLIC_DIR, 'index.html'));
    }
    if (url.pathname === '/manual' || url.pathname === '/manual/') {
      return sendFile(req, res, MANUAL_FILE);
    }
    if (url.pathname === '/manual.html') {
      return sendFile(req, res, MANUAL_FILE);
    }
    if (url.pathname.startsWith('/docs/')) {
      const file = safeJoin(DOCS_DIR, url.pathname.slice('/docs/'.length));
      if (file && sendFile(req, res, file, { cache: true })) return;
      return sendError(res, 404, '文档不存在');
    }
    if (url.pathname === '/favicon.ico') {
      return sendFile(req, res, path.join(PUBLIC_DIR, 'icons', 'icon.svg'), { cache: true });
    }

    const file = safeJoin(PUBLIC_DIR, url.pathname);
    if (file && sendFile(req, res, file, { cache: /\.(svg|png|jpg|jpeg|webp|woff2)$/i.test(file) })) return;
    return sendError(res, 404, '页面不存在');
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) log(`错误：${error.stack || error.message}`);
    return sendJson(req, res, status, { error: error.message || '服务器内部错误' });
  }
}

ensureDir(path.join(ROOT, 'data'));
library.ensureLibrary();
try {
  const catalog = library.loadCatalog();
  log(`书库：${catalog.books.length} 部`);
} catch (error) {
  log(`书库加载失败：${error.message}`);
}

const server = http.createServer(handler);

let port = BASE_PORT;

function listen(nextPort) {
  server.listen(nextPort, HOST, () => {
    port = nextPort;
    log(`${NAME} v${VERSION} 已启动：http://${HOST}:${port}`);
    log(`说明书：http://${HOST}:${port}/manual`);
    log('按 Ctrl+C 停止。数据只保存在本机 data/ 目录。');
  });
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && port < BASE_PORT + 20) {
    log(`端口 ${port} 被占用，尝试 ${port + 1}`);
    port += 1;
    setTimeout(() => listen(port), 120);
    return;
  }
  log(`启动失败：${error.message}`);
  process.exitCode = 1;
});

process.on('SIGINT', () => {
  log('正在停止……');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500);
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500);
});

listen(port);
