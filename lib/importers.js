'use strict';

const path = require('path');
const fs = require('fs');
const { hash, normalizeCJKSpaces, countChars } = require('./util');

const SKIP_HEADINGS = new Set([
  '人物',
  '版本',
  '解題',
  '解题',
  '目録',
  '目录',
  '參考文獻',
  '参考文献',
  '校勘記',
  '校勘记',
  '提要'
]);

function stripOuterBookMarks(title) {
  const value = String(title || '').trim();
  if (value.startsWith('《') && value.endsWith('》')) return value.slice(1, -1).trim();
  return value;
}

function cleanLine(line) {
  return String(line || '')
    .replace(/<pb:[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/¶/g, '')
    .replace(/^[\s\u3000]+|[\s\u3000]+$/g, '')
    .replace(/￥\s*\d+/g, '')
    .replace(/^\s*[\uFFE5￥]\s*\d+\s*/, '')
    .replace(/^\s*No\.\s*\d+.*$/i, '')
    .replace(/^\s*\[Nos?\..*$/i, '')
    .replace(/^\s*[A-Z]\d{2}n\d+[a-z]?\d*.*$/, '')
    .replace(/^\s*CBETA[，,].*$/i, '')
    .replace(/^\s*[:：].*$/, '')
    .replace(/[ \t]+$/g, '')
    .trim();
}

function isMetadataLine(line) {
  const value = String(line || '').trim();
  return (
    !value ||
    value.startsWith('#') ||
    value.startsWith(':') ||
    value.startsWith('|') ||
    /^\*{1,4}\s*$/.test(value) ||
    /^[-=]{3,}$/.test(value)
  );
}

function isHeading(line) {
  return /^\s*\*{1,4}\s+\S/.test(line);
}

const CLASSICAL_TITLE = new RegExp(
  '^(?:' +
    '[\u3400-\u9FFF]{2,10}(?:紀|記|傳|志|表|書|訓|篇|策|經|品)第[零一二三四五六七八九十百千0-9上中下]+' +
    '|[\u3400-\u9FFF]{2,10}第[零一二三四五六七八九十百千0-9上中下]+' +
    '|[\u3400-\u9FFF]{1,8}卷[零一二三四五六七八九十百千0-9上中下]+' +
  ')$'
);

function classicalTitle(line) {
  const candidate = String(line || '')
    .replace(/[（(].*$/, '')
    .replace(/[\s\u3000]+/g, '')
    .trim();
  if (candidate.length < 2 || candidate.length > 14) return '';
  return CLASSICAL_TITLE.test(candidate) ? candidate : '';
}

function headingInfo(line) {
  const match = String(line).match(/^\s*(\*{1,4})\s+(.+?)\s*$/);
  if (!match) return null;
  return { level: match[1].length, title: stripOuterBookMarks(match[2].replace(/¶/g, '').trim()) };
}

function endsSentence(value) {
  return /[。！？?!；;」』）》】…]$/.test(value);
}

function pushParagraph(chapters, chapter, buffer) {
  if (!buffer.length) return;
  const text = buffer.join('').replace(/\s+/g, ' ').trim();
  buffer.length = 0;
  if (!text) return;
  chapter.paragraphs.push(text);
}

function parseKanripoText(text, fallbackTitle) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const chapters = [];
  let chapter = { title: fallbackTitle || '正文', paragraphs: [] };
  let buffer = [];
  let skipSection = false;
  const plainTitleMode = !lines.some((line) => isHeading(line));

  const flushChapter = () => {
    pushParagraph(chapters, chapter, buffer);
    if (chapter.paragraphs.length) chapters.push(chapter);
  };

  for (const rawLine of lines) {
    if (isMetadataLine(rawLine)) continue;
    const line = cleanLine(rawLine);
    if (!line) continue;

    if (isHeading(rawLine)) {
      const info = headingInfo(rawLine);
      if (!info) continue;
      const title = info.title;
      if (!title) continue;
      if (SKIP_HEADINGS.has(title)) {
        skipSection = true;
        continue;
      }
      skipSection = false;
      pushParagraph(chapters, chapter, buffer);
      if (chapter.paragraphs.length) chapters.push(chapter);
      chapter = { title: title || `第 ${chapters.length + 1} 节`, paragraphs: [] };
      continue;
    }

    if (skipSection) continue;

    if (/(目録|目錄|目录)$/.test(line) && line.length <= 8) {
      skipSection = true;
      continue;
    }

    if (plainTitleMode) {
      const title = classicalTitle(line);
      if (title) {
        pushParagraph(chapters, chapter, buffer);
        if (chapter.paragraphs.length) chapters.push(chapter);
        chapter = { title: stripOuterBookMarks(title), paragraphs: [] };
        continue;
      }
    }

    const skipPatterns = [
      /^\[?\s*CBETA/i,
      /^大正新脩大藏經/i,
      /^Taisho Tripitaka/i,
      /^No\.\s*\d+/i,
      /^[A-Z]\d{2}n\d+/i,
      /^\d{4}年/,
      /^ISSN/,
      /^ISBN/
    ];
    if (skipPatterns.some((pattern) => pattern.test(line))) continue;

    buffer.push(line);
    const joined = buffer.join('');
    if (endsSentence(line) || joined.length >= 150 || buffer.length >= 4) {
      pushParagraph(chapters, chapter, buffer);
    }
  }

  pushParagraph(chapters, chapter, buffer);
  if (chapter.paragraphs.length) chapters.push(chapter);

  return chapters.filter((item) => item.paragraphs.length > 0);
}

function parseKanripoFiles(files, options = {}) {
  const sorted = files.slice().sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const body = sorted.length > 1 ? sorted.filter((file) => !/_000\.txt$/i.test(file.name)) : sorted;
  const chapters = [];
  let index = 0;
  for (const file of body) {
    index += 1;
    const metaTitle = (String(file.text).match(/^#\+TITLE:\s*(.+)$/m) || [])[1];
    const fallback = metaTitle
      ? stripOuterBookMarks(metaTitle.trim())
      : `${options.chapterPrefix || '卷'}${index}`;
    const parsed = parseKanripoText(file.text, fallback);
    if (!parsed.length) continue;
    if (parsed.length === 1 && parsed[0].title === fallback && body.length > 1) {
      parsed[0].title = `${fallback} · 卷${index}`;
    }
    chapters.push(...parsed);
  }
  return chapters;
}

function splitLongParagraph(text, max = 420) {
  const value = String(text || '').trim();
  if (value.length <= max) return [value];
  const parts = [];
  let rest = value;
  while (rest.length > max) {
    let cut = -1;
    for (let i = max; i >= Math.floor(max * 0.6); i -= 1) {
      if (/[。！？；]/.test(rest[i])) {
        cut = i + 1;
        break;
      }
    }
    if (cut < 0) cut = max;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts.filter(Boolean);
}

function parsePlainText(text, options = {}) {
  const value = String(text || '').replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '');
  const lines = value.split('\n');
  const chapters = [];
  let current = { title: options.defaultChapterTitle || '正文', paragraphs: [] };
  let buffer = [];

  const flushParagraph = () => {
    const paragraph = buffer.join('').replace(/\s+/g, ' ').trim();
    buffer = [];
    if (!paragraph) return;
    for (const part of splitLongParagraph(paragraph)) current.paragraphs.push(part);
  };

  const flushChapter = () => {
    flushParagraph();
    if (current.paragraphs.length) chapters.push(current);
  };

  const headingPattern = /^\s*(?:#{1,3}\s+|第[零一二三四五六七八九十百千两0-9]+[章卷回篇节]\s*[、.．:：]?\s*.*$|卷[零一二三四五六七八九十百千0-9]+.*$)/;

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    if (headingPattern.test(line)) {
      const title = line.replace(/^\s*#{1,3}\s*/, '').trim();
      if (current.paragraphs.length || buffer.length) flushChapter();
      current = { title: title || `第 ${chapters.length + 1} 章`, paragraphs: [] };
      continue;
    }
    buffer.push(line.trim());
    if (/[。！？?!；;]$/.test(line.trim()) && buffer.join('').length >= 80) flushParagraph();
  }

  flushChapter();
  if (!chapters.length) {
    const paragraphs = value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
    chapters.push({ title: options.defaultChapterTitle || '正文', paragraphs: paragraphs.flatMap((item) => splitLongParagraph(item)) });
  }
  return chapters.filter((chapter) => chapter.paragraphs.length);
}

function buildBook({
  id,
  title,
  subtitle = '',
  author = '',
  era = '',
  category = '其他',
  tags = [],
  intro = '',
  script = 'traditional',
  chapters,
  source = null,
  builtin = true,
  cover = '',
  order = 999,
  type = 'text'
}) {
  if (!Array.isArray(chapters) || !chapters.length) throw new Error(`${title || id}：没有解析到正文`);
  const cleanChapters = chapters
    .map((chapter) => ({
      title: String(chapter.title || '').trim() || '未命名',
      paragraphs: (chapter.paragraphs || []).map((p) => String(p).trim()).filter(Boolean)
    }))
    .filter((chapter) => chapter.paragraphs.length);
  if (!cleanChapters.length) throw new Error(`${title || id}：正文为空`);
  const book = {
    schema: 1,
    id,
    title,
    subtitle,
    author,
    era,
    category,
    tags,
    intro,
    script,
    type,
    cover,
    order,
    builtin,
    source,
    chapters: cleanChapters,
    charCount: cleanChapters.reduce((sum, c) => sum + countChars(c.paragraphs), 0),
    addedAt: new Date().toISOString()
  };
  return book;
}

function makeImportId(title, author = '') {
  return `import-${hash(`${title}|${author}|${Date.now()}`, 12)}`;
}

const TS_MAP_FILE = path.join(__dirname, '..', 'tools', 'data', 'TSCharacters.txt');
let tsMap = null;

function loadTraditionalMap() {
  if (tsMap) return tsMap;
  tsMap = new Map();
  try {
    const lines = fs.readFileSync(TS_MAP_FILE, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.startsWith('#')) continue;
      const [trad, simp] = line.split('\t');
      if (!trad || !simp) continue;
      const first = simp.split(' ')[0];
      if (first) tsMap.set(trad, first);
    }
  } catch {
    console.warn('[convert] 未找到 OpenCC 简繁映射表，保留原文');
  }
  return tsMap;
}

function toSimplified(text) {
  const map = loadTraditionalMap();
  if (!map.size) return String(text || '');
  let out = '';
  for (const char of String(text || '')) out += map.get(char) || char;
  return out;
}

function normalizeScriptText(text, { simplified = true } = {}) {
  let value = String(text || '').replace(/\s+/g, ' ').trim();
  if (simplified) value = toSimplified(value);
  return normalizeCJKSpaces(value);
}

module.exports = {
  parseKanripoText,
  parseKanripoFiles,
  parsePlainText,
  buildBook,
  makeImportId,
  toSimplified,
  normalizeScriptText,
  stripOuterBookMarks,
  splitLongParagraph
};
