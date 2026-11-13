'use strict';

const fs = require('fs');
const path = require('path');
const {
  ensureDir,
  readJson,
  writeJsonAtomic,
  countChars,
  nowIso,
  hash
} = require('./util');

const ROOT = path.join(__dirname, '..');
const LIBRARY_DIR = path.join(ROOT, 'library');
const BOOKS_DIR = path.join(LIBRARY_DIR, 'books');
const CATALOG_FILE = path.join(LIBRARY_DIR, 'catalog.json');
const DATA_DIR = path.join(ROOT, 'data');
const INDEX_FILE = path.join(DATA_DIR, 'search-index.json');

const bookCache = new Map();
const BOOK_CACHE_LIMIT = 6;
let catalogCache = null;
let searchIndexCache = null;

function ensureLibrary() {
  ensureDir(BOOKS_DIR);
  ensureDir(DATA_DIR);
}

function normalizeId(id) {
  return String(id || '').trim();
}

function bookFile(id) {
  const safe = normalizeId(id);
  if (!/^[a-zA-Z0-9._-]{1,120}$/.test(safe)) throw new Error('无效的书籍 ID');
  return path.join(BOOKS_DIR, `${safe}.json`);
}

function chapterCount(book) {
  return Array.isArray(book.chapters) ? book.chapters.length : 0;
}

function charCount(book) {
  if (!book || !Array.isArray(book.chapters)) return 0;
  return book.chapters.reduce((sum, chapter) => {
    if (Array.isArray(chapter.verses)) {
      return sum + chapter.verses.reduce((n, verse) => n + countChars(verse.text || ''), 0);
    }
    return sum + countChars(chapter.paragraphs || []);
  }, 0);
}

function bookToMeta(book) {
  return {
    id: book.id,
    title: book.title || book.id,
    subtitle: book.subtitle || '',
    author: book.author || '佚名',
    era: book.era || '',
    category: book.category || '其他',
    tags: Array.isArray(book.tags) ? book.tags : [],
    intro: book.intro || '',
    script: book.script || 'traditional',
    type: book.type || 'text',
    chapterCount: chapterCount(book),
    charCount: charCount(book),
    source: book.source || null,
    builtin: book.builtin !== false,
    cover: book.cover || '',
    order: Number.isFinite(book.order) ? book.order : 999,
    addedAt: book.addedAt || nowIso()
  };
}

function rebuildCatalog({ quiet = false } = {}) {
  ensureLibrary();
  const books = [];
  for (const name of fs.readdirSync(BOOKS_DIR)) {
    if (!name.endsWith('.json')) continue;
    const book = readJson(path.join(BOOKS_DIR, name), null);
    if (!book || !book.id) continue;
    books.push(bookToMeta(book));
  }
  books.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-Hans-CN'));
  const catalog = {
    version: 1,
    updatedAt: nowIso(),
    books
  };
  writeJsonAtomic(CATALOG_FILE, catalog);
  catalogCache = catalog;
  searchIndexCache = null;
  if (!quiet) console.log(`[library] 目录已重建：${books.length} 部`);
  return catalog;
}

function loadCatalog() {
  if (catalogCache) return catalogCache;
  ensureLibrary();
  const loaded = readJson(CATALOG_FILE, null);
  if (!loaded || !Array.isArray(loaded.books)) return rebuildCatalog({ quiet: true });
  catalogCache = loaded;
  return loaded;
}

function saveCatalog(catalog) {
  catalog.updatedAt = nowIso();
  writeJsonAtomic(CATALOG_FILE, catalog);
  catalogCache = catalog;
  searchIndexCache = null;
  return catalog;
}

function listBooks() {
  return loadCatalog().books.slice();
}

function getBook(id) {
  const key = normalizeId(id);
  if (bookCache.has(key)) {
    const cached = bookCache.get(key);
    bookCache.delete(key);
    bookCache.set(key, cached);
    return cached;
  }
  const file = bookFile(key);
  const book = readJson(file, null);
  if (!book) return null;
  bookCache.set(key, book);
  while (bookCache.size > BOOK_CACHE_LIMIT) {
    bookCache.delete(bookCache.keys().next().value);
  }
  return book;
}

function saveBook(book, { rebuild = false } = {}) {
  if (!book || !book.id) throw new Error('书籍缺少 id');
  ensureLibrary();
  const file = bookFile(book.id);
  const existed = fs.existsSync(file);
  writeJsonAtomic(file, book);
  bookCache.delete(book.id);
  if (rebuild) {
    rebuildCatalog({ quiet: true });
    return book;
  }
  const catalog = loadCatalog();
  const meta = bookToMeta(book);
  const index = catalog.books.findIndex((item) => item.id === meta.id);
  if (index >= 0) catalog.books[index] = meta;
  else catalog.books.push(meta);
  catalog.books.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-Hans-CN'));
  saveCatalog(catalog);
  if (!existed) console.log(`[library] 新增：${meta.title}`);
  return book;
}

