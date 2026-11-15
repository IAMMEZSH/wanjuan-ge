'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const state = {
  catalog: null,
  books: [],
  stats: null,
  user: null,
  settings: null,
  version: '1.2.0',
  bookCache: new Map(),
  currentBook: null,
  chapterIndex: 0,
  translation: null,
  translationTarget: 'zh-modern',
  showTranslation: false,
  restorePercent: 0,
  world: null,
  mapCiv: 'all',
  mapType: 'all',
  mapEra: 'all',
  mapSite: null,
  mapAge: null,
  scrollTimer: null,
  translating: false
};

const CATEGORY_GLYPH = {
  经部: '經',
  史部: '史',
  子部: '子',
  集部: '集',
  释部: '釋',
  道部: '道',
  圣经: '聖',
  预言: '讖',
  术数: '術',
  世界: '寰',
  神话: '神',
  童话: '童',
  神秘学: '祕',
  侦探: '偵',
  怪谈: '怪',
  漫画: '漫',
  学术: '學',
  文化: '文',
  其他: '典'
};

const COVER_BY_CATEGORY = {
  经部: 'jingbu.svg',
  史部: 'shibu.svg',
  子部: 'zibu.svg',
  集部: 'jibu.svg',
  释部: 'shi.svg',
  道部: 'dao.svg',
  圣经: 'bible.svg',
  预言: 'prophecy.svg',
  术数: 'shushu.svg',
  世界: 'world.svg',
  神话: 'world.svg',
  童话: 'other.svg',
  神秘学: 'other.svg',
  侦探: 'detective.svg',
  怪谈: 'horror.svg',
  漫画: 'comic.svg',
  学术: 'academic.svg',
  文化: 'culture.svg',
  其他: 'other.svg'
};

const PROVIDER_PRESETS = {
  DeepSeek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  通义千问: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  OpenAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  Ollama: { baseUrl: 'http://127.0.0.1:11434/v1', model: 'qwen2.5:7b' }
};

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attr(value) {
  return esc(value).replace(/`/g, '&#96;');
}

function fmtNumber(value) {
  const n = Number(value) || 0;
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)} 亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`;
  return String(n);
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({ error: '服务器返回了无法解析的内容' }));
  if (!response.ok) throw new Error(data.error || `请求失败（${response.status}）`);
  return data;
}

let toastTimer = null;
function toast(message, duration = 2600) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

function openModal(title, bodyHtml, onMount) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHtml;
  $('#modal').hidden = false;
  document.body.style.overflow = 'hidden';
  if (onMount) onMount($('#modal-body'));
}

function closeModal() {
  $('#modal').hidden = true;
  document.body.style.overflow = '';
}

function openDrawer(title, bodyHtml) {
  $('#drawer-title').textContent = title;
  $('#drawer-body').innerHTML = bodyHtml;
  $('#drawer').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  $('#drawer').hidden = true;
  document.body.style.overflow = '';
}

function bookById(id) {
  return state.books.find((book) => book.id === id) || null;
}

function coverStyle(book) {
  const raw = book.cover || COVER_BY_CATEGORY[book.category] || COVER_BY_CATEGORY.其他;
  const file = /\.[a-z0-9]+$/i.test(raw) ? raw : `${raw}.svg`;
  return `background-image:linear-gradient(160deg, rgba(30,24,16,.16), rgba(30,24,16,.04)),url('/images/covers/${encodeURIComponent(file)}')`;
}

function glyph(book) {
  return CATEGORY_GLYPH[book.category] || '典';
}

function categoryList() {
  const counts = state.stats?.categories || {};
  const names = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  if (!names.includes('其他') && counts['其他']) names.push('其他');
  return names;
}

function renderNav(name) {
  $$('.main-nav a').forEach((link) => {
    link.classList.toggle('active', link.dataset.nav === name);
  });
}

function applySettings() {
  const settings = state.settings || {};
  document.body.dataset.theme = settings.theme || 'paper';
  document.documentElement.style.setProperty('--font-size', `${settings.fontSize || 19}px`);
  document.documentElement.style.setProperty('--line-height', String(settings.lineHeight || 1.85));
}

function setBooks(catalog) {
  state.catalog = catalog;
  state.books = catalog.books || [];
  state.stats = catalog.stats || null;
  state.version = catalog.version || state.version;
  $('#version-label').textContent = `v${state.version}`;
}

async function refreshCatalog() {
  const catalog = await api('/api/catalog');
  setBooks(catalog);
}

async function getBook(id) {
  if (state.bookCache.has(id)) return state.bookCache.get(id);
  const book = await api(`/api/books/${encodeURIComponent(id)}`);
  state.bookCache.set(id, book);
  return book;
}

function translationLabel(target) {
  return target === 'en' ? 'English' : '现代汉语';
}

function bookCard(book) {
  return `
    <article class="book-card">
      <a href="#/book/${encodeURIComponent(book.id)}">
        <div class="book-cover" style="${attr(coverStyle(book))}" data-glyph="${esc(glyph(book))}">
          <span class="cat-badge">${esc(book.category)}</span>
        </div>
        <div class="book-body">
          <h3>${esc(book.title)}</h3>
          <p class="author">${esc(book.author || '佚名')}${book.era ? ` · ${esc(book.era)}` : ''}</p>
          <p class="intro">${esc(book.intro || '')}</p>
          <div class="meta">
            <span>${book.chapterCount} 章</span>
            <span>${fmtNumber(book.charCount)} 字</span>
            <span>${esc(book.script === 'simplified' ? '简体' : '原文')}</span>
          </div>
        </div>
      </a>
    </article>`;
}

function renderHome(params) {
  renderNav('home');
  const activeCat = params.get('cat') || '全部';
  const continueEntry = Object.entries(state.user?.progress || {})
    .sort((a, b) => String(b[1].updatedAt).localeCompare(String(a[1].updatedAt)))[0];
  const continueBook = continueEntry ? bookById(continueEntry[0]) : null;
  const books = state.books.filter((book) => activeCat === '全部' || book.category === activeCat);

  const chips = ['全部', ...categoryList()]
    .map((name) => `<button class="chip ${name === activeCat ? 'active' : ''}" type="button" data-cat="${attr(name)}">${esc(name)}${state.stats?.categories?.[name] ? ` · ${state.stats.categories[name]}` : ''}</button>`)
    .join('');

  const continueHtml = continueBook
    ? `<div class="continue-card">
        <div>
          <h3>继续读《${esc(continueBook.title)}》</h3>
          <p>第 ${Number(continueEntry[1].chapter) + 1} 章 · ${Number(continueEntry[1].percent || 0).toFixed(0)}% · ${fmtDate(continueEntry[1].updatedAt)}</p>
        </div>
        <a class="btn primary" href="#/read/${encodeURIComponent(continueBook.id)}/${Number(continueEntry[1].chapter) || 0}">继续阅读</a>
      </div>`
    : '';

  $('#view').innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">离线优先 · 经史子集 · 世界文明 · 学术自测</p>
        <h1>把一座<em>图书馆</em><br>装进口袋</h1>
        <p class="lead">内置经史子集、佛道经咒、圣经全本与世界文明、学术教材共 171 部，支持在线逐段译为现代汉语或英文；内置习题可自测，主观题可交 AI 批改。全文只存在你的机器里，不注册、不上传、不埋点。</p>
        <div class="hero-actions">
          <a class="btn primary" href="#/book/${encodeURIComponent(state.books[0]?.id || '')}">从第一部开始</a>
          <a class="btn" href="#/collections">按分类浏览</a>
          <a class="btn ghost" href="#/import">导入自己的书</a>
        </div>
      </div>
      <div class="hero-stats">
        <div class="stat-card"><strong>${state.stats?.books ?? state.books.length}</strong><span>内置典籍</span></div>
        <div class="stat-card"><strong>${fmtNumber(state.stats?.chars || 0)}</strong><span>总字数</span></div>
        <div class="stat-card"><strong>${Object.keys(state.stats?.categories || {}).length}</strong><span>个分类</span></div>
      </div>
    </section>
    ${continueHtml}
    <a class="world-entry" href="#/map">
      <div>
        <p class="eyebrow">世界文明</p>
        <h3>世界遗址地图 · 人类文明时间轴</h3>
        <p>把世界遗址放回经纬度，按文明着色；沿十二个时代的时间轴，读文明的转折与交流。</p>
      </div>
      <span class="world-entry-mark" aria-hidden="true">寰</span>
    </a>
    <div class="section-head">
      <h2>书架</h2>
      <p>共 ${books.length} 部 · 按分类筛选</p>
    </div>
    <div class="chips" id="category-chips">${chips}</div>
    <div class="book-grid" style="margin-top:20px">
      ${books.length ? books.map(bookCard).join('') : '<div class="empty-state">这个分类还没有书。</div>'}
    </div>`;

  $$('#category-chips .chip').forEach((button) => {
    button.addEventListener('click', () => {
      const cat = button.dataset.cat;
      location.hash = cat === '全部' ? '#/' : `#/?cat=${encodeURIComponent(cat)}`;
    });
  });
}

function tocHtml(book) {
  if (book.type === 'bible') {
    const groups = new Map();
    book.chapters.forEach((chapter, index) => {
      const name = chapter.book || '圣经';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push({ chapter, index });
    });
    return Array.from(groups.entries())
      .map(
        ([name, items]) => `
        <details class="toc-group">
          <summary>${esc(name)} <span>（${items.length} 章）</span></summary>
          <div class="toc-grid">
            ${items
              .map(
                (item) =>
                  `<a href="#/read/${encodeURIComponent(book.id)}/${item.index}">${esc(item.chapter.title || `第 ${item.chapter.chapter} 章`)}</a>`
              )
              .join('')}
          </div>
        </details>`
      )
      .join('');
  }
  return `<div class="toc-grid">${book.chapters
    .map(
      (chapter, index) =>
        `<a href="#/read/${encodeURIComponent(book.id)}/${index}">${esc(chapter.title || `第 ${index + 1} 章`)}</a>`
    )
    .join('')}</div>`;
}

