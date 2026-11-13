#!/usr/bin/env node
'use strict';

/**
 * 万卷阁 · 书库索引构建
 *
 * 作用：
 *   1. 扫描 library/books/*.json，重建 library/catalog.json；
 *   2. 生成 data/search-index.json（按段落/经文分词前的原文条目）；
 *   3. 打印书籍数、章节数、正文字数与搜索条目数，供发布前核对。
 *
 * 用法：
 *   node tools/build-index.js
 *   npm run index
 */

const fs = require('fs');
const path = require('path');

const library = require('../lib/library');

function megabytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function main() {
  const startedAt = Date.now();
  console.log('万卷阁 · 正在重建书库目录与全文索引……');

  const catalog = library.rebuildCatalog({ quiet: true });
  const stats = library.stats();
  const index = library.buildSearchIndex();

  const chapters = catalog.books.reduce((sum, book) => sum + (book.chapterCount || 0), 0);
  const categories = Object.keys(stats.categories || {}).length;
  const indexFile = path.join(library.DATA_DIR, 'search-index.json');
  const indexSize = fs.existsSync(indexFile) ? fs.statSync(indexFile).size : 0;

  console.log('');
  console.log('万卷阁索引构建完成');
  console.log(`  书籍：${catalog.books.length} 部（${categories} 个分类）`);
  console.log(`  章节：${chapters} 章`);
  console.log(`  正文：${stats.chars.toLocaleString('zh-CN')} 字`);
  console.log(`  搜索条目：${index.entries.length.toLocaleString('zh-CN')} 段`);
  console.log(`  索引文件：data/search-index.json（${megabytes(indexSize)}）`);
  console.log(`  耗时：${((Date.now() - startedAt) / 1000).toFixed(1)} 秒`);

  if (!catalog.books.length) {
    throw new Error('书库为空：请检查 library/books/ 是否包含书籍 JSON');
  }
  if (!index.entries.length) {
    throw new Error('搜索索引为空：书籍章节可能缺少 paragraphs/verses 字段');
  }
}

try {
  main();
} catch (error) {
  console.error(`索引构建失败：${error.message}`);
  process.exitCode = 1;
}
