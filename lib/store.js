'use strict';

const path = require('path');
const { ensureDir, readJson, writeJsonAtomic, nowIso, hash } = require('./util');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const USER_FILE = path.join(DATA_DIR, 'user.json');

const DEFAULT_SETTINGS = {
  providerName: 'DeepSeek',
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  apiKey: '',
  temperature: 0.2,
  target: 'zh-modern',
  theme: 'paper',
  fontSize: 19,
  lineHeight: 1.85,
  showTranslation: false,
  autoTranslate: false
};

function defaultUser() {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    progress: {},
    bookmarks: [],
    notes: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

let cache = null;

function getUser() {
  if (cache) return cache;
  ensureDir(DATA_DIR);
  const loaded = readJson(USER_FILE, null);
  if (!loaded || typeof loaded !== 'object') {
    cache = defaultUser();
  } else {
    cache = {
      ...defaultUser(),
      ...loaded,
      settings: { ...DEFAULT_SETTINGS, ...(loaded.settings || {}) },
      progress: loaded.progress && typeof loaded.progress === 'object' ? loaded.progress : {},
      bookmarks: Array.isArray(loaded.bookmarks) ? loaded.bookmarks : [],
      notes: Array.isArray(loaded.notes) ? loaded.notes : []
    };
  }
  return cache;
}

function saveUser(user = getUser()) {
  user.updatedAt = nowIso();
  cache = user;
  writeJsonAtomic(USER_FILE, user);
  return user;
}

function publicSettings() {
  const { apiKey, ...rest } = getUser().settings;
  return { ...rest, hasApiKey: Boolean(apiKey), apiKeyMasked: apiKey ? `••••${apiKey.slice(-4)}` : '' };
}

function updateSettings(patch) {
  const user = getUser();
  const next = { ...user.settings };
  for (const [key, value] of Object.entries(patch || {})) {
    if (key === 'apiKey') {
      if (value === '__KEEP__' || value === undefined) continue;
      next.apiKey = String(value || '').trim();
      continue;
    }
    if (key in DEFAULT_SETTINGS) next[key] = value;
  }
  next.fontSize = Math.min(34, Math.max(14, Number(next.fontSize) || 19));
  next.lineHeight = Math.min(2.6, Math.max(1.4, Number(next.lineHeight) || 1.85));
  next.temperature = Math.min(1.5, Math.max(0, Number(next.temperature) || 0));
  if (!['zh-modern', 'en'].includes(next.target)) next.target = 'zh-modern';
  if (!['paper', 'night', 'sepia'].includes(next.theme)) next.theme = 'paper';
  user.settings = next;
  saveUser(user);
  return publicSettings();
}

function setProgress(bookId, chapter, percent) {
  const user = getUser();
  user.progress[bookId] = {
    chapter: Math.max(0, Number(chapter) || 0),
    percent: Math.min(100, Math.max(0, Number(percent) || 0)),
    updatedAt: nowIso()
  };
  saveUser(user);
  return user.progress[bookId];
}

function addBookmark(input) {
  const user = getUser();
  const bookmark = {
    id: hash(`${input.bookId}|${input.chapter}|${input.paragraph}|${Date.now()}`, 16),
    bookId: String(input.bookId || ''),
    chapter: Number(input.chapter) || 0,
    paragraph: Number(input.paragraph) || 0,
    quote: String(input.quote || '').slice(0, 500),
    note: String(input.note || '').slice(0, 2000),
    createdAt: nowIso()
  };
  user.bookmarks.unshift(bookmark);
  user.bookmarks = user.bookmarks.slice(0, 500);
  saveUser(user);
  return bookmark;
}

function removeBookmark(id) {
  const user = getUser();
  user.bookmarks = user.bookmarks.filter((item) => item.id !== id);
  saveUser(user);
  return { ok: true };
}

function addNote(input) {
  const user = getUser();
  const note = {
    id: hash(`${input.bookId}|${input.chapter}|${Date.now()}|${Math.random()}`, 16),
    bookId: String(input.bookId || ''),
    chapter: Number(input.chapter) || 0,
    quote: String(input.quote || '').slice(0, 1000),
    text: String(input.text || '').slice(0, 8000),
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  user.notes.unshift(note);
  user.notes = user.notes.slice(0, 1000);
  saveUser(user);
  return note;
}

function updateNote(id, text) {
  const user = getUser();
  const note = user.notes.find((item) => item.id === id);
  if (!note) return null;
  note.text = String(text || '').slice(0, 8000);
  note.updatedAt = nowIso();
  saveUser(user);
  return note;
}

function deleteNote(id) {
  const user = getUser();
  user.notes = user.notes.filter((item) => item.id !== id);
  saveUser(user);
  return { ok: true };
}

module.exports = {
  DEFAULT_SETTINGS,
  getUser,
  saveUser,
  publicSettings,
  updateSettings,
  setProgress,
  addBookmark,
  removeBookmark,
  addNote,
  updateNote,
  deleteNote
};