async function renderBook(id) {
  renderNav('home');
  $('#view').innerHTML = '<div class="boot"><span class="spinner"></span> 正在取书……</div>';
  let book;
  try {
    book = await getBook(id);
  } catch (error) {
    $('#view').innerHTML = `<div class="empty-state">${esc(error.message)}</div>`;
    return;
  }
  state.currentBook = book;
  const progress = state.user?.progress?.[book.id];
  const startChapter = progress ? Math.min(book.chapters.length - 1, Number(progress.chapter) || 0) : 0;
  const source = book.source || {};
  const isOriginal = /原创/.test(source.provider || '');
  const sourceLine = source.provider
    ? `<div class="source-note">来源：${esc(source.provider)}${source.repo ? ` · ${esc(source.repo)}` : ''}${source.license ? ` · ${esc(source.license)}` : ''}${source.url ? ` · <a href="${attr(source.url)}" target="_blank" rel="noopener">原始链接</a>` : ''}${source.note ? `<br>${esc(source.note)}` : ''}${isOriginal ? '' : '<br>原文为公有领域文本；本书不包含现代出版社的排印、今译或校注成果。'}</div>`
    : '';

  $('#view').innerHTML = `
    <div class="book-hero">
      <div class="big-cover" style="${attr(coverStyle(book))}"><span>${esc(book.category)} · ${esc(glyph(book))}</span></div>
      <div>
        <p class="eyebrow">${esc(book.category)}${book.era ? ` · ${esc(book.era)}` : ''}</p>
        <h1>${esc(book.title)}</h1>
        ${book.subtitle ? `<p class="subtitle">${esc(book.subtitle)}</p>` : ''}
        <div class="book-meta-line">
          <span>${esc(book.author || '佚名')}</span>
          <span>${book.chapterCount} 章</span>
          <span>${fmtNumber(book.charCount)} 字</span>
          <span>${esc(book.script === 'simplified' ? '简体' : '繁体原文')}</span>
          ${book.source?.provider ? `<span>${esc(book.source.provider)}</span>` : ''}
        </div>
        <p class="book-intro">${esc(book.intro || '')}</p>
        <div class="tag-row">${(book.tags || []).map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
        <div class="book-actions">
          <a class="btn primary" href="#/read/${encodeURIComponent(book.id)}/${startChapter}">${progress ? '继续阅读' : '开始阅读'}</a>
          <button class="btn" type="button" id="jump-toc">目录</button>
          <a class="btn" href="/api/books/${encodeURIComponent(book.id)}/download" download>导出 JSON</a>
          ${book.builtin === false ? `<button class="btn" type="button" id="delete-book">删除这本书</button>` : ''}
        </div>
        ${sourceLine}
      </div>
    </div>
    <section class="toc-panel" id="toc">
      <h2>目录</h2>
      ${tocHtml(book)}
    </section>`;

  $('#jump-toc')?.addEventListener('click', () => {
    document.getElementById('toc')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const deleteButton = $('#delete-book');
  if (deleteButton) {
    deleteButton.addEventListener('click', async () => {
      if (!confirm(`确定删除《${book.title}》？这会删除本机上的这本书。`)) return;
      try {
        await api(`/api/books/${encodeURIComponent(book.id)}`, { method: 'DELETE' });
        state.bookCache.delete(book.id);
        await refreshCatalog();
        toast('已删除');
        location.hash = '#/';
      } catch (error) {
        toast(error.message);
      }
    });
  }
}

function readerSidebar(book) {
  if (book.type === 'bible') {
    const groups = new Map();
    book.chapters.forEach((chapter, index) => {
      const name = chapter.book || '圣经';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push({ chapter, index });
    });
    return Array.from(groups.entries())
      .map(
        ([name, items]) => `
        <details class="toc-group">
          <summary>${esc(name)}</summary>
          ${items
            .map(
              (item) =>
                `<a href="#/read/${encodeURIComponent(book.id)}/${item.index}" data-chapter="${item.index}">${esc(item.chapter.title || `第 ${item.chapter.chapter} 章`)}</a>`
            )
            .join('')}
        </details>`
      )
      .join('');
  }
  return book.chapters
    .map(
      (chapter, index) =>
        `<a href="#/read/${encodeURIComponent(book.id)}/${index}" data-chapter="${index}">${esc(chapter.title || `第 ${index + 1} 章`)}</a>`
    )
    .join('');
}

function chapterBody(book, chapterIndex, translations) {
  const chapter = book.chapters[chapterIndex];
  const show = state.showTranslation;
  if (Array.isArray(chapter.verses)) {
    return chapter.verses
      .map((verse, index) => {
        const translation = show && translations ? translations[index] : null;
        return `<p class="verse" data-para="${index}"><sup>${verse.n}</sup>${esc(verse.text)}</p>${
          translation ? `<div class="translation"><span class="label">${esc(translationLabel(state.translationTarget))}</span>${esc(translation)}</div>` : ''
        }`;
      })
      .join('');
  }
  return (chapter.paragraphs || [])
    .map((paragraph, index) => {
      const translation = show && translations ? translations[index] : null;
      return `<p class="para" data-para="${index}">${esc(paragraph)}</p>${
        translation ? `<div class="translation"><span class="label">${esc(translationLabel(state.translationTarget))}</span>${esc(translation)}</div>` : ''
      }`;
    })
    .join('');
}

const EXERCISE_TYPE_LABEL = {
  choice: '选择题',
  judge: '判断题',
  fill: '填空题',
  subjective: '主观题'
};

function exStorageKey(bookId, chapterIndex) {
  return `wj-ex-${bookId}-${chapterIndex}`;
}

function loadExerciseState(bookId, chapterIndex) {
  try {
    const parsed = JSON.parse(localStorage.getItem(exStorageKey(bookId, chapterIndex)) || 'null');
    if (parsed && typeof parsed === 'object') {
      return { answers: parsed.answers || {}, results: parsed.results || {} };
    }
  } catch {
    /* ignore corrupted storage */
  }
  return { answers: {}, results: {} };
}

function saveExerciseState(bookId, chapterIndex, data) {
  try {
    localStorage.setItem(exStorageKey(bookId, chapterIndex), JSON.stringify(data));
  } catch {
    /* storage may be unavailable */
  }
}

function normalizeText(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/[\s，。；：！？、,.!?;:'"“”‘’（）()【】\[\]]/g, '');
}

function splitBlanks(value) {
  return String(value == null ? '' : value)
    .split(/[；;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function exerciseAnswerText(exercise) {
  if (exercise.type === 'judge') return exercise.answer ? '正确' : '错误';
  if (exercise.type === 'choice') {
    const match = (exercise.options || []).find((option) => String(option).startsWith(`${exercise.answer}.`));
    return match || String(exercise.answer);
  }
  return String(exercise.answer == null ? '' : exercise.answer);
}

function exercisePanel(book, chapterIndex) {
  const exercises = book.chapters?.[chapterIndex]?.exercises || [];
  if (!exercises.length) return '';
  const cards = exercises
    .map((exercise, index) => {
      const type = exercise.type;
      let controls = '';
      if (type === 'choice') {
        controls = `<div class="ex-options">${(exercise.options || [])
          .map((option, optionIndex) => {
            const letter = /^[A-D][.．、]/.test(String(option)) ? String(option).charAt(0) : String.fromCharCode(65 + optionIndex);
            return `<label class="ex-option"><input type="radio" name="ex-${index}" value="${attr(letter)}"><span>${esc(option)}</span></label>`;
          })
          .join('')}</div>`;
      } else if (type === 'judge') {
        controls = `<div class="ex-options">
          <label class="ex-option"><input type="radio" name="ex-${index}" value="true"><span>正确</span></label>
          <label class="ex-option"><input type="radio" name="ex-${index}" value="false"><span>错误</span></label>
        </div>`;
      } else if (type === 'fill') {
        const count = Math.max(1, splitBlanks(exercise.answer).length);
        controls = `<div class="ex-fill">${Array.from({ length: count }, (_, blankIndex) => `<input type="text" data-blank="${blankIndex}" placeholder="第 ${blankIndex + 1} 空" autocomplete="off">`).join('')}</div>`;
      } else {
        controls = '<textarea class="ex-subjective" rows="5" placeholder="在这里写下你的答案……"></textarea>';
      }
      const actions =
        type === 'subjective'
          ? '<button class="btn small" type="button" data-action="reference">查看参考要点</button><button class="btn small primary" type="button" data-action="grade">AI 批改</button>'
          : '<button class="btn small primary" type="button" data-action="check">提交本题</button>';
      return `<article class="exercise-card" data-ex="${index}" data-type="${esc(type)}">
        <header><span class="ex-badge">${EXERCISE_TYPE_LABEL[type] || '习题'}</span><span class="ex-no">第 ${index + 1} 题</span></header>
        <p class="ex-q">${esc(exercise.q)}</p>
        ${controls}
        <div class="ex-actions">${actions}</div>
        <div class="ex-reference-box" hidden><strong>参考要点</strong><p>${esc(exercise.reference || '')}</p></div>
        <div class="ex-result-box" hidden></div>
      </article>`;
    })
    .join('');
  return `<section class="exercise-panel" id="exercise-panel">
    <div class="exercise-head"><h3>本章习题</h3><span>共 ${exercises.length} 题</span></div>
    <p class="exercise-hint">客观题在本机判分；主观题可查看参考要点，配置好接口后还能交给 AI 批改。作答与结果只保存在本机浏览器。</p>
    <div class="exercise-list">${cards}</div>
    <div class="exercise-summary" id="exercise-summary"></div>
  </section>`;
}

function renderObjectiveResult(box, exercise, ok) {
  box.hidden = false;
  box.className = `ex-result-box ${ok ? 'ok' : 'bad'}`;
  box.innerHTML = `<div class="ex-verdict">${ok ? '✓ 答对了' : '✗ 答错了'}</div>
    ${ok ? '' : `<div class="ex-correct">正确答案：${esc(exerciseAnswerText(exercise))}</div>`}
    ${exercise.explain ? `<div class="ex-explain">解析：${esc(exercise.explain)}</div>` : ''}`;
}

function renderAiResult(box, result) {
  box.hidden = false;
  box.className = 'ex-result-box ai';
  if (result.raw) {
    box.innerHTML = `<div class="ex-ai-score">AI 批改</div><pre class="ex-ai-raw">${esc(result.raw)}</pre>`;
    return;
  }
  const list = (items, title) =>
    Array.isArray(items) && items.length
      ? `<p><strong>${title}</strong></p><ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
      : '';
  box.innerHTML = `<div class="ex-ai-score">AI 评分 <b>${esc(result.score)}</b> 分 · ${esc(result.level || '')}</div>
    ${list(result.strengths, '优点')}
    ${list(result.improvements, '可改进')}
    ${result.suggestions ? `<p class="ex-ai-suggest"><strong>建议：</strong>${esc(result.suggestions)}</p>` : ''}`;
}

function bindExercisePanel(book, chapterIndex) {
  const panel = $('#exercise-panel');
  if (!panel) return;
  const exercises = book.chapters?.[chapterIndex]?.exercises || [];
  if (!exercises.length) return;
  const saved = loadExerciseState(book.id, chapterIndex);
  const persist = () => saveExerciseState(book.id, chapterIndex, saved);

  const readAnswer = (card, type) => {
    if (type === 'choice' || type === 'judge') {
      const checked = $('input[type="radio"]:checked', card);
      return checked ? checked.value : '';
    }
    if (type === 'fill') return $$('input[data-blank]', card).map((input) => input.value.trim());
    const textarea = $('.ex-subjective', card);
    return textarea ? textarea.value : '';
  };

  const updateSummary = () => {
    const objective = exercises.filter((exercise) => exercise.type !== 'subjective').length;
    const done = Object.keys(saved.results).filter((key) => exercises[key] && exercises[key].type !== 'subjective').length;
    const correct = Object.values(saved.results).filter((result) => result && result.ok === true).length;
    const summary = $('#exercise-summary');
    if (summary) {
      summary.textContent = done
        ? `客观题已完成 ${done}/${objective} 道，答对 ${correct} 道。主观题可对照参考要点自查，或使用 AI 批改。`
        : `共 ${objective} 道客观题待完成。主观题可对照参考要点自查，或使用 AI 批改。`;
    }
  };

  $$('.exercise-card', panel).forEach((card) => {
    const index = Number(card.dataset.ex);
    const exercise = exercises[index];
    const type = exercise.type;
    const answer = saved.answers[index];

    if (type === 'choice' || type === 'judge') {
      $$('input[type="radio"]', card).forEach((input) => {
        if (String(answer) === input.value) input.checked = true;
        input.addEventListener('change', () => {
          saved.answers[index] = input.value;
          persist();
        });
      });
    } else if (type === 'fill') {
      const values = Array.isArray(answer) ? answer : answer ? [answer] : [];
      $$('input[data-blank]', card).forEach((input, blankIndex) => {
        input.value = values[blankIndex] || '';
        input.addEventListener('input', () => {
          saved.answers[index] = readAnswer(card, type);
          persist();
        });
      });
    } else {
      const textarea = $('.ex-subjective', card);
      if (textarea) {
        textarea.value = typeof answer === 'string' ? answer : '';
        textarea.addEventListener('input', () => {
          saved.answers[index] = textarea.value;
          persist();
        });
      }
    }

    const box = $('.ex-result-box', card);
    const stored = saved.results[index];
    if (stored && type !== 'subjective' && typeof stored.ok === 'boolean') {
      renderObjectiveResult(box, exercise, stored.ok);
    } else if (stored && stored.ai) {
      renderAiResult(box, stored.ai);
    }

    const referenceButton = $('[data-action="reference"]', card);
    if (referenceButton) {
      referenceButton.addEventListener('click', () => {
        const reference = $('.ex-reference-box', card);
        reference.hidden = !reference.hidden;
      });
    }

    const checkButton = $('[data-action="check"]', card);
    if (checkButton) {
      checkButton.addEventListener('click', () => {
        const value = readAnswer(card, type);
        let ok = false;
        if (type === 'choice' || type === 'judge') {
          if (!value) return toast('请先选择一个答案');
          ok = String(exercise.answer) === String(value);
        } else if (type === 'fill') {
          const expected = splitBlanks(exercise.answer);
          const got = Array.isArray(value) ? value : splitBlanks(value);
          if (!got.some(Boolean)) return toast('请先填写答案');
          ok =
            expected.length === got.length
              ? expected.every((part, partIndex) => normalizeText(part) === normalizeText(got[partIndex] || ''))
              : normalizeText(got.join('；')) === normalizeText(exercise.answer);
        }
        saved.results[index] = { ok };
        persist();
        renderObjectiveResult(box, exercise, ok);
        updateSummary();
      });
    }

    const gradeButton = $('[data-action="grade"]', card);
    if (gradeButton) {
      gradeButton.addEventListener('click', async () => {
        const textarea = $('.ex-subjective', card);
        const text = textarea ? textarea.value.trim() : '';
        if (!text) return toast('请先写下你的答案');
        if (text.length > 4000) return toast('答案过长，请控制在 4000 字以内');
        gradeButton.disabled = true;
        gradeButton.innerHTML = '<span class="spinner"></span> 批改中';
        try {
          const result = await api('/api/grade', {
            method: 'POST',
            body: JSON.stringify({
              bookId: book.id,
              chapter: chapterIndex,
              exerciseIndex: index,
              answer: text
            })
          });
          saved.results[index] = { ok: null, ai: result };
          persist();
          renderAiResult(box, result);
        } catch (error) {
          toast(error.message, 6000);
        } finally {
          gradeButton.disabled = false;
          gradeButton.textContent = 'AI 批改';
        }
      });
    }
  });

  updateSummary();
}

function updateReaderChrome(book) {
  const chapter = book.chapters[state.chapterIndex];
  const titleEl = $('#reader-book-title');
  if (titleEl) titleEl.textContent = book.title;
  const chapterEl = $('#reader-chapter-title');
  if (chapterEl) chapterEl.textContent = chapter?.title || '';
  const prev = $('#btn-prev');
  const next = $('#btn-next');
  if (prev) prev.disabled = state.chapterIndex <= 0;
  if (next) next.disabled = state.chapterIndex >= book.chapters.length - 1;
  $$('.side-toc a[data-chapter]').forEach((link) => {
    const active = Number(link.dataset.chapter) === state.chapterIndex;
    link.classList.toggle('current', active);
    if (active) {
      const details = link.closest('details');
      if (details) details.open = true;
      setTimeout(() => link.scrollIntoView({ block: 'nearest' }), 30);
    }
  });
  const target = $('#target-select');
  if (target) target.value = state.translationTarget;
  const translateButton = $('#btn-translate');
  if (translateButton) translateButton.textContent = state.showTranslation ? '隐藏译文' : '译本章';
}

function paintChapter() {
  const book = state.currentBook;
  if (!book) return;
  const chapter = book.chapters[state.chapterIndex];
  if (!chapter) return;
  const content = $('#chapter-content');
  if (!content) return;
  content.innerHTML = chapterBody(book, state.chapterIndex, state.translation) + exercisePanel(book, state.chapterIndex);
  bindExercisePanel(book, state.chapterIndex);
  const headBook = $('#chapter-head-book');
  if (headBook) headBook.textContent = `${book.title} · ${book.author || '佚名'}`;
  const headTitle = $('#chapter-head-title');
  if (headTitle) headTitle.textContent = chapter.title || `第 ${state.chapterIndex + 1} 章`;
  updateReaderChrome(book);
  const progressBar = $('#reader-progress-bar');
  if (progressBar) progressBar.style.width = '0%';
}

async function renderReader(id, chapterIndex) {
  renderNav('home');
  $('#view').innerHTML = '<div class="boot"><span class="spinner"></span> 正在展开书页……</div>';
  let book;
  try {
    book = await getBook(id);
  } catch (error) {
    $('#view').innerHTML = `<div class="empty-state">${esc(error.message)}</div>`;
    return;
  }
  state.currentBook = book;
  state.chapterIndex = Math.max(0, Math.min(book.chapters.length - 1, Number(chapterIndex) || 0));
  state.translation = null;
  state.translationTarget = state.settings?.target === 'en' ? 'en' : 'zh-modern';
  state.showTranslation = Boolean(state.settings?.showTranslation);
  const progress = state.user?.progress?.[book.id];
  state.restorePercent = progress && Number(progress.chapter) === state.chapterIndex ? Number(progress.percent) || 0 : 0;

  const chapter = book.chapters[state.chapterIndex];
  $('#view').innerHTML = `
    <div class="reader-wrap">
      <aside class="reader-side">
        <header>${esc(book.title)} · 目录</header>
        <div class="side-toc">${readerSidebar(book)}</div>
      </aside>
      <div class="reader-main">
        <div class="reader-toolbar">
          <a class="icon-btn" href="#/book/${encodeURIComponent(book.id)}" title="返回书籍详情">←</a>
          <div class="reader-title"><strong id="reader-book-title">${esc(book.title)}</strong><small id="reader-chapter-title">${esc(chapter?.title || '')}</small></div>
          <button class="icon-btn" type="button" id="btn-toc" title="目录">☰</button>
          <button class="btn small" type="button" id="btn-prev">上一章</button>
          <button class="btn small" type="button" id="btn-next">下一章</button>
          <button class="btn small" type="button" id="btn-translate">译本章</button>
          <button class="btn small" type="button" id="btn-translate-book">译全书</button>
          <select id="target-select" aria-label="翻译目标" style="max-width:120px;padding:6px;border:1px solid var(--line);border-radius:8px;background:transparent">
            <option value="zh-modern">现代汉语</option>
            <option value="en">English</option>
          </select>
          <span class="spacer"></span>
          <button class="icon-btn" type="button" id="btn-font-dec" title="缩小字号">A−</button>
          <button class="icon-btn" type="button" id="btn-font-inc" title="放大字号">A+</button>
          <button class="icon-btn" type="button" id="btn-theme" title="切换纸色">◐</button>
          <button class="icon-btn" type="button" id="btn-bookmark" title="加入书签">☆</button>
          <button class="icon-btn" type="button" id="btn-note" title="写笔记">✎</button>
        </div>
        <article class="reader-paper">
          <div class="chapter-head">
            <span class="book-name" id="chapter-head-book"></span>
            <h2 id="chapter-head-title"></h2>
          </div>
          <div class="reader-text" id="chapter-content"></div>
          <div class="reader-nav">
            <button class="btn small" type="button" id="btn-prev-bottom">上一章</button>
            <div class="reader-progress"><i id="reader-progress-bar"></i></div>
            <button class="btn small" type="button" id="btn-next-bottom">下一章</button>
          </div>
          <p class="reader-footnote">全书共 ${book.chapters.length} 章。阅读位置、笔记与习题作答只保存在本机。译文由你在设置中配置的在线接口生成，首次翻译后会缓存到本机；主观题的 AI 批改同样使用该接口。</p>
        </article>
      </div>
    </div>`;

  paintChapter();

  const go = (index) => {
    const next = Math.max(0, Math.min(book.chapters.length - 1, index));
    if (next === state.chapterIndex) return;
    state.chapterIndex = next;
    state.translation = null;
    state.showTranslation = Boolean(state.settings?.showTranslation);
    state.restorePercent = 0;
    history.replaceState(null, '', `#/read/${encodeURIComponent(book.id)}/${next}`);
    paintChapter();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveProgress(0, 0);
  };

  $('#btn-prev').addEventListener('click', () => go(state.chapterIndex - 1));
  $('#btn-next').addEventListener('click', () => go(state.chapterIndex + 1));
  $('#btn-prev-bottom').addEventListener('click', () => go(state.chapterIndex - 1));
  $('#btn-next-bottom').addEventListener('click', () => go(state.chapterIndex + 1));
  $('#btn-toc').addEventListener('click', () => openDrawer(`${book.title} · 目录`, readerSidebar(book)));

  $('#target-select').addEventListener('change', (event) => {
    state.translationTarget = event.target.value === 'en' ? 'en' : 'zh-modern';
    state.translation = null;
    if (state.showTranslation) translateCurrent();
  });

  $('#btn-translate').addEventListener('click', () => {
    if (state.showTranslation && state.translation) {
      state.showTranslation = false;
      state.settings.showTranslation = false;
      api('/api/settings', { method: 'POST', body: JSON.stringify({ showTranslation: false }) }).catch(() => {});
      paintChapter();
      return;
    }
    translateCurrent();
  });

  $('#btn-translate-book').addEventListener('click', () => {
    if (state.translatingBook) {
      state.translatingBook.stop = true;
      toast('将在当前这一章完成后停止');
      return;
    }
    const label = translationLabel(state.translationTarget);
    const cachedCount = 0;
    openModal(
      '翻译全书',
      `<p>将把《${esc(book.title)}》全部 <b>${book.chapters.length}</b> 章逐章翻译为 <b>${esc(label)}</b>。</p>
       <p style="color:var(--muted);font-size:13px;line-height:1.9">译文只缓存在本机，不会上传书库。逐章调用你在设置中配置的接口，长书可能需要较长时间；随时可以点「停止」，已完成的章节会保留。若接口按量计费，请先确认额度。</p>
       <div class="form-actions">
         <button class="btn" type="button" data-close-modal>取消</button>
         <button class="btn primary" type="button" id="start-translate-book">开始翻译</button>
       </div>`,
      () => {
        $('#start-translate-book').addEventListener('click', () => {
          closeModal();
          translateWholeBook();
        });
      }
    );
  });

  const changeFont = (delta) => {
    const size = Math.max(14, Math.min(34, (Number(state.settings.fontSize) || 19) + delta));
    state.settings.fontSize = size;
    applySettings();
    api('/api/settings', { method: 'POST', body: JSON.stringify({ fontSize: size }) }).catch(() => {});
  };
  $('#btn-font-dec').addEventListener('click', () => changeFont(-1));
  $('#btn-font-inc').addEventListener('click', () => changeFont(1));

  $('#btn-theme').addEventListener('click', () => {
    const order = ['paper', 'sepia', 'night'];
    const next = order[(order.indexOf(state.settings.theme) + 1) % order.length];
    state.settings.theme = next;
    applySettings();
    api('/api/settings', { method: 'POST', body: JSON.stringify({ theme: next }) }).catch(() => {});
    toast(next === 'night' ? '夜间纸色' : next === 'sepia' ? '暖黄纸色' : '素纸');
  });

  $('#btn-bookmark').addEventListener('click', () => {
    const texts = Array.isArray(chapter?.verses) ? chapter.verses.map((v) => v.text) : chapter?.paragraphs || [];
    openModal(
      '加入书签',
      `<p>《${esc(book.title)}》· ${esc(chapter?.title || '')}</p>
       <div class="field"><label for="bookmark-note">备注（可选）</label><textarea id="bookmark-note" maxlength="2000" placeholder="为什么标记这一段？"></textarea></div>
       <div class="form-actions"><button class="btn primary" id="save-bookmark" type="button">保存书签</button></div>`,
      () => {
        $('#save-bookmark').addEventListener('click', async () => {
          try {
            const result = await api('/api/bookmarks', {
              method: 'POST',
              body: JSON.stringify({
                bookId: book.id,
                chapter: state.chapterIndex,
                paragraph: 0,
                quote: (texts[0] || '').slice(0, 200),
                note: $('#bookmark-note').value
              })
            });
            state.user.bookmarks.unshift(result.bookmark);
            closeModal();
            toast('已加入书签');
          } catch (error) {
            toast(error.message);
          }
        });
      }
    );
  });

  $('#btn-note').addEventListener('click', () => {
    openModal(
      '写笔记',
      `<p>《${esc(book.title)}》· ${esc(chapter?.title || '')}</p>
       <div class="field"><label for="note-text">笔记内容</label><textarea id="note-text" maxlength="8000" placeholder="写下你的理解、疑问或对照资料……"></textarea></div>
       <div class="form-actions"><button class="btn primary" id="save-note" type="button">保存笔记</button></div>`,
      () => {
        $('#save-note').addEventListener('click', async () => {
          try {
            const result = await api('/api/notes', {
              method: 'POST',
              body: JSON.stringify({ bookId: book.id, chapter: state.chapterIndex, text: $('#note-text').value })
            });
            state.user.notes.unshift(result.note);
            closeModal();
            toast('笔记已保存');
          } catch (error) {
            toast(error.message);
          }
        });
      }
    );
  });

  const onScroll = () => {
    const paper = $('.reader-paper');
    if (!paper) return;
    const top = paper.getBoundingClientRect().top + window.scrollY;
    const total = Math.max(1, paper.offsetHeight - window.innerHeight + 80);
    const percent = Math.max(0, Math.min(100, ((window.scrollY - top) / total) * 100));
    const bar = $('#reader-progress-bar');
    if (bar) bar.style.width = `${percent}%`;
    clearTimeout(state.scrollTimer);
    state.scrollTimer = setTimeout(() => saveProgress(state.chapterIndex, percent), 900);
  };
  window.removeEventListener('scroll', window.__wjScroll || (() => {}));
  window.__wjScroll = onScroll;
  window.addEventListener('scroll', onScroll, { passive: true });

  if (state.restorePercent > 0) {
    requestAnimationFrame(() => {
      const paper = $('.reader-paper');
      if (!paper) return;
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo(0, (paper.offsetTop || 0) + (max * state.restorePercent) / 100);
    });
  }
  saveProgress(state.chapterIndex, state.restorePercent || 0);
}

function saveProgress(chapter, percent) {
  const book = state.currentBook;
  if (!book) return;
  state.user.progress[book.id] = { chapter, percent, updatedAt: new Date().toISOString() };
  api('/api/progress', {
    method: 'POST',
    body: JSON.stringify({ bookId: book.id, chapter, percent })
  }).catch(() => {});
}

async function translateCurrent(force = false) {
  const book = state.currentBook;
  if (!book || state.translating) return;
  const button = $('#btn-translate');
  if (state.translation && state.showTranslation && !force) {
    paintChapter();
    return;
  }
  state.translating = true;
  if (button) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> 翻译中';
  }
  try {
    const result = await api('/api/translate', {
      method: 'POST',
      body: JSON.stringify({
        bookId: book.id,
        chapter: state.chapterIndex,
        target: state.translationTarget,
        force
      })
    });
    state.translation = result.translations;
    state.showTranslation = true;
    state.settings.showTranslation = true;
    state.settings.target = state.translationTarget;
    paintChapter();
    api('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ showTranslation: true, target: state.translationTarget })
    }).catch(() => {});
    toast(result.cached ? '已读取本机译文缓存' : `译完本章（${translationLabel(state.translationTarget)}）`);
  } catch (error) {
    toast(error.message, 5000);
  } finally {
    state.translating = false;
    if (button) {
      button.disabled = false;
      button.textContent = state.showTranslation ? '隐藏译文' : '译本章';
    }
  }
}

async function translateWholeBook() {
  const book = state.currentBook;
  const button = $('#btn-translate-book');
  if (!book || state.translating || state.translatingBook) return;
  state.translating = true;
  state.translatingBook = { stop: false };
  if (button) button.textContent = `停止（0/${book.chapters.length}）`;
  const target = state.translationTarget;
  let done = 0;
  let failed = 0;
  let currentResult = null;
  let lastError = '';
  try {
    for (let index = 0; index < book.chapters.length; index += 1) {
      if (state.translatingBook.stop) break;
      if (button) button.textContent = `停止（${index + 1}/${book.chapters.length}）`;
      if (index % 4 === 0) toast(`正在译第 ${index + 1}/${book.chapters.length} 章 · ${translationLabel(target)}`, 1800);
      try {
        const result = await api('/api/translate', {
          method: 'POST',
          body: JSON.stringify({
            bookId: book.id,
            chapter: index,
            target,
            force: false
          })
        });
        done += 1;
        failed = 0;
        if (index === state.chapterIndex) currentResult = result.translations;
      } catch (error) {
        failed += 1;
        lastError = error.message;
        if (failed >= 3) throw new Error(`连续三章失败，已停止：${lastError}`);
      }
    }
    if (currentResult) {
      state.translation = currentResult;
      state.showTranslation = true;
      state.settings.showTranslation = true;
      paintChapter();
    }
    if (state.translatingBook.stop) {
      toast(`已停止：完成 ${done} 章，译文已缓存`);
    } else {
      toast(`全书翻译完成：${done} 章 · ${translationLabel(target)}`, 5000);
    }
    api('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ showTranslation: Boolean(currentResult), target })
    }).catch(() => {});
  } catch (error) {
    toast(error.message, 6000);
  } finally {
    state.translating = false;
    state.translatingBook = null;
    if (button) button.textContent = '译全书';
  }
}


function highlight(text, query) {
  const safe = esc(text);
  if (!query) return safe;
  const q = esc(query);
  if (!q) return safe;
  return safe.split(q).join(`<mark>${q}</mark>`);
}

async function renderSearch(params) {
  renderNav('home');
  const q = params.get('q') || '';
  $('#search-input').value = q;
  if (!q) {
    $('#view').innerHTML = `<div class="page-head"><p class="eyebrow">全文检索</p><h1>搜索</h1><p>输入书名、作者或正文中的任意词句。支持跨书检索，首次搜索会建立本机索引。</p></div><div class="empty-state">例如：上善若水、般若、起初、孙子曰</div>`;
    return;
  }
  $('#view').innerHTML = `<div class="page-head"><p class="eyebrow">全文检索</p><h1>“${esc(q)}”</h1><p>正在检索……</p></div>`;
  try {
    const result = await api(`/api/search?q=${encodeURIComponent(q)}&limit=100`);
    $('#view').innerHTML = `
      <div class="page-head"><p class="eyebrow">全文检索</p><h1>“${esc(q)}”</h1><p>找到 ${result.total} 处匹配，显示 ${result.results.length} 条。</p></div>
      <div class="result-list">
        ${
          result.results.length
            ? result.results
                .map(
                  (item) => `
          <a class="result-item" href="#/read/${encodeURIComponent(item.bookId)}/${item.chapterIndex}">
            <h3>${esc(item.title)} <span>${esc(item.author)} · ${esc(item.chapterTitle)}</span></h3>
            <p>${highlight(item.snippet, q)}</p>
          </a>`
                )
                .join('')
            : '<div class="empty-state">没有找到。试试更短的词，或先在「导入」里添加文本。</div>'
        }
      </div>`;
  } catch (error) {
    $('#view').innerHTML = `<div class="empty-state">${esc(error.message)}</div>`;
  }
}

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const MAP_TYPE_GROUPS = [
  { id: 'city', name: '城市与聚落', pattern: /城市|都城|古城|卫城|都市|聚落|城邦|王宫|宫殿|广场|商城|城址|村落/g },
  { id: 'temple', name: '神庙与宗教', pattern: /神庙|寺|佛塔|教堂|圣域|神谕|祭祀|仪式|曼荼罗|宗教|清真寺|祭坛|石窟/g },
  { id: 'tomb', name: '陵墓与纪念', pattern: /陵|墓|金字塔|兵马俑|石像/g },
  { id: 'art', name: '壁画与艺术', pattern: /壁画|地画|浮雕|造像|摩艾|岩画|洞穴|艺术/g }
];

function worldSites() {
  return state.world?.sites || [];
}

function worldCivs() {
  return state.world?.civilizations || [];
}

function worldEras() {
  return state.world?.timeline?.eras || [];
}

function worldCiv(id) {
  return worldCivs().find((civ) => civ.id === id) || { id, name: id || '未知文明', color: '#8a7a5c' };
}

function mapTypeGroup(site) {
  const text = String(site?.type || '');
  let best = { id: 'other', score: 0 };
  MAP_TYPE_GROUPS.forEach((group) => {
    const score = (text.match(group.pattern) || []).length;
    if (score > best.score) best = { id: group.id, score };
  });
  return best.id;
}

function projectLatLon(lat, lon) {
  return [((Number(lon) + 180) / 360) * MAP_WIDTH, ((90 - Number(lat)) / 180) * MAP_HEIGHT];
}

function formatCoord(lat, lon) {
  const latText = `${Math.abs(Number(lat)).toFixed(2)}°${Number(lat) >= 0 ? 'N' : 'S'}`;
  const lonText = `${Math.abs(Number(lon)).toFixed(2)}°${Number(lon) >= 0 ? 'E' : 'W'}`;
  return `${latText} · ${lonText}`;
}

function mapVisibleSites() {
  const era = state.mapEra !== 'all' ? worldEras().find((item) => item.id === state.mapEra) : null;
  const eraSites = era ? new Set(era.sites || []) : null;
  return worldSites().filter(
    (site) =>
      (state.mapCiv === 'all' || site.civ === state.mapCiv) &&
      (state.mapType === 'all' || mapTypeGroup(site) === state.mapType) &&
      (!eraSites || eraSites.has(site.id))
  );
}

function spreadMapPoints(points, minDistance) {
  const placed = [];
  return points.map((point) => {
    let { x, y } = point;
    const clashes = (cx, cy) => placed.some((item) => Math.hypot(item.x - cx, item.y - cy) < minDistance);
    if (clashes(x, y)) {
      let found = null;
      [minDistance, minDistance * 1.7, minDistance * 2.4, minDistance * 3.1].some((radius) => {
        for (let step = 0; step < 12; step += 1) {
          const angle = ((-90 + step * 30) * Math.PI) / 180;
          const cx = point.x + Math.cos(angle) * radius;
          const cy = point.y + Math.sin(angle) * radius;
          if (!clashes(cx, cy)) {
            found = { x: cx, y: cy };
            return true;
          }
        }
        return false;
      });
      if (found) {
        x = found.x;
        y = found.y;
      }
    }
    const result = { ...point, x, y };
    placed.push(result);
    return result;
  });
}

function layoutMapMarkers() {
  const layer = $('#map-markers');
  const stage = $('#world-map');
  if (!layer || !stage) return;
  const width = Math.max(240, stage.clientWidth || MAP_WIDTH);
  const height = Math.max(120, stage.clientHeight || width / 2);
  const scaleX = width / MAP_WIDTH;
  const scaleY = height / MAP_HEIGHT;
  const visible = mapVisibleSites();
  const points = visible
    .map((site) => {
      const [px, py] = projectLatLon(site.lat, site.lon);
      return { site, ax: px * scaleX, ay: py * scaleY, x: px * scaleX, y: py * scaleY };
    })
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const minDistance = Math.max(10, Math.min(17, width * 0.016));
  const laid = spreadMapPoints(points, minDistance);
  const leaders = [];
  const dots = laid
    .map(({ site, x, y, ax, ay }) => {
      if (Math.hypot(x - ax, y - ay) > 1.5) {
        leaders.push(
          `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`
        );
      }
      const civ = worldCiv(site.civ);
      const selected = state.mapSite === site.id;
      return `<button class="site-dot${selected ? ' selected' : ''}" type="button" data-site-id="${attr(site.id)}" aria-label="${attr(`${site.name} ${site.nameEn || ''} · ${civ.name}`)}" aria-pressed="${selected ? 'true' : 'false'}" style="left:${((x / width) * 100).toFixed(3)}%;top:${((y / height) * 100).toFixed(3)}%;--civ:${attr(civ.color || '#8a7a5c')}">
        <span class="dot-pip"></span>
        <span class="site-tip"><b>${esc(site.name)}</b><small>${esc(site.nameEn || '')}${site.nameEn ? ` · ${esc(civ.name)}` : esc(civ.name)}</small></span>
      </button>`;
    })
    .join('');
  const leaderSvg = leaders.length
    ? `<svg class="map-leaders" viewBox="0 0 ${Math.round(width)} ${Math.round(height)}" aria-hidden="true">${leaders.join('')}</svg>`
    : '';
  layer.innerHTML = `${leaderSvg}${
    dots || '<div class="map-empty">当前筛选下没有遗址，试试放宽文明、类型或年代。</div>'
  }`;
  const count = $('#map-count');
  if (count) count.textContent = `显示 ${visible.length} / ${worldSites().length} 处遗址`;
}

function siteDetailHtml(site) {
  const civ = worldCiv(site.civ);
  const see = Array.isArray(site.see) ? site.see : [];
  return `
    <div class="map-detail-head">
      <span class="map-civ-tag"><span class="civ-swatch" style="--civ:${attr(civ.color || '#8a7a5c')}"></span>${esc(civ.name)}</span>
      <span class="map-coord">${esc(formatCoord(site.lat, site.lon))}</span>
    </div>
    <h2>${esc(site.name)}</h2>
    <p class="map-detail-en">${esc(site.nameEn || '')}</p>
    <p class="map-detail-summary">${esc(site.summary || '')}</p>
    <dl class="map-meta">
      <div><dt>文明</dt><dd>${esc(civ.name)}</dd></div>
      <div><dt>国家 / 地区</dt><dd>${esc(site.country || '—')}</dd></div>
      <div><dt>年代</dt><dd>${esc(site.period || '—')}</dd></div>
      <div><dt>类型</dt><dd>${esc(site.type || '—')}</dd></div>
    </dl>
    <h3>遗址简介</h3>
    <p class="detail-text">${esc(site.detail || '')}</p>
    <h3>看点</h3>
    <ul class="see-list">${see.map((item) => `<li>${esc(item)}</li>`).join('') || '<li>暂无记录</li>'}</ul>
    <div class="status-note"><strong>保存现状</strong>${esc(site.status || '暂无记录')}</div>`;
}

function mapDetailPlaceholder() {
  return `
    <div class="map-detail-empty">
      <p class="eyebrow">遗址详情</p>
      <h2>点击地图上的圆点</h2>
      <p>共 ${worldSites().length} 处遗址、${worldCivs().length} 个文明、${worldEras().length} 个时代。圆点颜色代表文明；相距过近的遗址会略作铺开，并用细线标回原始经纬度。</p>
      <p>也可以先按文明、类型或年代筛选，再沿着时间轴进入某一时代。</p>
    </div>`;
}

function paintSiteDetail() {
  const detail = $('#map-detail');
  if (!detail) return;
  const visible = mapVisibleSites();
  const site = state.mapSite ? visible.find((item) => item.id === state.mapSite) : null;
  if (state.mapSite && !site) state.mapSite = null;
  detail.innerHTML = site ? siteDetailHtml(site) : mapDetailPlaceholder();
}

function eventItemHtml(event) {
  const site = event.site ? worldSites().find((item) => item.id === event.site) : null;
  return `
    <li class="event-item">
      <span class="event-year">${esc(event.label || event.year || '')}</span>
      <div class="event-body">
        <h4>${esc(event.title || '')}</h4>
        <p>${esc(event.text || '')}</p>
        <div class="event-foot">
          <span>${esc(event.place || '')}</span>
          ${site ? `<button class="event-site" type="button" data-site-id="${attr(site.id)}">跳到地图 · ${esc(site.name)} →</button>` : ''}
        </div>
      </div>
    </li>`;
}

function eraDetailHtml(era) {
  const sites = (era.sites || []).map((id) => worldSites().find((site) => site.id === id)).filter(Boolean);
  const events = era.events || [];
  return `
    <article class="era-panel" style="--era:${attr(era.color || '#8a7a5c')}">
      <div class="era-panel-head">
        <div>
          <p class="eyebrow">时代 · ${events.length} 个事件</p>
          <h3>${esc(era.name)}</h3>
          <p class="era-range">${esc(era.range)}</p>
        </div>
        <button class="btn small" type="button" data-era-filter="${attr(era.id)}">在地图上只看此时代</button>
      </div>
      <p class="era-summary">${esc(era.summary || '')}</p>
      <div class="tag-row">${(era.highlights || []).map((item) => `<span class="tag">${esc(item)}</span>`).join('')}</div>
      ${
        sites.length
          ? `<div class="era-sites"><span class="label">关联遗址</span>${sites
              .map(
                (site) =>
                  `<button class="site-chip" type="button" data-site-id="${attr(site.id)}"><span class="civ-swatch" style="--civ:${attr(worldCiv(site.civ).color || '#8a7a5c')}"></span>${esc(site.name)}</button>`
              )
              .join('')}</div>`
          : ''
      }
      <ol class="event-list">${events.map(eventItemHtml).join('')}</ol>
    </article>`;
}

function paintEraDetail() {
  $$('.era-card').forEach((card) => {
    const active = card.dataset.eraId === state.mapAge;
    card.classList.toggle('active', active);
    card.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  const panel = $('#era-detail');
  if (!panel) return;
  const era = state.mapAge ? worldEras().find((item) => item.id === state.mapAge) : null;
  panel.innerHTML = era
    ? eraDetailHtml(era)
    : '<div class="era-detail-empty">点击上方任一时代，查看这一时期的概要、关键词与大事年表。带「跳到地图」按钮的事件可直接定位到遗址。</div>';
}

function refreshMapFilterUI() {
  $$('.map-civ-chip').forEach((button) => {
    button.classList.toggle('active', (button.dataset.civ || 'all') === state.mapCiv);
  });
  const typeSelect = $('#map-type');
  if (typeSelect) typeSelect.value = state.mapType;
  const eraSelect = $('#map-era');
  if (eraSelect) eraSelect.value = state.mapEra;
  const reset = $('#map-reset');
  if (reset) reset.hidden = state.mapCiv === 'all' && state.mapType === 'all' && state.mapEra === 'all';
}

function syncMapHash() {
  const params = new URLSearchParams();
  if (state.mapCiv !== 'all') params.set('civ', state.mapCiv);
  if (state.mapType !== 'all') params.set('type', state.mapType);
  if (state.mapEra !== 'all') params.set('era', state.mapEra);
  if (state.mapSite) params.set('site', state.mapSite);
  if (state.mapAge) params.set('age', state.mapAge);
  const query = params.toString();
  history.replaceState(null, '', `#/map${query ? `?${query}` : ''}`);
}

function selectMapSite(id, { scroll = false } = {}) {
  const site = worldSites().find((item) => item.id === id);
  if (!site) return;
  if (!mapVisibleSites().some((item) => item.id === id)) {
    state.mapCiv = 'all';
    state.mapType = 'all';
    state.mapEra = 'all';
    refreshMapFilterUI();
  }
  state.mapSite = id;
  layoutMapMarkers();
  paintSiteDetail();
  syncMapHash();
  if (scroll) {
    const section = $('#map-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function applyMapFilters() {
  refreshMapFilterUI();
  layoutMapMarkers();
  paintSiteDetail();
  syncMapHash();
}

function paintMapPage() {
  const sites = worldSites();
  const civs = worldCivs();
  const eras = worldEras();
  const eventCount = eras.reduce((sum, era) => sum + (era.events || []).length, 0);
  const civCounts = {};
  const typeCounts = {};
  sites.forEach((site) => {
    civCounts[site.civ] = (civCounts[site.civ] || 0) + 1;
    const group = mapTypeGroup(site);
    typeCounts[group] = (typeCounts[group] || 0) + 1;
  });

  const civChips = [
    `<button class="chip map-civ-chip ${state.mapCiv === 'all' ? 'active' : ''}" type="button" data-civ="all" style="--civ:var(--ink)">全部 · ${sites.length}</button>`
  ]
    .concat(
      civs.map(
        (civ) =>
          `<button class="chip map-civ-chip ${state.mapCiv === civ.id ? 'active' : ''}" type="button" data-civ="${attr(civ.id)}" style="--civ:${attr(civ.color || '#8a7a5c')}"><span class="civ-swatch"></span>${esc(civ.name)} · ${civCounts[civ.id] || 0}</button>`
      )
    )
    .join('');

  const typeOptions = MAP_TYPE_GROUPS.map(
    (group) =>
      `<option value="${group.id}" ${state.mapType === group.id ? 'selected' : ''}>${esc(group.name)}（${typeCounts[group.id] || 0}）</option>`
  ).join('');
  const otherOption = `<option value="other" ${state.mapType === 'other' ? 'selected' : ''}>其他（${typeCounts.other || 0}）</option>`;
  const eraOptions = eras
    .map(
      (era) =>
        `<option value="${attr(era.id)}" ${state.mapEra === era.id ? 'selected' : ''}>${esc(era.name)}（${esc(era.range)}）</option>`
    )
    .join('');
  const eraCards = eras
    .map(
      (era, index) => `
      <button class="era-card ${state.mapAge === era.id ? 'active' : ''}" type="button" role="tab" aria-selected="${state.mapAge === era.id ? 'true' : 'false'}" data-era-id="${attr(era.id)}" style="--era:${attr(era.color || '#8a7a5c')}">
        <span class="era-index">${String(index + 1).padStart(2, '0')}</span>
        <span class="era-name">${esc(era.name)}</span>
        <span class="era-range">${esc(era.range)}</span>
        <span class="era-count">${(era.events || []).length} 事件 · ${(era.sites || []).length} 遗址</span>
      </button>`
    )
    .join('');

  $('#view').innerHTML = `
    <div class="map-page">
      <div class="page-head map-head">
        <p class="eyebrow">世界文明 · 地理与时间</p>
        <h1>世界文明与遗址</h1>
        <p>把 ${sites.length} 处世界遗产与考古遗址放回经纬度，按 ${civs.length} 个文明着色；沿着 ${eras.length} 个时代、${eventCount} 个事件的线索，看人类文明如何在地图上层层叠加。全部数据随程序离线保存。</p>
      </div>
      <div class="map-toolbar">
        <div class="chips map-civ-chips" aria-label="按文明筛选">${civChips}</div>
        <div class="map-filters">
          <label class="map-filter">类型
            <select id="map-type"><option value="all" ${state.mapType === 'all' ? 'selected' : ''}>全部类型</option>${typeOptions}${otherOption}</select>
          </label>
          <label class="map-filter">年代
            <select id="map-era"><option value="all" ${state.mapEra === 'all' ? 'selected' : ''}>全部年代</option>${eraOptions}</select>
          </label>
          <button class="btn small" type="button" id="map-reset" hidden>重置筛选</button>
          <span class="map-count" id="map-count"></span>
        </div>
      </div>
      <div class="map-layout">
        <section class="map-panel" id="map-section" aria-label="世界遗址地图">
          <div class="map-stage" id="world-map">
            <img class="map-base" src="/images/world-map.svg" alt="等距圆柱投影世界地图底图，含经纬网、海洋与大陆轮廓">
            <div class="map-markers" id="map-markers"></div>
          </div>
          <p class="map-hint">等距圆柱投影 · 圆点按经纬度定位，颜色代表文明。悬停或聚焦查看名称，点击查看右侧详情；相邻过近的遗址略作铺开，细线指向原始位置。</p>
        </section>
        <aside class="map-detail" id="map-detail" aria-live="polite"></aside>
      </div>
      <section class="world-timeline" id="world-timeline">
        <div class="section-head">
          <h2>人类文明时间轴</h2>
          <p>${eras.length} 个时代 · ${eventCount} 个事件 · 点击时代展开</p>
        </div>
        <div class="era-rail" role="tablist" aria-label="人类文明时代">${eraCards}</div>
        <div class="era-detail" id="era-detail"></div>
      </section>
    </div>`;

  $$('.map-civ-chip').forEach((button) => {
    button.addEventListener('click', () => {
      state.mapCiv = button.dataset.civ || 'all';
      applyMapFilters();
    });
  });
  $('#map-type')?.addEventListener('change', (event) => {
    state.mapType = event.target.value;
    applyMapFilters();
  });
  $('#map-era')?.addEventListener('change', (event) => {
    state.mapEra = event.target.value;
    applyMapFilters();
  });
  $('#map-reset')?.addEventListener('click', () => {
    state.mapCiv = 'all';
    state.mapType = 'all';
    state.mapEra = 'all';
    applyMapFilters();
  });
  $('#world-map')?.addEventListener('click', (event) => {
    const dot = event.target.closest('[data-site-id]');
    if (!dot) return;
    selectMapSite(dot.dataset.siteId);
    if (window.matchMedia('(max-width: 900px)').matches) {
      $('#map-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  $$('.era-card').forEach((card) => {
    card.addEventListener('click', () => {
      state.mapAge = card.dataset.eraId;
      paintEraDetail();
      syncMapHash();
    });
  });
  $('#era-detail')?.addEventListener('click', (event) => {
    const siteTrigger = event.target.closest('[data-site-id]');
    if (siteTrigger) {
      selectMapSite(siteTrigger.dataset.siteId, { scroll: true });
      return;
    }
    const eraTrigger = event.target.closest('[data-era-filter]');
    if (eraTrigger) {
      state.mapEra = eraTrigger.dataset.eraFilter;
      applyMapFilters();
      $('#map-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  refreshMapFilterUI();
  layoutMapMarkers();
  paintSiteDetail();
  paintEraDetail();
}

async function renderMap(params) {
  renderNav('map');
  if (!state.world) {
    $('#view').innerHTML = '<div class="boot"><span class="spinner"></span> 正在展开世界地图与时间轴……</div>';
    try {
      state.world = await api('/api/world');
    } catch (error) {
      $('#view').innerHTML = `
        <div class="empty-state">
          <p>无法加载世界遗址数据。</p>
          <p style="font-size:13px">${esc(error.message)}</p>
          <p><button class="btn" type="button" id="map-retry">重试</button></p>
        </div>`;
      $('#map-retry')?.addEventListener('click', () => {
        state.world = null;
        renderMap(params);
      });
      return;
    }
  }
  state.mapCiv = worldCivs().some((civ) => civ.id === params.get('civ')) ? params.get('civ') : 'all';
  state.mapType = MAP_TYPE_GROUPS.some((group) => group.id === params.get('type')) ? params.get('type') : 'all';
  state.mapEra = worldEras().some((era) => era.id === params.get('era')) ? params.get('era') : 'all';
  state.mapAge = worldEras().some((era) => era.id === params.get('age')) ? params.get('age') : null;
  state.mapSite = worldSites().some((site) => site.id === params.get('site')) ? params.get('site') : null;
  if (state.mapSite && !mapVisibleSites().some((site) => site.id === state.mapSite)) {
    state.mapCiv = 'all';
    state.mapType = 'all';
    state.mapEra = 'all';
  }
  paintMapPage();
}

function renderCollections() {
  renderNav('collections');
  const counts = state.stats?.categories || {};
  const cards = categoryList()
    .map(
      (name) => `
      <a class="collection-card" href="#/?cat=${encodeURIComponent(name)}">
        <strong>${esc(name)}</strong>
        <span>${counts[name] || 0} 部典籍</span>
        <em>${esc(CATEGORY_GLYPH[name] || '典')}</em>
      </a>`
    )
    .join('');
  $('#view').innerHTML = `
    <div class="page-head"><p class="eyebrow">藏书分类</p><h1>经 · 史 · 子 · 释 · 道 · 圣 · 术 · 谶</h1><p>分类是入口，不是边界。同一部书可以从不同路径进入。</p></div>
    <div class="collection-grid">${cards}</div>`;
}

function renderBookmarks() {
  renderNav('bookmarks');
  const bookmarks = state.user?.bookmarks || [];
  const list = bookmarks
    .map((item) => {
      const book = bookById(item.bookId);
      if (!book) return '';
      return `
        <article class="note-card" data-bookmark="${attr(item.id)}">
          <h3><a href="#/read/${encodeURIComponent(book.id)}/${item.chapter}">${esc(book.title)}</a></h3>
          <p class="note-meta">第 ${item.chapter + 1} 章 · ${fmtDate(item.createdAt)}</p>
          ${item.quote ? `<p class="quote">${esc(item.quote)}</p>` : ''}
          ${item.note ? `<p class="body">${esc(item.note)}</p>` : ''}
          <div class="note-actions"><button class="btn small" type="button" data-delete-bookmark="${attr(item.id)}">删除</button></div>
        </article>`;
    })
    .filter(Boolean)
    .join('');
  $('#view').innerHTML = `
    <div class="page-head"><p class="eyebrow">我的标记</p><h1>书签</h1><p>${bookmarks.length} 条书签，只保存在本机。</p></div>
    ${list ? `<div class="note-grid">${list}</div>` : '<div class="empty-state">还没有书签。阅读时点右上角的 ☆ 即可添加。</div>'}`;
  $$('[data-delete-bookmark]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await api(`/api/bookmarks/${encodeURIComponent(button.dataset.deleteBookmark)}`, { method: 'DELETE' });
        state.user.bookmarks = state.user.bookmarks.filter((item) => item.id !== button.dataset.deleteBookmark);
        renderBookmarks();
        toast('已删除书签');
      } catch (error) {
        toast(error.message);
      }
    });
  });
}

function renderNotes() {
  renderNav('notes');
  const notes = state.user?.notes || [];
  const list = notes
    .map((item) => {
      const book = bookById(item.bookId);
      return `
        <article class="note-card" data-note="${attr(item.id)}">
          <h3>${book ? `<a href="#/read/${encodeURIComponent(book.id)}/${item.chapter}">${esc(book.title)}</a>` : '未知书籍'}</h3>
          <p class="note-meta">第 ${item.chapter + 1} 章 · ${fmtDate(item.createdAt)}</p>
          ${item.quote ? `<p class="quote">${esc(item.quote)}</p>` : ''}
          <p class="body">${esc(item.text)}</p>
          <div class="note-actions">
            <button class="btn small" type="button" data-edit-note="${attr(item.id)}">编辑</button>
            <button class="btn small" type="button" data-delete-note="${attr(item.id)}">删除</button>
          </div>
        </article>`;
    })
    .join('');
  $('#view').innerHTML = `
    <div class="page-head"><p class="eyebrow">我的批注</p><h1>笔记</h1><p>${notes.length} 条笔记，只保存在本机 data/user.json。</p></div>
    ${list ? `<div class="note-grid">${list}</div>` : '<div class="empty-state">还没有笔记。阅读时点工具栏的 ✎ 即可写。</div>'}`;
  $$('[data-delete-note]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await api(`/api/notes/${encodeURIComponent(button.dataset.deleteNote)}`, { method: 'DELETE' });
        state.user.notes = state.user.notes.filter((item) => item.id !== button.dataset.deleteNote);
        renderNotes();
        toast('已删除笔记');
      } catch (error) {
        toast(error.message);
      }
    });
  });
  $$('[data-edit-note]').forEach((button) => {
    button.addEventListener('click', () => {
      const note = state.user.notes.find((item) => item.id === button.dataset.editNote);
      if (!note) return;
      openModal(
        '编辑笔记',
        `<div class="field"><label for="edit-note-text">笔记内容</label><textarea id="edit-note-text" maxlength="8000">${esc(note.text)}</textarea></div>
         <div class="form-actions"><button class="btn primary" type="button" id="update-note">保存</button></div>`,
        () => {
          $('#update-note').addEventListener('click', async () => {
            try {
              const result = await api(`/api/notes/${encodeURIComponent(note.id)}`, {
                method: 'PATCH',
                body: JSON.stringify({ text: $('#edit-note-text').value })
              });
              note.text = result.note.text;
              closeModal();
              renderNotes();
              toast('已更新');
            } catch (error) {
              toast(error.message);
            }
          });
        }
      );
    });
  });
}

function renderSettings() {
  renderNav('settings');
  const settings = state.settings || {};
  const presets = Object.entries(PROVIDER_PRESETS)
    .map(([name]) => `<button class="chip" type="button" data-preset="${attr(name)}">${esc(name)}</button>`)
    .join('');
  $('#view').innerHTML = `
    <div class="page-head"><p class="eyebrow">本机设置</p><h1>翻译与阅读</h1><p>翻译是可选功能。不配置也能离线阅读全部内置典籍。</p></div>
    <form class="form-card" id="settings-form">
      <h2 style="margin-top:0">在线翻译接口</h2>
      <div class="preset-row">${presets}</div>
      <div class="field-row">
        <div class="field">
          <label for="base-url">Base URL</label>
          <input id="base-url" name="baseUrl" value="${attr(settings.baseUrl || '')}" placeholder="https://api.deepseek.com/v1" autocomplete="off">
          <span class="hint">OpenAI 兼容接口。也可填完整的 <code>/chat/completions</code> 地址。</span>
        </div>
        <div class="field">
          <label for="model">模型</label>
          <input id="model" name="model" value="${attr(settings.model || '')}" placeholder="deepseek-chat" autocomplete="off">
        </div>
      </div>
      <div class="field">
        <label for="api-key">API Key</label>
        <input id="api-key" name="apiKey" type="password" value="" placeholder="${settings.hasApiKey ? `已保存：${attr(settings.apiKeyMasked)}（留空保持不变）` : '输入你的 API Key'}" autocomplete="new-password">
        <span class="hint">密钥只写入本机 <code>data/user.json</code>，不会上传到任何第三方，也不会显示在日志里。Ollama 本地接口可留空。</span>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="temperature">温度</label>
          <input id="temperature" name="temperature" type="number" min="0" max="1.5" step="0.1" value="${Number(settings.temperature ?? 0.2)}">
          <span class="hint">翻译建议 0–0.3。</span>
        </div>
        <div class="field">
          <label for="target">默认目标语言</label>
          <select id="target" name="target">
            <option value="zh-modern" ${settings.target !== 'en' ? 'selected' : ''}>现代汉语</option>
            <option value="en" ${settings.target === 'en' ? 'selected' : ''}>English</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="font-size">正文字号（px）</label>
          <input id="font-size" name="fontSize" type="number" min="14" max="34" value="${Number(settings.fontSize || 19)}">
        </div>
        <div class="field">
          <label for="theme">纸色</label>
          <select id="theme" name="theme">
            <option value="paper" ${settings.theme === 'paper' ? 'selected' : ''}>素纸</option>
            <option value="sepia" ${settings.theme === 'sepia' ? 'selected' : ''}>暖黄</option>
            <option value="night" ${settings.theme === 'night' ? 'selected' : ''}>夜间</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">保存设置</button>
        <button class="btn" type="button" id="test-connection">测试连接</button>
        <button class="btn ghost" type="button" id="clear-key">清除已保存密钥</button>
        <span class="status-line" id="settings-status"></span>
      </div>
    </form>
    <div class="form-card" style="margin-top:20px">
      <h2 style="margin-top:0">阅读数据</h2>
      <p style="color:var(--muted);font-size:13px;line-height:1.9">书签、笔记、阅读进度保存在本机 <code>data/user.json</code>；译文缓存在 <code>data/translations/</code>。备份或迁移时复制整个 <code>data/</code> 目录即可。内置书籍在 <code>library/books/</code>，导入的书也在那里。</p>
      <div class="form-actions">
        <button class="btn" type="button" id="rebuild-search">重建全文索引</button>
        <a class="btn" href="/manual" target="_blank" rel="noopener">打开完整说明书</a>
      </div>
    </div>`;

  $$('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = PROVIDER_PRESETS[button.dataset.preset];
      if (!preset) return;
      $('#base-url').value = preset.baseUrl;
      $('#model').value = preset.model;
    });
  });

  const form = $('#settings-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const apiKeyInput = $('#api-key').value.trim();
    const payload = {
      providerName: '',
      baseUrl: $('#base-url').value.trim(),
      model: $('#model').value.trim(),
      temperature: Number($('#temperature').value) || 0,
      target: $('#target').value,
      fontSize: Number($('#font-size').value) || 19,
      theme: $('#theme').value,
      apiKey: apiKeyInput || '__KEEP__'
    };
    try {
      const result = await api('/api/settings', { method: 'POST', body: JSON.stringify(payload) });
      state.settings = result.settings;
      applySettings();
      $('#settings-status').textContent = '已保存';
      $('#settings-status').className = 'status-line ok';
      toast('设置已保存');
    } catch (error) {
      $('#settings-status').textContent = error.message;
      $('#settings-status').className = 'status-line err';
    }
  });

  $('#test-connection').addEventListener('click', async () => {
    const status = $('#settings-status');
    status.textContent = '正在测试……';
    status.className = 'status-line';
    try {
      const result = await api('/api/translate/test', {
        method: 'POST',
        body: JSON.stringify({
          baseUrl: $('#base-url').value.trim(),
          model: $('#model').value.trim(),
          apiKey: $('#api-key').value.trim() || '__KEEP__'
        })
      });
      status.textContent = `连接成功：${result.model}（${result.reply || 'OK'}）`;
      status.className = 'status-line ok';
    } catch (error) {
      status.textContent = error.message;
      status.className = 'status-line err';
    }
  });

  $('#clear-key').addEventListener('click', async () => {
    if (!confirm('确定清除本机保存的 API Key？')) return;
    try {
      const result = await api('/api/settings', { method: 'POST', body: JSON.stringify({ apiKey: '' }) });
      state.settings = result.settings;
      $('#api-key').value = '';
      toast('已清除密钥');
    } catch (error) {
      toast(error.message);
    }
  });

  $('#rebuild-search').addEventListener('click', async () => {
    try {
      const result = await api('/api/reindex', { method: 'POST' });
      toast(`索引已重建：${result.entries} 段`);
    } catch (error) {
      toast(error.message);
    }
  });
}