function deleteBook(id) {
  const book = getBook(id);
  if (!book) return false;
  if (book.builtin !== false) throw new Error('内置书籍不可删除');
  fs.unlinkSync(bookFile(id));
  bookCache.delete(id);
  const catalog = loadCatalog();
  catalog.books = catalog.books.filter((item) => item.id !== id);
  saveCatalog(catalog);
  return true;
}

function chapterText(book, chapterIndex) {
  const chapter = book?.chapters?.[chapterIndex];
  if (!chapter) return [];
  if (Array.isArray(chapter.verses)) return chapter.verses.map((verse) => verse.text || '');
  return (chapter.paragraphs || []).slice();
}

function buildSearchIndex() {
  const catalog = loadCatalog();
  const entries = [];
  for (const meta of catalog.books) {
    let book;
    try {
      book = getBook(meta.id);
    } catch {
      continue;
    }
    if (!book) continue;
    (book.chapters || []).forEach((chapter, chapterIndex) => {
      const texts = chapterText(book, chapterIndex);
      for (const text of texts) {
        const value = String(text || '').trim();
        if (!value) continue;
        entries.push({ b: meta.id, c: chapterIndex, t: value });
      }
    });
  }
  const index = {
    version: 1,
    builtAt: nowIso(),
    catalogUpdatedAt: catalog.updatedAt,
    entries
  };
  try {
    writeJsonAtomic(INDEX_FILE, index);
  } catch (error) {
    console.warn('[library] 搜索索引写入失败：', error.message);
  }
  searchIndexCache = index;
  console.log(`[library] 搜索索引：${entries.length} 段`);
  return index;
}

function getSearchIndex() {
  if (searchIndexCache) return searchIndexCache;
  const catalog = loadCatalog();
  const cached = readJson(INDEX_FILE, null);
  if (
    cached &&
    Array.isArray(cached.entries) &&
    cached.catalogUpdatedAt === catalog.updatedAt
  ) {
    searchIndexCache = cached;
    return cached;
  }
  return buildSearchIndex();
}

function makeSnippet(text, q, radius = 46) {
  const lower = text.toLowerCase();
  const at = lower.indexOf(q.toLowerCase());
  if (at < 0) return text.slice(0, radius * 2) + (text.length > radius * 2 ? '…' : '');
  const start = Math.max(0, at - radius);
  const end = Math.min(text.length, at + q.length + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

function search(query, { limit = 60 } = {}) {
  const q = String(query || '').trim();
  if (!q) return { query: q, total: 0, results: [] };
  const catalog = loadCatalog();
  const metaById = new Map(catalog.books.map((book) => [book.id, book]));
  const index = getSearchIndex();
  const results = [];
  let total = 0;
  const seen = new Set();

  for (const meta of catalog.books) {
    if (meta.title.includes(q) || meta.author.includes(q)) {
      results.push({
        bookId: meta.id,
        title: meta.title,
        author: meta.author,
        category: meta.category,
        chapterIndex: 0,
        chapterTitle: '书籍信息',
        snippet: meta.intro || `${meta.author} · ${meta.category}`,
        titleMatch: true
      });
      seen.add(`${meta.id}:title`);
    }
  }

  const lower = q.toLowerCase();
  for (const entry of index.entries) {
    if (!entry.t.toLowerCase().includes(lower)) continue;
    total += 1;
    if (results.length >= limit) continue;
    const meta = metaById.get(entry.b);
    if (!meta) continue;
    const key = `${entry.b}:${entry.c}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const book = getBook(entry.b);
    const chapter = book?.chapters?.[entry.c];
    results.push({
      bookId: entry.b,
      title: meta.title,
      author: meta.author,
      category: meta.category,
      chapterIndex: entry.c,
      chapterTitle: chapter?.title || `第 ${entry.c + 1} 章`,
      snippet: makeSnippet(entry.t, q),
      titleMatch: false
    });
    if (results.length >= limit) break;
  }

  return { query: q, total: total + (results.some((r) => r.titleMatch) ? 1 : 0), results };
}

function stats() {
  const catalog = loadCatalog();
  const categories = {};
  let chars = 0;
  for (const book of catalog.books) {
    categories[book.category] = (categories[book.category] || 0) + 1;
    chars += book.charCount || 0;
  }
  return {
    books: catalog.books.length,
    chars,
    categories,
    builtin: catalog.books.filter((book) => book.builtin).length,
    imported: catalog.books.filter((book) => !book.builtin).length,
    updatedAt: catalog.updatedAt
  };
}

function newBookId(title, author = '') {
  return `import-${hash(`${title}|${author}|${Date.now()}`, 12)}`;
}

module.exports = {
  ROOT,
  LIBRARY_DIR,
  BOOKS_DIR,
  DATA_DIR,
  ensureLibrary,
  loadCatalog,
  rebuildCatalog,
  listBooks,
  getBook,
  saveBook,
  deleteBook,
  chapterText,
  getSearchIndex,
  buildSearchIndex,
  search,
  stats,
  bookToMeta,
  charCount,
  chapterCount,
  newBookId
};
