'use strict';

const path = require('path');
const { ensureDir, readJson, writeJsonAtomic, hash } = require('./util');
const store = require('./store');
const library = require('./library');

const ROOT = path.join(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'data', 'translations');

const TARGET_LABEL = {
  'zh-modern': '现代汉语',
  en: 'English'
};

function targetLabel(target) {
  return TARGET_LABEL[target] || target;
}

function endpointOf(baseUrl) {
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) throw new Error('尚未配置翻译接口地址');
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
  return `${trimmed}/chat/completions`;
}

function isLocalUrl(baseUrl) {
  try {
    const url = new URL(baseUrl);
    return ['127.0.0.1', 'localhost', '::1', '0.0.0.0'].includes(url.hostname);
  } catch {
    return false;
  }
}

function translationSettings() {
  const settings = store.getUser().settings;
  if (!settings.baseUrl) throw new Error('尚未配置翻译接口。请到「设置」填写 Base URL 与模型名称。');
  if (!settings.model) throw new Error('尚未配置模型名称。请到「设置」填写模型。');
  if (!settings.apiKey && !isLocalUrl(settings.baseUrl)) {
    throw new Error('尚未配置 API Key。远程接口需要密钥；本地 Ollama 可留空。');
  }
  return settings;
}

function systemPrompt(target) {
  if (target === 'en') {
    return [
      'You are a careful sinologist and literary translator.',
      'Translate each input paragraph of Classical or Literary Chinese into clear, faithful English.',
      'Rules:',
      '1. Preserve the exact number and order of paragraphs.',
      '2. Do not add commentary, summaries, or explanations.',
      '3. Keep names, book titles, and technical terms; add a brief parenthetical only when indispensable.',
      '4. Preserve the register: scripture stays solemn, military text stays crisp, poetry stays poetic.',
      '5. Output ONLY a JSON array of strings, one translation per input paragraph. No Markdown fences.'
    ].join('\n');
  }
  return [
    '你是一位精通先秦至明清文献的汉语学者。',
    '请把用户给出的每一段文言文或古汉语，逐段翻译成准确、通顺、保留原意的现代汉语。',
    '规则：',
    '1. 严格保持段落数量和顺序，不得合并或拆分。',
    '2. 不增删内容，不加入解说、评论或标题。',
    '3. 人名、地名、书名、官名保留，必要时用括号略注。',
    '4. 佛经咒语中的音译词保留，并在首次出现时括注常见意译。',
    '5. 只输出 JSON 字符串数组，每个元素对应一段译文，不要 Markdown 代码块。'
  ].join('\n');
}

function buildBatches(texts, maxItems = 10, maxChars = 3200) {
  const batches = [];
  let current = [];
  let chars = 0;
  for (const text of texts) {
    const length = String(text).length;
    if (current.length && (current.length >= maxItems || chars + length > maxChars)) {
      batches.push(current);
      current = [];
      chars = 0;
    }
    current.push(text);
    chars += length;
  }
  if (current.length) batches.push(current);
  return batches;
}

function parseTranslationArray(content, expected) {
  let text = String(content || '').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`翻译接口返回的内容不是合法 JSON。返回片段：${String(content).slice(0, 180)}`);
  }
  if (!Array.isArray(parsed)) throw new Error('翻译接口没有返回数组。');
  const values = parsed.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      return String(item.translation ?? item.text ?? item.zh ?? item.en ?? '');
    }
    return String(item ?? '');
  });
  if (values.length !== expected) {
    throw new Error(`译文段数不匹配：期望 ${expected} 段，收到 ${values.length} 段。请重试，或换用更稳定的模型。`);
  }
  return values;
}