function renderImport() {
  renderNav('import');
  const categories = categoryList();
  $('#view').innerHTML = `
    <div class="page-head"><p class="eyebrow">扩充书库</p><h1>导入一本书</h1><p>粘贴纯文本或选择 .txt / .md 文件。章节会按「第…章 / 卷 / 回」或空行自动切分；不超过 48 MB。</p></div>
    <form class="form-card" id="import-form">
      <div class="field-row">
        <div class="field"><label for="import-title">书名 *</label><input id="import-title" required placeholder="如：黄帝内经·素问"></div>
        <div class="field"><label for="import-author">作者 / 译者</label><input id="import-author" placeholder="如：佚名"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="import-era">时代</label><input id="import-era" placeholder="如：战国"></div>
        <div class="field"><label for="import-category">分类</label><select id="import-category">${categories.map((c) => `<option value="${attr(c)}">${esc(c)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="import-tags">标签</label><input id="import-tags" placeholder="用逗号分隔，如：医学, 先秦"></div>
      <div class="field"><label for="import-intro">导读</label><textarea id="import-intro" maxlength="3000" placeholder="写一段本书的来源、版本或阅读提示。"></textarea></div>
      <div class="field"><label for="import-file">选择文本文件</label><input id="import-file" type="file" accept=".txt,.md,.text"><span class="hint">文件只在本机读取，不会上传。也可以直接粘贴到下方。</span></div>
      <div class="field"><label for="import-text">正文 *</label><textarea id="import-text" required style="min-height:260px;font-family:var(--font-serif);font-size:15px;line-height:1.9" placeholder="在这里粘贴全文……"></textarea></div>
      <div class="form-actions">
        <button class="btn primary" type="submit">导入并阅读</button>
        <span class="status-line" id="import-status"></span>
      </div>
    </form>
    <div class="form-card" style="margin-top:20px">
      <h2 style="margin-top:0">批量导入与全库扩展</h2>
      <p style="color:var(--muted);font-size:13px;line-height:1.9">仓库自带语料工具：<code>node tools/fetch-seed.js --only=&lt;种子id&gt;</code> 可按内置书单抓取 Kanripo 汉籍；<code>node tools/import-bible.js</code> 可从本机 <code>_work/ChiUn.json</code> 重新生成圣经；批量扩充时在 <code>tools/seed-list.json</code> 里加条目后运行 <code>node tools/fetch-seed.js</code>。完整命令见 <a href="/manual" target="_blank" rel="noopener">说明书</a>。导入后的书在书架里与内置书完全同权：可搜索、可翻译、可加书签。</p>
    </div>`;

  $('#import-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    $('#import-text').value = text;
    if (!$('#import-title').value) $('#import-title').value = file.name.replace(/\.(txt|md|text)$/i, '');
    toast(`已读取 ${file.name}，${fmtNumber(text.length)} 字`);
  });

  $('#import-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = $('#import-status');
    status.textContent = '正在导入……';
    status.className = 'status-line';
    try {
      const result = await api('/api/import', {
        method: 'POST',
        body: JSON.stringify({
          title: $('#import-title').value.trim(),
          author: $('#import-author').value.trim(),
          era: $('#import-era').value.trim(),
          category: $('#import-category').value,
          tags: $('#import-tags').value,
          intro: $('#import-intro').value,
          text: $('#import-text').value
        })
      });
      await refreshCatalog();
      status.textContent = `已导入《${result.book.title}》，${result.book.chapterCount} 章。`;
      status.className = 'status-line ok';
      toast('导入成功');
      setTimeout(() => {
        location.hash = `#/book/${encodeURIComponent(result.book.id)}`;
      }, 500);
    } catch (error) {
      status.textContent = error.message;
      status.className = 'status-line err';
    }
  });
}

