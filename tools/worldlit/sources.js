'use strict';

/**
 * 世界神话与童话书系的公版底本读取与解析。
 *
 * 底本全部来自 Project Gutenberg（公有领域）：
 *   pg3327  Thomas Bulfinch, Bulfinch's Mythology: The Age of Fable
 *   pg5314  Brothers Grimm, Household Tales, trans. Margaret Hunt (1884)
 *   pg27200 Hans Christian Andersen, Fairy Tales, trans. H. P. Paull
 *   pg28    The Fables of Aesop, ed. Joseph Jacobs (1894)
 *   pg21    Three Hundred Aesop's Fables, trans. George Fyler Townsend (1867)
 *
 * 本文件只负责把英文底本切成篇目；中文标题、提要、导读均由本项目原创。
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const WORK_DIR = path.join(__dirname, '..', '..', '_work', 'worldlit');

const FILES = {
  bulfinch: { file: 'pg3327.txt', id: 3327, label: 'Bulfinch, The Age of Fable' },
  grimm: { file: 'pg5314.txt', id: 5314, label: 'Grimm, Household Tales (Margaret Hunt)' },
  andersen: { file: 'pg27200.txt', id: 27200, label: 'Andersen, Fairy Tales (H. P. Paull)' },
  jacobs: { file: 'pg28.txt', id: 28, label: 'The Fables of Aesop, ed. Joseph Jacobs (1894)' },
  townsend: { file: 'pg21.txt', id: 21, label: "Three Hundred Aesop's Fables (Townsend)" }
};

const GUTENBERG_URL = (id) => `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`;

function ensureSources({ quiet = false } = {}) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
  for (const [key, item] of Object.entries(FILES)) {
    const full = path.join(WORK_DIR, item.file);
    if (fs.existsSync(full) && fs.statSync(full).size > 50000) continue;
    if (!quiet) console.log(`[worldlit] 下载 ${item.label} ...`);
    try {
      execFileSync('curl', ['-sL', '-m', '180', '-o', full, GUTENBERG_URL(item.id)], {
        stdio: 'inherit'
      });
    } catch (error) {
      throw new Error(`下载 ${item.file} 失败：${error.message}`);
    }
    if (!fs.existsSync(full) || fs.statSync(full).size < 50000) {
      throw new Error(`底本 ${item.file} 不完整，请检查网络后重试`);
    }
  }
}

function readSource(key) {
  const item = FILES[key];
  if (!item) throw new Error(`未知底本：${key}`);
  const full = path.join(WORK_DIR, item.file);
  if (!fs.existsSync(full)) throw new Error(`缺少底本 ${item.file}，请先运行下载步骤`);
  return fs.readFileSync(full, 'utf8').replace(/\r\n?/g, '\n');
}

function gutenbergBody(text) {
  const start = text.indexOf('*** START OF');
  const end = text.indexOf('*** END OF');
  if (start < 0) throw new Error('底本缺少 Gutenberg 起始标记');
  const from = text.indexOf('\n', start);
  return text.slice(from + 1, end > 0 ? end : text.length);
}

function isPageArtifact(line) {
  const value = String(line || '').trim();
  return (
    !value ||
    /^\[Illustration[^\]]*\]$/i.test(value) ||
    /^\[Frontispiece[^\]]*\]$/i.test(value) ||
    /^[-=_*~]{3,}$/.test(value) ||
    /^\[?\d+\]?$/.test(value) ||
    /^Page \d+$/i.test(value) ||
    /^Transcriber'?s? Note/i.test(value)
  );
}

function linesToParagraphs(lines) {
  const out = [];
  let buffer = [];
  const flush = () => {
    if (!buffer.length) return;
    let value = buffer.join(' ').replace(/\s+/g, ' ').trim();
    value = value.replace(/\s+([,.;:!?])/g, '$1');
    if (value && !isPageArtifact(value)) out.push(value);
    buffer = [];
  };
  for (const raw of lines) {
    const line = String(raw || '').replace(/\s+$/g, '');
    if (!line.trim()) flush();
    else buffer.push(line.trim());
  }
  flush();
  return out;
}

function normalizedTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9]/g, '');
}

/* ------------------------------------------------------------------ *
 * 格林童话：Household Tales（Margaret Hunt, 1884），第 1—200 篇
 * ------------------------------------------------------------------ */

function parseGrimm() {
  const body = gutenbergBody(readSource('grimm'));
  const lines = body.split('\n');
  const start = lines.findIndex((line) => /^1\s+The Frog-King/.test(line));
  if (start < 0) throw new Error('格林童話：找不到第 1 篇标题');
  const headings = [];
  for (let i = start; i < lines.length; i += 1) {
    const match = lines[i].match(/^(\d{1,3})\s+([^\n]+)$/);
    if (!match) continue;
    const n = Number(match[1]);
    if (n !== headings.length + 1) continue;
    headings.push({ n, title: match[2].trim().replace(/\.$/, ''), line: i });
  }
  if (headings.length !== 200) throw new Error(`格林童話：只解析到 ${headings.length} 篇，应为 200`);
  return headings.map((heading, index) => {
    const end = index + 1 < headings.length ? headings[index + 1].line : lines.length;
    const paragraphs = linesToParagraphs(lines.slice(heading.line + 1, end));
    return { n: heading.n, title: heading.title, paragraphs };
  });
}