async function callProvider(payload, settings) {
  const url = endpointOf(settings.baseUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000);
  const headers = { 'Content-Type': 'application/json' };
  if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify(payload)
    });
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') throw new Error('翻译请求超时（180 秒）。');
    throw new Error(`无法连接翻译接口：${error.message}`);
  }
  clearTimeout(timer);
  const raw = await response.text();
  if (!response.ok) {
    let detail = raw.slice(0, 300);
    try {
      const parsed = JSON.parse(raw);
      detail = parsed.error?.message || parsed.message || detail;
    } catch {
      /* keep raw */
    }
    throw new Error(`翻译接口返回 ${response.status}：${detail}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('翻译接口返回的不是 JSON。');
  }
  const content = data.choices?.[0]?.message?.content;
  if (content == null) throw new Error('翻译接口没有返回 choices[0].message.content。');
  return Array.isArray(content) ? content.map((part) => part.text || '').join('') : String(content);
}

async function translateTexts(texts, target, settings, context = {}) {
  const batches = buildBatches(texts);
  const out = [];
  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const bookLine = context.title
      ? `书名：${context.title}${context.author ? `；作者：${context.author}` : ''}\n`
      : '';
    const userContent = `${bookLine}请翻译以下 ${batch.length} 段，返回 ${batch.length} 个元素的 JSON 数组：\n${JSON.stringify(batch)}`;
    const payload = {
      model: settings.model,
      temperature: Number(settings.temperature) || 0,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt(target) },
        { role: 'user', content: userContent }
      ]
    };
    const content = await callProvider(payload, settings);
    const values = parseTranslationArray(content, batch.length);
    out.push(...values.map((value) => String(value).trim()));
  }
  return out;
}

function cacheFile(bookId, target) {
  const safe = String(bookId).replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(CACHE_DIR, `${safe}.${target}.json`);
}

function readCache(bookId, target) {
  return readJson(cacheFile(bookId, target), { version: 1, chapters: {} });
}

function writeCache(bookId, target, cache) {
  ensureDir(CACHE_DIR);
  writeJsonAtomic(cacheFile(bookId, target), cache);
}

async function translateChapter(bookId, chapterIndex, target = 'zh-modern', { force = false } = {}) {
  if (!['zh-modern', 'en'].includes(target)) throw new Error('不支持的翻译目标');
  const book = library.getBook(bookId);
  if (!book) throw new Error('找不到这本书');
  const chapter = book.chapters?.[chapterIndex];
  if (!chapter) throw new Error('找不到这一章');
  const source = library.chapterText(book, chapterIndex);
  if (!source.length) throw new Error('这一章没有可翻译的文字');

  const cache = readCache(bookId, target);
  const key = String(chapterIndex);
  if (!force && Array.isArray(cache.chapters[key]) && cache.chapters[key].length === source.length) {
    return {
      bookId,
      chapterIndex,
      chapterTitle: chapter.title,
      target,
      targetLabel: targetLabel(target),
      translations: cache.chapters[key],
      cached: true
    };
  }

  const settings = translationSettings();
  const translations = await translateTexts(source, target, settings, {
    title: book.title,
    author: book.author
  });
  cache.chapters[key] = translations;
  cache.updatedAt = new Date().toISOString();
  cache.bookTitle = book.title;
  cache.target = target;
  writeCache(bookId, target, cache);

  return {
    bookId,
    chapterIndex,
    chapterTitle: chapter.title,
    target,
    targetLabel: targetLabel(target),
    translations,
    cached: false
  };
}

async function testConnection(patch = {}) {
  const user = store.getUser();
  const settings = { ...user.settings, ...patch };
  if (patch.apiKey === '__KEEP__' || patch.apiKey === undefined) {
    settings.apiKey = user.settings.apiKey;
  }
  if (!settings.baseUrl) throw new Error('请先填写 Base URL');
  if (!settings.model) throw new Error('请先填写模型名称');
  const content = await callProvider(
    {
      model: settings.model,
      temperature: 0,
      stream: false,
      messages: [
        { role: 'system', content: 'You are a connectivity test. Reply with exactly: OK' },
        { role: 'user', content: 'ping' }
      ]
    },
    settings
  );
  return {
    ok: true,
    message: '连接成功',
    model: settings.model,
    reply: String(content).slice(0, 80)
  };
}

module.exports = {
  targetLabel,
  translateChapter,
  translateTexts,
  testConnection,
  translationSettings
};