/* ---------------- 群聊 (默认关闭; 连接自建 TenSaint73OS 中继) ---------------- */
const CHAT_STORAGE_KEY = 'wjg-chat';
// 脏话、涉黄、涉赌、涉毒都算不文明字符; 与中继服务端同一份规则，客户端再兜一层。
const CHAT_BANNED = [
  '傻逼', '煞笔', '沙比', '脑残', '智障', '贱人', '婊子', '王八蛋', '畜生', '狗东西',
  '操你妈', '草你妈', '草泥马', '他妈的', '弄死你', '杀了你', '强奸', '轮奸',
  '色情', '黄色网站', '黄片', '毛片', '成人视频', '裸聊', '约炮', '嫖娼', '卖淫', '援交',
  '一夜情', '淫秽', '淫荡', '自慰', '手淫', '口交', '肛交', '乳交', '鸡巴', '肉棒',
  '赌博', '赌场', '赌球', '赌钱', '博彩', '六合彩', '时时彩', '百家乐', '老虎机', '下注', '押注',
  '毒品', '吸毒', '贩毒', '冰毒', '海洛因', '大麻', '可卡因', '摇头丸', 'K粉', '麻古', '制毒',
  'fuck', 'fucking', 'motherfucker', 'shit', 'bitch', 'asshole', 'bastard', 'cunt',
  'dickhead', 'whore', 'slut', 'nigger', 'nigga', 'faggot', 'retard',
  'porn', 'porno', 'pornhub', 'sex', 'sexting', 'nude', 'naked', 'xxx',
  'casino', 'gambling', 'gamble', 'betting', 'blackjack', 'roulette', 'baccarat',
  'heroin', 'cocaine', 'meth', 'marijuana', 'cannabis', 'fentanyl', 'ecstasy', 'ketamine', 'opium', 'drugs',
];
const CHAT_BANNED_RE = new RegExp(`(${CHAT_BANNED
  .map((word) => (/[\u4e00-\u9fff]/.test(word)
    ? word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    : `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`))
  .sort((a, b) => b.length - a.length)
  .join('|')})`, 'gi');

