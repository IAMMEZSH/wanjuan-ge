'use strict';

/**
 * 生成「世界」类目的四本西方神秘学导读：
 *   40 所罗门大钥匙 / 41 所罗门小钥匙 / 42 威卡与西方神秘学 / 43 驱魔者手册与罗马礼书
 *
 * 底本均为 1900 年前后的公版书（见 _work/occult/），正文为原创中文导读；
 * 英文、拉丁文引文均为短引，并随文标注来源。不收录任何现代译本或现代著作整段。
 *
 * 用法：node tools/import-occult.js
 */

const fs = require('fs');
const path = require('path');

const util = require('../lib/util');
const library = require('../lib/library');
const { buildBook } = require('../lib/importers');
const { SPIRITS } = require('./occult/goetia-table');

const CONTENT_DIR = path.join(__dirname, 'occult', 'content');
const BOOKS_DIR = library.BOOKS_DIR;

const BOOKS = [
  {
    id: 'suolomen-da-yaoshi',
    title: '所罗门大钥匙',
    subtitle: 'The Key of Solomon the King · 1889 年 Mathers 公版译本导读 · 中文释义',
    author: 'S. L. MacGregor Mathers（英译）· 本书中文导读书写',
    era: '抄本约 14—17 世纪；Mathers 英译 1889 年',
    tags: ['所罗门', 'Clavicula Salomonis', '仪式魔法', 'Mathers', '公版', '导读'],
    order: 40,
    file: 'da-yaoshi.md',
    intro:
      '《所罗门大钥匙》（Clavicula Salomonis）是西方仪式魔法最重要的文本之一。本书以 1889 年 Mathers 公版英译为底，逐章说明两卷结构与操作观念，讨论其希腊化埃及—犹太渊源、中世纪抄本流传、行星对应与护符制作的历史语境，并附简短英文选译。全书以历史文献解读为主，不构成任何仪式操作指南。',
    range: [18000, 25000],
    source: {
      provider: 'Internet Archive 扫描本（Mathers 1889 英译）',
      file: '_work/occult/greater-key.txt',
      edition: 'The Key of Solomon the King (Clavicula Salomonis), trans. S. L. MacGregor Mathers, London, 1889',
      license: '1889 年英译本已进入公有领域',
      note: '中文导读、结构说明与释义为本项目原创；仅短引公版英文并附译文；不收录现代中文译本'
    }
  },
  {
    id: 'suolomen-xiao-yaoshi',
    title: '所罗门小钥匙',
    subtitle: 'The Lesser Key of Solomon · Goetia 七十二柱 · 公版英译与中文简表',
    author: 'S. L. MacGregor Mathers（英译）· Aleister Crowley（编）· 本书中文导读书写',
    era: '抄本约 17 世纪；Mathers-Crowley 英译 1904 年',
    tags: ['所罗门', 'Lemegeton', 'Goetia', '七十二柱', '公版', '导读'],
    order: 41,
    file: 'xiao-yaoshi.md',
    intro:
      '《所罗门小钥匙》（Lemegeton）是五卷本魔法汇编，其中第一卷《Goetia》以七十二柱灵体名录最为人熟知。本书说明五卷的结构与来源，交代 Mathers-Crowley 1904 年英译的版本脉络，并以原创中文简表逐柱介绍编号、阶位、形貌与职司。所据为 Gutenberg #72679 公版英译；简表不增补原文没有的能力，也不提供召唤操作。',
    range: [20000, 32000],
    source: {
      provider: 'Project Gutenberg #72679',
      file: '_work/occult/lesser-key-gutenberg.txt',
      edition: 'The Lesser Key of Solomon, Goetia, ed. L. W. de Laurence, Chicago, 1916（重印 Mathers-Crowley 1904 英译）',
      license: '1904 年英译与 1916 年重印本均属公有领域',
      note: '中文简表、注释与导读为本项目原创；英文短句随文标注；不提供仪式步骤'
    }
  },
  {
    id: 'xifang-shenmi-xue',
    title: '威卡与西方神秘学',
    subtitle: '从赫尔墨斯主义到威卡 · 历史、信念、仪轨与书目',
    author: '本书编写组',
    era: '古代晚期至 20 世纪',
    tags: ['威卡', '赫尔墨斯主义', '卡巴拉', '炼金术', '占星', '塔罗', 'Agrippa', '导读'],
    order: 42,
    file: 'shenmi-xue.md',
    intro:
      '本书把威卡放回西方神秘学的长时段脉络中考察：从赫尔墨斯主义、卡巴拉、炼金术、占星与塔罗，到 Agrippa 的《神秘哲学三书》，再到 19 世纪末的公版魔法文献与 20 世纪中叶威卡的成形。全书分历史、信念、仪轨、伦理与书目五条线索，说明哪些说法有史料依据，哪些属于现代建构，并交代现代威卡著作的版权边界。',
    range: [25000, 35000],
    source: {
      provider: 'Project Gutenberg / Internet Archive 公版文本',
      files: [
        '_work/occult/hermes-mead.txt（G. R. S. Mead, Thrice-Greatest Hermes, 1906）',
        '_work/occult/agrippa.txt（Three Books of Occult Philosophy, 1651 英译）',
        '_work/occult/abramelin.txt（Mathers 英译，1900）',
        '_work/occult/aradia.txt（Leland, Aradia, 1899）',
        '_work/occult/waite.txt（Waite, The Book of Ceremonial Magic, 1913）'
      ],
      license: '上述底本均已进入公有领域',
      note: '威卡历史与信念部分为原创综述，依据公开学术研究；不转载 Gardner、Cunningham、Starhawk 等现代著作'
    }
  },
  {
    id: 'qumozhe-shouce',
    title: '驱魔者手册与罗马礼书',
    subtitle: '历史、礼仪结构与文本边界 · 中文导读',
    author: '本书编写组',
    era: '3—20 世纪',
    tags: ['驱魔', '罗马礼书', 'Rituale Romanum', '天主教', '礼仪', '导读'],
    order: 43,
    file: 'qumozhe-shouce.md',
    intro:
      '本书讨论「驱魔者手册」这一名称背后的历史文本：从早期教会的洗礼驱魔，到 1614 年《罗马礼书》、1952 年与 1999 年的修订，说明天主教驱魔礼的祈祷、圣水、十字架、连祷、福音、按手与傅油等要素，并厘清附魔与精神疾病的边界。全书不提供任何可操作的驱魔步骤，现代同名通俗汇编与礼仪书版权亦在讨论之列。',
    range: [15000, 20000],
    source: {
      provider: 'Internet Archive 扫描本（Rituale Romanum, 1886 印本）',
      file: '_work/occult/rituale.txt',
      edition: 'Rituale Romanum, Paris, 1886（OCR 文本）',
      license: '1886 年印本已进入公有领域',
      note: '拉丁文仅作短引并注明 OCR 校读；1952、1999 年修订礼书仍受版权保护，仅作概述'
    }
  },
  {
    id: 'suolomen-shu',
    title: '所罗门书',
    subtitle: 'The Book of Solomon · 从《所罗门遗训》到近代所罗门魔法抄本 · 中文导读与公版选译',
    author: '本书编写组',
    era: '约 1—19 世纪',
    tags: ['所罗门', 'Testament of Solomon', '魔法书', '戒指', '恶魔学', '公版', '导读'],
    order: 39,
    file: 'suolomen-shu.md',
    intro:
      '“所罗门书”不是单一书名，而是一个延续两千年的文本家族。本书以公元初《所罗门遗训》为核心：所罗门借天使米迦勒所赐的戒指命令众魔建造圣殿，逐一审问它们并记录名字、职司与克星，最终因背离神而跌倒。书中兼述中世纪的《所罗门魔法》、文艺复兴的大小钥匙与近代民间抄本，说明“所罗门”如何成为魔法传统的共享符号。全书为历史—文献导读，不提供召唤或护符操作。',
    range: [9000, 13000],
    pMin: 60,
    source: {
      provider: 'Project Gutenberg / Internet Archive 公版文本',
      file: '_work/occult/testament-solomon.txt（F. C. Conybeare 1898 英译，公有领域）',
      edition: 'The Testament of Solomon, trans. F. C. Conybeare, Jewish Quarterly Review, 1898',
      license: '1898 年英译已进入公有领域',
      note: '中文叙述、结构分析与释义为本项目原创；仅短引公版英文并附译文；不提供仪式步骤'
    }
  },
  {
    id: 'rojer-aier',
    title: '大天使罗杰爱尔之书',
    subtitle: 'Sefer Raziel HaMalakh · 天使传统、星象与护符 · 中文导读',
    author: '本书编写组',
    era: '抄本约 13 世纪；阿姆斯特丹印本 1701 年',
    tags: ['罗杰爱尔', 'Sefer Raziel', '天使学', '卡巴拉', '星象', '护符', '公版', '导读'],
    order: 44,
    file: 'rojer.md',
    intro:
      '《大天使罗杰爱尔之书》是犹太神秘主义传统中归于天使罗杰爱尔的名著。传说罗杰爱尔把创世、星辰、名字与护佑的知识写成书，交给被逐出伊甸园的亚当。现存文本是十三世纪前后形成的希伯来文汇编，融合《以诺书》传统、卡巴拉、占星学与护符实践。本书逐章说明其文本史、宇宙论、天使名录、名字观念与伦理边界，附公版主题选译；不提供召唤或操作指南。',
    range: [9000, 13000],
    pMin: 60,
    source: {
      provider: '公版希伯来文印本与公开学术研究',
      file: '_work/occult/sefer-raziel-1701.txt（阿姆斯特丹 1701 年印本传统）',
      edition: 'Sefer Raziel HaMalakh, Amsterdam, 1701（公版印本传统）',
      license: '1701 年印本已进入公有领域',
      note: '中文叙述与释义为本项目原创；现代校勘本与译本仍受版权保护，未作复制'
    }
  },
  {
    id: 'tianjie-xulun',
    title: '天阶序论',
    subtitle: '伪狄奥尼修斯《论天阶》· 九阶天使与神圣秩序 · 中文译述读本',
    author: '伪狄奥尼修斯 著 · 本书中文译述',
    era: '约 5—6 世纪',
    tags: ['伪狄奥尼修斯', '天阶序论', '天使学', '神秘神学', '新柏拉图主义', '公版', '译述'],
    order: 45,
    file: 'tianjie-xulun.md',
    intro:
      '《天阶序论》是五至六世纪希腊基督徒托名“狄奥尼修斯”写下的天使学与神秘神学著作。全书十五章，论神圣层级的秩序、圣经象征的意义、九阶天使（炽天使、智天使、座天使、主治、德能、权能、执政、总领、天使）的职分，以及灵魂借净化、光照与成全上升的路径。本书据 1897 年 Parker 公版英译作中文译述，保留原书章节结构与核心论证，并附历史背景说明。',
    range: [11000, 16000],
    pMin: 60,
    source: {
      provider: 'Project Gutenberg / Internet Archive 公版英译',
      file: '_work/occult/celestial-hierarchy-parker.txt（John Parker 1897 英译）',
      edition: 'Dionysius the Areopagite, The Celestial Hierarchy, trans. John Parker, 1897',
      license: '1897 年英译已进入公有领域',
      note: '中文译述为本项目原创；保留章节结构与核心论证，不作现代译本的整段复制'
    }
  }
];

