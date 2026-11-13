'use strict';

/**
 * 从 Kanripo（汉籍全文仓库）拉取种子书单并生成 library/books/*.json。
 * 用法：node tools/fetch-seed.js [--only=id1,id2] [--force] [--concurrency=3]
 * 只使用 GitHub codeload 的 tar.gz，不需要 API 令牌。
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const importers = require('../lib/importers');
const library = require('../lib/library');
const { ensureDir, writeJsonAtomic } = require('../lib/util');

const ROOT = path.join(__dirname, '..');
const CACHE_DIR = path.join(ROOT, '_work', 'kanripo');
const REPORT_FILE = path.join(ROOT, '_work', 'import-report.json');
const SEED_FILE = path.join(__dirname, 'seed-list.json');

const args = process.argv.slice(2);
const onlyArg = (args.find((item) => item.startsWith('--only=')) || '').slice('--only='.length);
const only = new Set(onlyArg ? onlyArg.split(',').map((s) => s.trim()).filter(Boolean) : []);
const force = args.includes('--force');
const noCache = args.includes('--no-cache');
const concurrency = Math.max(1, Number((args.find((item) => item.startsWith('--concurrency=')) || '').split('=')[1]) || 3);

const UA = 'wanjuan-ge/1.0 (+https://github.com/kanripo)';

function extractTarGz(buffer) {
  const tar = zlib.gunzipSync(buffer);
  const files = [];
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const rawName = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const size = parseInt(header.subarray(124, 136).toString('ascii').replace(/\0/g, '').trim(), 8) || 0;
    const type = String.fromCharCode(header[156] || 48);
    offset += 512;
    const content = tar.subarray(offset, offset + size);
    offset += Math.ceil(size / 512) * 512;
    if (type !== '0' && type !== '\0' && type !== '') continue;
    const base = rawName.split('/').pop();
    if (!/\.txt$/i.test(base) || /^Readme/i.test(base)) continue;
    files.push({ name: base, text: content.toString('utf8') });
  }
  return files;
}

async function download(url, target, attempt = 1) {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 1024) throw new Error(`文件过小（${buffer.length} 字节）`);
    ensureDir(path.dirname(target));
    fs.writeFileSync(target, buffer);
    return buffer;
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
    return download(url, target, attempt + 1);
  }
}

async function loadRepo(seed) {
  const cacheFile = path.join(CACHE_DIR, `${seed.repo}.tar.gz`);
  let buffer;
  if (!force && !noCache && fs.existsSync(cacheFile)) {
    buffer = fs.readFileSync(cacheFile);
  } else {
    buffer = await download(
      `https://codeload.github.com/kanripo/${seed.repo}/tar.gz/refs/heads/master`,
      cacheFile
    );
  }
  const files = extractTarGz(buffer);
  if (!files.length) throw new Error('压缩包内没有 .txt 正文');
  return files;
}

function mergeDuplicateChapters(chapters) {
  const seen = new Map();
  const merged = [];
  for (const chapter of chapters) {
    const title = chapter.title || '未命名';
    if (seen.has(title)) {
      seen.get(title).paragraphs.push(...chapter.paragraphs);
      continue;
    }
    const copy = { title, paragraphs: chapter.paragraphs.slice() };
    seen.set(title, copy);
    merged.push(copy);
  }
  return merged;
}

async function importSeed(seed) {
  const started = Date.now();
  const files = await loadRepo(seed);
  const chapters = mergeDuplicateChapters(importers.parseKanripoFiles(files));
  if (!chapters.length) throw new Error('没有解析出章节');
  const book = importers.buildBook({
    id: seed.id,
    title: seed.title,
    subtitle: seed.subtitle || '',
    author: seed.author || '佚名',
    era: seed.era || '',
    category: seed.category || '其他',
    tags: seed.tags || [],
    intro: seed.intro || '',
    script: 'traditional',
    chapters,
    source: {
      provider: 'Kanripo 汉籍全文仓库',
      repo: `kanripo/${seed.repo}`,
      url: `https://github.com/kanripo/${seed.repo}`,
      license: '原典属公有领域；数字化文本由 Kanripo 社群整理，引用请注明来源',
      files: files.length
    },
    builtin: true,
    cover: seed.cover || '',
    order: seed.order || 999
  });
  writeJsonAtomic(path.join(library.BOOKS_DIR, `${book.id}.json`), book);
  book._stats = {
    files: files.length,
    chapters: chapters.length,
    chars: book.charCount,
    seconds: Math.round((Date.now() - started) / 100) / 10
  };
  return book;
}

async function run() {
  const seeds = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  const queue = seeds.filter((seed) => !only.size || only.has(seed.id));
  ensureDir(CACHE_DIR);
  ensureDir(library.BOOKS_DIR);

  console.log(`[seed] 计划导入 ${queue.length} 部，并发 ${concurrency}，缓存目录 _work/kanripo/`);
  const report = { startedAt: new Date().toISOString(), imported: [], failed: [] };
  let cursor = 0;
  let done = 0;

  async function worker() {
    while (cursor < queue.length) {
      const seed = queue[cursor++];
      const index = done++;
      const label = `[${String(index + 1).padStart(2, '0')}/${queue.length}] ${seed.title} (${seed.repo})`;
      try {
        const book = await importSeed(seed);
        report.imported.push({
          id: seed.id,
          title: seed.title,
          repo: seed.repo,
          ...book._stats
        });
        console.log(`${label} 完成：${book._stats.chapters} 章 / ${book._stats.chars} 字 / ${book._stats.files} 文件 / ${book._stats.seconds}s`);
      } catch (error) {
        report.failed.push({ id: seed.id, title: seed.title, repo: seed.repo, error: error.message });
        console.error(`${label} 失败：${error.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  library.rebuildCatalog();
  const catalog = library.loadCatalog();
  report.finishedAt = new Date().toISOString();
  report.books = catalog.books.length;
  report.chars = catalog.books.reduce((sum, book) => sum + (book.charCount || 0), 0);
  writeJsonAtomic(REPORT_FILE, report);

  console.log(`\n[seed] 成功 ${report.imported.length} 部，失败 ${report.failed.length} 部`);
  console.log(`[seed] 书库合计 ${report.books} 部 / ${report.chars} 字`);
  if (report.failed.length) {
    for (const item of report.failed) console.log(`  失败：${item.title} ${item.repo} — ${item.error}`);
    process.exitCode = 2;
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