function chatMask(text) {
  return String(text == null ? '' : text).replace(CHAT_BANNED_RE, (match) => '*'.repeat(match.length));
}

function chatLoadConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '{}');
    return {
      url: String(raw.url || ''),
      token: String(raw.token || ''),
      name: String(raw.name || ''),
      enabled: Boolean(raw.enabled),
    };
  } catch {
    return { url: '', token: '', name: '', enabled: false };
  }
}

function chatSaveConfig(cfg) {
  try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cfg)); } catch { /* 存储不可用时只在本次会话生效 */ }
}

function chatNormalizeUrl(raw) {
  const value = String(raw || '').trim().replace(/\/+$/, '');
  if (!value) return '';
  if (/^https:\/\/[^\s]+$/i.test(value)) return value;
  if (/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(value)) return value;
  return '';
}

const chatRuntime = { cfg: chatLoadConfig(), timer: null, lastId: 0, sending: false, seen: new Set() };

function chatSetStatus(text, tone = '') {
  const node = $('#chat-status');
  if (!node) return;
  node.textContent = text;
  node.className = `chat-status${tone ? ` ${tone}` : ''}`;
}

function chatMessageNode(message) {
  const wrap = document.createElement('div');
  wrap.className = `chat-msg${message.name && message.name === chatRuntime.cfg.name ? ' mine' : ''}`;
  const meta = document.createElement('div');
  meta.className = 'chat-meta';
  const name = document.createElement('span');
  name.className = 'chat-name';
  name.textContent = chatMask(message.name || '访客');
  const via = document.createElement('span');
  via.className = 'chat-via';
  via.textContent = message.via === 'relay' ? '中继' : '本机';
  const time = document.createElement('span');
  time.textContent = fmtDate(message.at) || '';
  meta.append(name, via, time);
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = chatMask(message.text);
  wrap.append(meta, bubble);
  return wrap;
}

