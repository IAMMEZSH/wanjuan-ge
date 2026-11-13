'use strict';

const fs = require('fs');
const path = require('path');
const util = require('../lib/util');
const library = require('../lib/library');

const errors = [];
const warnings = [];
const seen = new Set();
let totalChars = 0;
let totalChapters = 0;
const categories = {};

const files = fs.readdirSync(library.BOOKS_DIR).filter((name) => name.endsWith('.json'));
for (const file of files) {
  const full = path.join(library.BOOKS_DIR, file);
  let book;
  try {
    book = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (error) {
    errors.push(`${file}: JSON 解析失败（${error.message}）`);
    continue;
  }
  const expectedId = file.replace(/\.json$/, '');
  if (!book.id) errors.push(`${file}: 缺少 id`);
  else if (book.id !== expectedId) warnings.push(`${file}: id「${book.id}」与文件名不一致`);
  if (seen.has(book.id)) errors.push(`${file}: id 重复`);
  seen.add(book.id);
  if (!book.title) errors.push(`${file}: 缺少 title`);
  if (!Array.isArray(book.chapters) || !book.chapters.length) {
    errors.push(`${file}: 没有章节`);
    continue;
  }
  let chars = 0;
  let emptyChapters = 0;
  for (const [index, chapter] of book.chapters.entries()) {
    if (!chapter || !chapter.title) warnings.push(`${file}: 第 ${index + 1} 章缺少标题`);
    if (Array.isArray(chapter.verses) && chapter.verses.length) {
      const text = chapter.verses.map((v) => String(v.text || '')).join('');
      chars += util.countChars(text);
      continue;
    }
    if (!Array.isArray(chapter.paragraphs) || !chapter.paragraphs.length) {
      emptyChapters += 1;
      continue;
    }
    chars += chapter.paragraphs.reduce((n, p) => n + util.countChars(p), 0);
  }
  if (emptyChapters) warnings.push(`${file}: ${emptyChapters} 章没有正文`);
  if (chars < 100) warnings.push(`${file}: 正文仅 ${chars} 字`);
  totalChars += chars;
  totalChapters += book.chapters.length;
  categories[book.category || '未分类'] = (categories[book.category || '未分类'] || 0) + 1;
  if (book.charCount && Math.abs(book.charCount - chars) > Math.max(50, chars * 0.02)) {
    warnings.push(`${file}: charCount 字段 ${book.charCount} 与正文统计 ${chars} 不一致`);
  }
}

const catalog = library.loadCatalog();
const missing = catalog.books.filter((meta) => !seen.has(meta.id));
const extra = [...seen].filter((id) => !catalog.books.some((meta) => meta.id === id));
for (const meta of missing) errors.push(`目录中有、书库中缺失：${meta.id}`);
for (const id of extra) warnings.push(`书库中有、目录中缺失（需重建目录）：${id}`);

console.log('=== 万卷阁书库校验 ===');
console.log(`书籍文件：${files.length}`);
console.log(`目录条目：${catalog.books.length}`);
console.log(`章节总数：${totalChapters}`);
console.log(`正文字数：${totalChars}`);
console.log('分类分布：');
for (const [name, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${name}: ${count}`);
}
if (warnings.length) {
  console.log(`\n警告（${warnings.length}）：`);
  for (const item of warnings) console.log(`  - ${item}`);
}
if (errors.length) {
  console.log(`\n错误（${errors.length}）：`);
  for (const item of errors) console.log(`  - ${item}`);
  process.exitCode = 1;
} else {
  console.log('\n没有发现结构性错误。');
}