/* ---------- Markdown 内容解析 ---------- */

function parseContent(file) {
  const full = path.join(CONTENT_DIR, file);
  const text = fs.readFileSync(full, 'utf8').replace(/\r/g, '').replace(/^\uFEFF/, '');
  const lines = text.split('\n');
  const chapters = [];
  let current = null;
  let buffer = [];

  const flush = () => {
    if (!current) {
      buffer = [];
      return;
    }
    const paragraph = buffer.join('').replace(/\s+/g, ' ').trim();
    buffer = [];
    if (paragraph) current.paragraphs.push(paragraph);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^##\s+/.test(line)) {
      flush();
      if (current && current.paragraphs.length) chapters.push(current);
      current = { title: line.replace(/^##\s+/, '').trim(), paragraphs: [] };
      continue;
    }
    if (/^#\s+/.test(line)) continue;
    if (!line) {
      flush();
      continue;
    }
    buffer.push(line);
  }
  flush();
  if (current && current.paragraphs.length) chapters.push(current);
  return chapters;
}

/* ---------- Goetia 简表章节 ---------- */

function spiritParagraph(s) {
  return `第 ${s.n} 柱　${s.cn}（${s.name}）。阶位：${s.rank}；麾下 ${s.legions} 个军团。形貌：${s.look}。职司：${s.office}。注：${s.note}。`;
}

function tableChapters() {
  const chapters = [];
  const groupTitles = ['一', '二', '三', '四', '五', '六'];
  for (let g = 0; g < 6; g += 1) {
    const slice = SPIRITS.slice(g * 12, g * 12 + 12);
    const paragraphs = slice.map(spiritParagraph);
    chapters.push({ title: `七十二柱简表（${groupTitles[g]}）：第 ${g * 12 + 1}—${g * 12 + 12} 柱`, paragraphs });
  }
  return chapters;
}

function summaryChapter() {
  const paragraphs = [];
  for (let i = 0; i < SPIRITS.length; i += 8) {
    const line = SPIRITS.slice(i, i + 8)
      .map((s) => `${s.n} ${s.cn} ${s.name}｜${s.rank}｜${s.legions}`)
      .join('；');
    paragraphs.push(`${line}。`);
  }
  paragraphs.push(
    '统计上，七十二柱中称王者九柱，称公爵者二十三柱，称侯爵者十五柱，称总统者十四柱，称伯爵者十二柱，称亲王者七柱，称骑士者仅一柱；另有若干身兼两阶者，故合计大于七十二。阶位并非固定官制，而是抄本传统层层叠加的结果；读者若把它当作严整的天阶，反而会遮蔽文本的编纂史。'
  );
  return { title: '七十二柱总表', paragraphs };
}

/* ---------- 构建与校验 ---------- */

function validateChapters(book, meta) {
  const problems = [];
  const range = meta.range;
  const pMin = meta.pMin || 80;
  const pMax = meta.pMax || 220;
  if (book.chapters.length < 12) problems.push(`章节数 ${book.chapters.length} < 12`);
  if (book.charCount < range[0] || book.charCount > range[1]) {
    problems.push(`字数 ${book.charCount} 不在 ${range[0]}—${range[1]} 之间`);
  }
  for (const chapter of book.chapters) {
    for (const p of chapter.paragraphs) {
      const n = util.countChars(p);
      if (n < pMin || n > pMax) {
        problems.push(`段落 ${n} 字（${chapter.title}）：${p.slice(0, 42)}…`);
      }
    }
  }
  return problems;
}

function run() {
  const report = [];
  for (const meta of BOOKS) {
    let chapters = parseContent(meta.file);
    if (meta.id === 'suolomen-xiao-yaoshi') {
      const extra = tableChapters();
      // 把简表与总表插在「名称与语源」之前，保持论述顺序
      const at = chapters.findIndex((c) => c.title.includes('名称与语源'));
      const insertAt = at >= 0 ? at : chapters.length;
      chapters = [...chapters.slice(0, insertAt), ...extra, summaryChapter(), ...chapters.slice(insertAt)];
    }
    const book = buildBook({
      id: meta.id,
      title: meta.title,
      subtitle: meta.subtitle,
      author: meta.author,
      era: meta.era,
      category: '世界',
      tags: meta.tags,
      intro: meta.intro,
      script: 'simplified',
      chapters,
      source: meta.source,
      builtin: true,
      cover: 'world',
      order: meta.order,
      type: 'text'
    });
    const problems = validateChapters(book, meta);
    if (problems.length) {
      console.error(`\n[occult] 《${meta.title}》校验未通过：`);
      problems.slice(0, 30).forEach((p) => console.error('  -', p));
      if (problems.length > 30) console.error(`  … 另有 ${problems.length - 30} 条`);
      process.exitCode = 1;
      continue;
    }
    util.writeJsonAtomic(path.join(BOOKS_DIR, `${meta.id}.json`), book);
    report.push({ id: meta.id, title: meta.title, chapters: book.chapters.length, chars: book.charCount });
    console.log(`[occult] 《${meta.title}》：${book.chapters.length} 章 / ${book.charCount} 字`);
  }

  if (process.exitCode) {
    console.error('\n[occult] 有书未通过校验，目录未重建');
    return;
  }

  const catalog = library.rebuildCatalog({ quiet: true });
  const ids = new Set(catalog.books.map((b) => b.id));
  for (const item of report) {
    if (!ids.has(item.id)) throw new Error(`目录缺少 ${item.id}`);
  }
  console.log(`[occult] 目录已重建：${catalog.books.length} 部`);

  console.log('\n[occult] 完成：');
  for (const item of report) {
    console.log(`  ${item.id}  《${item.title}》  ${item.chapters} 章  ${item.chars} 字`);
  }
}

run();