function chatAppend(message) {
  if (!message || chatRuntime.seen.has(message.id)) return;
  chatRuntime.seen.add(message.id);
  if (Number(message.id) > chatRuntime.lastId) chatRuntime.lastId = Number(message.id);
  const log = $('#chat-log');
  if (!log) return;
  const empty = log.querySelector('.chat-empty');
  if (empty) empty.remove();
  const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 90;
  log.appendChild(chatMessageNode(message));
  if (nearBottom) log.scrollTop = log.scrollHeight;
}

function stopChatPolling() {
  if (chatRuntime.timer) clearTimeout(chatRuntime.timer);
  chatRuntime.timer = null;
}

async function chatRelay(path, options = {}) {
  const cfg = chatRuntime.cfg;
  const url = `${chatNormalizeUrl(cfg.url)}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer);
  }
}

function chatSchedulePoll() {
  stopChatPolling();
  if (!location.hash.startsWith('#/chat') || !chatRuntime.cfg.enabled) return;
  chatRuntime.timer = setTimeout(chatPoll, 3500);
}

async function chatPoll() {
  chatRuntime.timer = null;
  if (!location.hash.startsWith('#/chat') || !chatRuntime.cfg.enabled) return;
  if (!chatRuntime.cfg.url || !chatRuntime.cfg.token) {
    chatSetStatus('未配置', 'error');
    return;
  }
  try {
    const response = await chatRelay(`/api/chat/relay/messages?after=${chatRuntime.lastId}`);
    if (response.status === 401) {
      chatSetStatus('令牌无效或已吊销', 'error');
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    (data.messages || []).forEach(chatAppend);
    chatSetStatus(`已连接 · ${data.room || '大厅'}`, 'online');
    chatSchedulePoll();
  } catch {
    chatSetStatus('连接中断，稍后重试', 'error');
    chatSchedulePoll();
  }
}

function chatReadForm() {
  const url = chatNormalizeUrl($('#chat-url').value);
  const token = $('#chat-token').value.trim();
  const name = $('#chat-name').value.trim().slice(0, 24) || '万卷阁读者';
  const enabled = $('#chat-enabled').checked;
  if (enabled && !url) {
    toast('中继地址只支持 https，或本机回环 http://127.0.0.1 / http://localhost。');
    return null;
  }
  if (enabled && !token) {
    toast('请填写房间令牌。');
    return null;
  }
  return { url, token, name, enabled };
}

function chatBindPage() {
  const cfg = chatRuntime.cfg;
  if (!$('#chat-url')) return;
  $('#chat-url').value = cfg.url;
  $('#chat-token').value = cfg.token;
  $('#chat-name').value = cfg.name || '万卷阁读者';
  $('#chat-enabled').checked = cfg.enabled;
  chatSetStatus(cfg.enabled ? '连接中…' : '未启用', cfg.enabled ? '' : '');
  if (cfg.enabled) {
    chatPoll();
    chatSchedulePoll();
  }
  $('#chat-test').addEventListener('click', async () => {
    const testCfg = chatReadForm();
    if (!testCfg) return;
    const saved = chatRuntime.cfg;
    chatRuntime.cfg = testCfg;
    chatSetStatus('测试中…');
    try {
      const response = await chatRelay('/api/chat/relay/info');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        chatSetStatus(response.status === 401 ? '令牌无效或已吊销' : `连接失败（${response.status}）`, 'error');
        toast(data.error || '中继拒绝了这次连接');
        return;
      }
      chatSetStatus(`已连接 · ${data.room || '大厅'}`, 'online');
      toast(`中继可用：房间「${data.room || '大厅'}」，已有 ${data.messages || 0} 条消息。`);
    } catch {
      chatSetStatus('连接失败', 'error');
      toast('连接失败，请检查地址、令牌或中继是否在运行。');
    } finally {
      chatRuntime.cfg = saved;
    }
  });
  $('#chat-save').addEventListener('click', () => {
    const next = chatReadForm();
    if (!next) return;
    chatRuntime.cfg = next;
    chatSaveConfig(next);
    toast(next.enabled ? '群聊已启用，只连接你填写的中继。' : '群聊已关闭，不会发出任何请求。');
    chatSetStatus(next.enabled ? '连接中…' : '未启用');
    stopChatPolling();
    if (next.enabled) {
      chatPoll();
      chatSchedulePoll();
    }
  });
  $('#chat-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (chatRuntime.sending) return;
    const input = $('#chat-input');
    const text = chatMask(input.value.trim());
    if (!text) return;
    if (!chatRuntime.cfg.enabled) {
      toast('群聊未启用，先在上面打开并保存。');
      return;
    }
    chatRuntime.sending = true;
    $('#chat-send').disabled = true;
    try {
      const response = await chatRelay('/api/chat/relay/messages', {
        method: 'POST',
        body: JSON.stringify({ name: chatRuntime.cfg.name || '万卷阁读者', text }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      input.value = '';
      $('#chat-count').textContent = '0 / 2000';
      if (data.message) chatAppend(data.message);
      chatSetStatus(`已连接 · ${data.room || '大厅'}`, 'online');
    } catch (error) {
      toast(`发送失败：${error.message}`);
    } finally {
      chatRuntime.sending = false;
      $('#chat-send').disabled = false;
    }
  });
  $('#chat-input').addEventListener('input', () => {
    $('#chat-count').textContent = `${$('#chat-input').value.length} / 2000`;
  });
  $('#chat-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      $('#chat-form').requestSubmit();
    }
  });
}

function renderChatView() {
  renderNav('chat');
  $('#view').innerHTML = `
    <div class="page-head">
      <p class="eyebrow">群聊</p>
      <h1>大厅</h1>
      <p>默认关闭。启用并保存后，才会连接你填写的 TenSaint73OS 中继；不启用时不会发出任何请求。</p>
    </div>
    <div class="chat-civility">文明发言 · 希望大家文明发言，不文明的字符将会变成星号（*）。脏话与涉黄、涉赌、涉毒内容都算不文明字符；中继在服务端强制替换，本机显示前还会再过滤一次。</div>
    <div class="chat-layout">
      <section class="form-card chat-settings-card">
        <h2>中继设置</h2>
        <div class="field">
          <label for="chat-url">中继地址</label>
          <input id="chat-url" type="url" placeholder="https://你的隧道地址 或 http://127.0.0.1:7373" autocomplete="off">
          <span class="hint">只支持 https，或本机回环 http://127.0.0.1 / http://localhost。地址由 TenSaint73OS 管理员提供。</span>
        </div>
        <div class="field">
          <label for="chat-token">房间令牌</label>
          <input id="chat-token" type="password" placeholder="由 TenSaint73OS 管理员生成" autocomplete="off">
          <span class="hint">令牌只保存在这台设备的浏览器里，不写入书库。</span>
        </div>
        <div class="field">
          <label for="chat-name">显示昵称</label>
          <input id="chat-name" type="text" maxlength="24" placeholder="万卷阁读者" autocomplete="off">
        </div>
        <label class="chat-enable"><input id="chat-enabled" type="checkbox"><span>启用群聊（默认关闭；关闭时不会发出任何请求）</span></label>
        <div class="form-actions">
          <button class="btn" type="button" id="chat-test">测试连接</button>
          <button class="btn primary" type="button" id="chat-save">保存设置</button>
        </div>
      </section>
      <section class="form-card chat-room-card">
        <div class="chat-room-head"><strong>大厅</strong><span id="chat-status" class="chat-status">未启用</span></div>
        <div id="chat-log" class="chat-log"><div class="chat-empty">还没有消息。<br>启用后这里会显示中继里的最近 100 条发言。</div></div>
        <form id="chat-form" class="chat-composer">
          <textarea id="chat-input" rows="2" maxlength="2000" placeholder="说点什么…"></textarea>
          <div class="chat-composer-foot">
            <span id="chat-count" class="chat-count">0 / 2000</span>
            <button class="btn primary" type="submit" id="chat-send">发送</button>
          </div>
        </form>
      </section>
    </div>`;
  chatBindPage();
}

function renderAbout() {
  renderNav('home');
  const stats = state.stats || {};
  $('#view').innerHTML = `
    <div class="page-head"><p class="eyebrow">关于</p><h1>万卷阁 <span style="font-size:16px;color:var(--muted)">v${esc(state.version)}</span></h1><p>离线优先的古籍、宗教经典与公版书阅读器。</p></div>
    <div class="prose">
      <h2>它是什么</h2>
      <p>万卷阁把公版典籍做成一个可以在本机离线阅读、检索、做笔记的小型图书馆。它不要求注册，不连接云端书库，不记录你的阅读行为。内置 ${stats.books || 0} 部书、约 ${fmtNumber(stats.chars || 0)} 字；你可以继续导入自己的文本。</p>
      <h2>“所有书”的边界</h2>
      <p>全球在版书目约 1.3 亿种，绝大多数仍在版权保护期内，且没有可合法分发的全文。任何声称“内置所有书”的安装包都不现实。万卷阁的做法是：内置可合法打包的核心典籍，提供 Kanripo、CBETA、道藏、四库、Gutenberg 与多语言圣经的导入器，让你把能拿到的公版文本装进同一个阅读器。</p>
      <h2>内置范围</h2>
      <p>经史子集的核心原典、佛道两家的核心经咒、圣经《和合本》66 卷全本、推背图与部分预言书、兵法与术数入门。每本书的来源与授权状态都写在书籍详情页。</p>
      <h2>翻译</h2>
      <p>翻译不是离线模型，而是调用你配置的 OpenAI 兼容接口。你可以用 DeepSeek、通义千问、OpenAI，也可以在本机跑 Ollama。译文会缓存在本机，之后离线也能看。</p>
      <h2>不做什么</h2>
      <p>不内置现代出版社的排印本、今译、注释；不内置受版权保护的圣经现代译本（如思高本、现代中文译本）；不提供盗版书下载。你需要对自己的导入内容负责。</p>
      <p><a href="/manual" target="_blank" rel="noopener">打开完整说明书 →</a></p>
    </div>`;
}

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = raw.split('?');
  const parts = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  return { parts, params: new URLSearchParams(queryPart || '') };
}

function render() {
  stopChatPolling();
  const { parts, params } = parseHash();
  const view = $('#view');
  if (!view) return;
  const searchInput = $('#search-input');
  if (searchInput && parts[0] !== 'search') searchInput.value = '';
  if (!parts.length) return renderHome(params);
  switch (parts[0]) {
    case 'book':
      if (parts[1]) return renderBook(parts[1]);
      break;
    case 'read':
      if (parts[1]) return renderReader(parts[1], Number(parts[2]) || 0);
      break;
    case 'search':
      return renderSearch(params);
    case 'map':
      return renderMap(params);
    case 'collections':
      return renderCollections();
    case 'bookmarks':
      return renderBookmarks();
    case 'notes':
      return renderNotes();
    case 'settings':
      return renderSettings();
    case 'import':
      return renderImport();
    case 'chat':
      return renderChatView();
    case 'about':
      return renderAbout();
    default:
      break;
  }
  return renderHome(params);
}

function bindChrome() {
  $('#search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const q = $('#search-input').value.trim();
    if (!q) return;
    location.hash = `#/search?q=${encodeURIComponent(q)}`;
  });
  $$('[data-close-modal]').forEach((el) => el.addEventListener('click', closeModal));
  $$('[data-close-drawer]').forEach((el) => el.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      closeDrawer();
    }
    if (event.target.matches('input, textarea, select')) return;
    if (event.key === 'ArrowLeft' && state.currentBook) {
      const previous = state.chapterIndex - 1;
      if (previous >= 0) location.hash = `#/read/${encodeURIComponent(state.currentBook.id)}/${previous}`;
    }
    if (event.key === 'ArrowRight' && state.currentBook) {
      const next = state.chapterIndex + 1;
      if (next < state.currentBook.chapters.length) location.hash = `#/read/${encodeURIComponent(state.currentBook.id)}/${next}`;
    }
  });
  window.addEventListener('hashchange', () => {
    state.currentBook = null;
    state.chapterIndex = 0;
    state.translation = null;
    render();
  });
  let mapResizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(mapResizeTimer);
    mapResizeTimer = setTimeout(() => {
      if ($('#map-markers')) layoutMapMarkers();
    }, 160);
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

