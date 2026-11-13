'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(file, data) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function readText(file, fallback = '') {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return fallback;
  }
}

function writeTextAtomic(file, text) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
}

function hash(input, len = 12) {
  return crypto.createHash('sha1').update(String(input)).digest('hex').slice(0, len);
}

function slugify(input, fallback = 'book') {
  const ascii = String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return ascii || `${fallback}-${hash(input || fallback, 10)}`;
}

function countChars(value) {
  if (typeof value === 'string') return value.replace(/\s/g, '').length;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + countChars(item), 0);
  if (value && typeof value === 'object') {
    if (Array.isArray(value.verses)) {
      return value.verses.reduce((sum, v) => sum + countChars(v.text || ''), 0);
    }
    if (Array.isArray(value.paragraphs)) return countChars(value.paragraphs);
    return Object.values(value).reduce((sum, item) => sum + countChars(item), 0);
  }
  return 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function nowIso() {
  return new Date().toISOString();
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJoin(root, requested) {
  const decoded = decodeURIComponent(String(requested || '/'));
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(root, normalized);
  const rel = path.relative(root, full);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return full;
}

function stripBom(text) {
  return String(text || '').replace(/^\uFEFF/, '');
}

function normalizeCJKSpaces(text) {
  return String(text || '')
    .replace(/([\u3400-\u9FFF\uF900-\uFAFF])[ \t]+(?=[\u3400-\u9FFF\uF900-\uFAFF])/g, '$1')
    .replace(/([\u3400-\u9FFF\uF900-\uFAFF])[ \t]+([，。；：！？、」』）》])/g, '$1$2')
    .replace(/([，。；：！？、」』）》])[ \t]+(?=[\u3400-\u9FFF\uF900-\uFAFF「『（《])/g, '$1')
    .replace(/([「『（《])[ \t]+([\u3400-\u9FFF])/g, '$1$2')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function walkFiles(dir, filter = () => true) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, filter));
    else if (filter(full, entry)) out.push(full);
  }
  return out;
}

module.exports = {
  ensureDir,
  readJson,
  writeJsonAtomic,
  readText,
  writeTextAtomic,
  hash,
  slugify,
  countChars,
  clamp,
  nowIso,
  escapeHtml,
  safeJoin,
  stripBom,
  normalizeCJKSpaces,
  formatBytes,
  walkFiles
};