/* ------------------------------------------------------------------ *
 * 安徒生童话：Fairy Tales（H. P. Paull 英译）
 * ------------------------------------------------------------------ */

const ANDERSEN_TITLE_FIXES = {
  'The Dumb Cook': 'THE DUMB BOOK',
  'The Will-o-the-Wisp in the Town, Says the Wild Woman':
    "THE WILL-O-THE WISP IS IN THE TOWN, SAYS THE MOOR WOMAN"
};

function parseAndersen() {
  const body = gutenbergBody(readSource('andersen'));
  const contentsAt = body.indexOf('\nCONTENTS');
  if (contentsAt < 0) throw new Error('安徒生童話：找不到 CONTENTS');
  const storyAt = body.indexOf('\nA STORY', contentsAt + 20);
  const toc = body
    .slice(contentsAt + 9, storyAt)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (toc.length < 100) throw new Error(`安徒生童話：目录仅 ${toc.length} 篇`);

  const lines = body.slice(storyAt).split('\n');
  const headings = [];
  for (let i = 0; i < lines.length; i += 1) {
    const value = lines[i].trim();
    if (
      /^[A-Z0-9][A-Z0-9’'\-. ,!?&]+$/.test(value) &&
      value.length > 2 &&
      value.length < 90 &&
      /[A-Z]{2}/.test(value)
    ) {
      headings.push({ title: value, line: i });
    }
  }

  const used = new Set();
  const wanted = [];
  for (const title of toc) {
    const fixed = ANDERSEN_TITLE_FIXES[title] || title.toUpperCase();
    const key = normalizedTitle(fixed);
    const found = headings.find((h) => !used.has(h.line) && normalizedTitle(h.title) === key);
    if (!found) {
      throw new Error(`安徒生童話：正文中找不到《${title}》`);
    }
    used.add(found.line);
    wanted.push({ tocTitle: title, title: found.title, line: found.line });
  }
  // 目录漏收的一篇，正文有独立标题
  const extra = headings.find((h) => /THE CONCEITED APPLE-BRANCH/.test(h.title));
  if (extra && !used.has(extra.line)) {
    wanted.push({
      tocTitle: 'The Conceited Apple-Branch',
      title: extra.title,
      line: extra.line
    });
  }
  wanted.sort((a, b) => a.line - b.line);

  return wanted.map((item, index) => {
    const end = index + 1 < wanted.length ? wanted[index + 1].line : lines.length;
    const paragraphs = linesToParagraphs(lines.slice(item.line + 1, end)).filter(
      (p) => !/^THE END\.?$/i.test(p)
    );
    return { title: item.title, tocTitle: item.tocTitle, paragraphs };
  });
}

/* ------------------------------------------------------------------ *
 * 伊索寓言：Jacobs 1894 选本 + Townsend 1867 三百篇
 * ------------------------------------------------------------------ */

function indentedToc(body, keyword) {
  const at = body.indexOf(`\n${keyword}`);
  if (at < 0) throw new Error(`找不到目录：${keyword}`);
  const lines = body.slice(at).split('\n').slice(2);
  const out = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    if (!/^\s+\S/.test(line)) break;
    out.push(line.trim());
  }
  return out;
}

