'use strict';

/**
 * 通用导读类书籍导入器。
 * 读取 _work/guides/*.json，每个文件形如：
 * {
 *   id, title, subtitle, author, era, category, tags, intro, order,
 *   cover, chapters: [{ title, paragraphs: [] }]
 * }
 * 仅用于本项目原创中文导读，不复制现代受版权保护的译文。
 */

const fs = require('fs');
const path = require('path');
const util = require('../lib/util');
const library = require('../lib/library');
const { buildBook } = require('../lib/importers');

const SRC = path.join(__dirname, '..', '_work', 'guides');
const BOOKS_DIR = library.BOOKS_DIR;

function load(file) {
  const full = path.join(SRC, file);
  const data = JSON.parse(fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, ''));
  if (!data.id || !data.title || !Array.isArray(data.chapters)) {
    throw new Error(`格式不完整：${file}`);
  }
  const chapters = data.chapters
    .map((c) => ({
      title: String(c.title || '').trim(),
      paragraphs: (c.paragraphs || []).map((p) => String(p).trim()).filter(Boolean)
    }))
    .filter((c) => c.title && c.paragraphs.length);
  if (chapters.length < 8) throw new Error(`章节过少：${file}`);
  return { ...data, chapters };
}

function run() {
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) {
    console.log('[guides] 没有待导入文件');
    return;
  }
  const report = [];
  for (const file of files) {
    const data = load(file);
    const target = path.join(BOOKS_DIR, `${data.id}.json`);
    if (fs.existsSync(target) && !process.argv.includes('--force')) {
      console.log(`[guides] 跳过已存在：${data.id}`);
      continue;
    }
    const book = buildBook({
      id: data.id,
      title: data.title,
      subtitle: data.subtitle || '',
      author: data.author || '本书编写组',
      era: data.era || '',
      category: data.category || '世界',
      tags: data.tags || [],
      intro: data.intro || '',
      script: 'simplified',
      chapters: data.chapters,
      source: data.source || {
        provider: '本项目原创中文导读',
        license: '原创文本；所涉古代原典属公有领域',
        note: '不复制现代受版权保护的译本'
      },
      builtin: true,
      cover: data.cover || 'world',
      order: Number(data.order) || 90,
      type: 'text'
    });
    util.writeJsonAtomic(target, book);
    report.push({ id: book.id, title: book.title, chapters: book.chapters.length, chars: book.charCount });
    console.log(`[guides] 《${book.title}》：${book.chapters.length} 章 / ${book.charCount} 字`);
  }
  const catalog = library.rebuildCatalog({ quiet: true });
  console.log(`[guides] 目录已重建：${catalog.books.length} 部`);
  for (const item of report) {
    console.log(`  ${item.id}  《${item.title}》  ${item.chapters} 章  ${item.chars} 字`);
  }
}

run();