async function checkForUpdateNotice() {
  try {
    const data = await api('/api/update');
    if (!data || !data.update_available || !data.latest) return;
    let dismissed = '';
    try { dismissed = localStorage.getItem('wjg-update-dismissed') || ''; } catch { /* noop */ }
    if (dismissed === data.latest) return;
    $('#update-notice-title').textContent = `发现新版本 v${data.latest}`;
    $('#update-notice-body').textContent = `当前运行 v${data.current}。升级不需要搬动书库：把新发行包解压到新目录，再把旧的 data/ 与 library/books/ 复制过去即可。`;
    $('#update-github').href = data.releases_url || 'https://github.com/IAMMEZSH/wanjuan-ge/releases';
    if (data.gitcode_url) {
      $('#update-gitcode').href = data.gitcode_url;
      $('#update-gitcode').hidden = false;
    } else {
      $('#update-gitcode').hidden = true;
    }
    document.querySelector('[data-update-close]').addEventListener('click', () => {
      try { localStorage.setItem('wjg-update-dismissed', data.latest); } catch { /* noop */ }
      $('#update-notice').hidden = true;
    });
    $('#update-notice').hidden = false;
  } catch {
    /* 离线或发布接口不可达时不打扰 */
  }
}

async function boot() {
  try {
    const [catalog, user] = await Promise.all([api('/api/catalog'), api('/api/user')]);
    setBooks(catalog);
    state.user = user;
    state.settings = user.settings;
    applySettings();
    bindChrome();
    render();
    registerServiceWorker();
    checkForUpdateNotice();
    if (state.user.progress && Object.keys(state.user.progress).length === 0) {
      // 首次启动不打扰，只确保数据结构存在。
      state.user.progress = {};
    }
  } catch (error) {
    $('#view').innerHTML = `
      <div class="empty-state">
        <p>无法连接本机书库服务。</p>
        <p style="font-size:13px">请确认启动器窗口仍在运行，然后刷新页面。</p>
        <p style="font-size:12px;color:var(--muted)">${esc(error.message)}</p>
      </div>`;
  }
}

boot();