function scanHeadings(lines, start, titles, stopPattern) {
  const counts = new Map();
  for (const title of titles) {
    const key = normalizedTitle(title);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const found = [];
  for (let i = start; i < lines.length; i += 1) {
    const value = lines[i].trim();
    if (stopPattern && stopPattern.test(value)) {
      found.stopLine = i;
      break;
    }
    const key = normalizedTitle(value);
    if (!key || !(counts.get(key) > 0)) continue;
    if (i === 0 || lines[i - 1].trim() !== '') continue;
    counts.set(key, counts.get(key) - 1);
    found.push({ title: value, line: i });
  }
  const left = [...counts.entries()].filter(([, n]) => n > 0);
  return { headings: found, left, stopLine: found.stopLine };
}

function sliceStories(lines, headings) {
  return headings.map((heading, index) => {
    let end = index + 1 < headings.length ? headings[index + 1].line : lines.length;
    if (heading.stopLine && end > heading.stopLine) end = heading.stopLine;
    const paragraphs = linesToParagraphs(lines.slice(heading.line + 1, end));
    return { title: heading.title, paragraphs };
  });
}

function parseAesopJacobs() {
  const body = gutenbergBody(readSource('jacobs'));
  const toc = indentedToc(body, 'Contents').filter(
    (title) => title !== 'PREFACE' && !/SHORT HISTORY/i.test(title)
  );
  if (toc.length !== 82) throw new Error(`Jacobs 寓言：目录 ${toc.length} 篇，应为 82`);
  const preface = body.indexOf('\nPREFACE', body.indexOf('\nContents'));
  const bodyAt = body.indexOf('\nThe Cock and the Pearl', preface);
  if (bodyAt < 0) throw new Error('Jacobs 寓言：找不到正文起点');
  const lines = body.slice(bodyAt).split('\n');
  const { headings, left } = scanHeadings(lines, 0, toc, /^NOTES?$/i);
  if (left.length) throw new Error(`Jacobs 寓言：有 ${left.length} 篇未能定位`);
  if (headings.length !== 82) throw new Error(`Jacobs 寓言：只解析到 ${headings.length} 篇`);
  return sliceStories(lines, headings).map((story) => ({ ...story, edition: 'Jacobs 1894' }));
}

function parseAesopTownsend() {
  const body = gutenbergBody(readSource('townsend'));
  let toc = indentedToc(body, 'CONTENTS').filter(
    (title) =>
      title !== 'PREFACE' &&
      title !== 'LIFE OF AESOP' &&
      title !== 'FOOTNOTES' &&
      title !== 'INDEX' &&
      !/AESOP’S FABLES/i.test(title)
  );
  if (toc.length !== 313) throw new Error(`Townsend 寓言：目录 ${toc.length} 篇，应为 313`);
  const firstLife = body.indexOf('\nLIFE OF AESOP');
  const secondLife = body.indexOf('\nLIFE OF AESOP', firstLife + 5);
  const bodyAt = body.indexOf('\nAESOP’S FABLES', secondLife + 5);
  if (bodyAt < 0) throw new Error('Townsend 寓言：找不到正文起点');
  const lines = body.slice(bodyAt).split('\n');
  const { headings, left } = scanHeadings(lines, 0, toc, /^FOOTNOTES$/);
  if (left.length) throw new Error(`Townsend 寓言：有 ${left.length} 篇未能定位`);
  if (headings.length !== 313) throw new Error(`Townsend 寓言：只解析到 ${headings.length} 篇`);
  return sliceStories(lines, headings).map((story) => ({ ...story, edition: 'Townsend 1867' }));
}

/**
 * 合并两个公版伊索集：Jacobs 82 篇为骨干，Townsend 中与 Jacobs 同题者不重复收录，
 * 其余补入。合并后约 350 余篇，覆盖两个底本的全部独立篇目。
 */
function parseAesop() {
  const jacobs = parseAesopJacobs();
  const townsend = parseAesopTownsend();
  const seen = new Set(jacobs.map((s) => normalizedTitle(s.title)));
  const extras = [];
  for (const story of townsend) {
    const key = normalizedTitle(story.title);
    if (seen.has(key)) continue;
    seen.add(key);
    extras.push(story);
  }
  return { jacobs, townsend, merged: [...jacobs, ...extras], townsendUnique: extras.length };
}

/* ------------------------------------------------------------------ *
 * Bulfinch：Age of Fable 的罗马数字章
 * ------------------------------------------------------------------ */

function parseBulfinchChapters() {
  const body = gutenbergBody(readSource('bulfinch'));
  const lines = body.split('\n');
  const sectionAt = body.indexOf('Stories of Gods and Heroes.');
  const minLine = sectionAt >= 0 ? body.slice(0, sectionAt).split('\n').length - 1 : 260;
  const starts = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (i < minLine) continue;
    if (/^Chapter [IVXL]+$/.test(lines[i].trim())) {
      starts.push({ numeral: lines[i].trim().replace('Chapter ', ''), line: i });
    }
    if (/^CHAPTER II$/.test(lines[i].trim())) {
      starts.push({ numeral: 'II', line: i });
    }
  }
  starts.sort((a, b) => a.line - b.line);
  const seen = new Set();
  const unique = [];
  for (const item of starts) {
    if (seen.has(item.numeral)) continue;
    seen.add(item.numeral);
    unique.push(item);
  }
  return unique.map((item, index) => {
    const end = index + 1 < unique.length ? unique[index + 1].line : lines.length;
    return {
      numeral: item.numeral,
      line: item.line,
      lines: lines.slice(item.line + 1, end)
    };
  });
}

/**
 * 取 Bulfinch 某章的英文段落；可用 startPattern/endPattern 截取其中一段。
 */
function bulfinchExcerpt(chapter, { startPattern = null, endPattern = null, maxParagraphs = 14 } = {}) {
  let lines = chapter.lines;
  if (startPattern) {
    const at = lines.findIndex((line) => startPattern.test(line.trim()));
    if (at >= 0) lines = lines.slice(at);
  }
  if (endPattern) {
    const at = lines.findIndex((line) => endPattern.test(line.trim()));
    if (at > 0) lines = lines.slice(0, at);
  }
  const paragraphs = linesToParagraphs(lines);
  return paragraphs.slice(0, maxParagraphs);
}

module.exports = {
  WORK_DIR,
  FILES,
  ensureSources,
  readSource,
  gutenbergBody,
  linesToParagraphs,
  normalizedTitle,
  parseGrimm,
  parseAndersen,
  parseAesop,
  parseAesopJacobs,
  parseAesopTownsend,
  parseBulfinchChapters,
  bulfinchExcerpt
};
