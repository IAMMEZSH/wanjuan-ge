'use strict';

/**
 * 生成《神曲》三部曲：
 * 意大利原文与 Longfellow 英译取自 Project Gutenberg（公版），
 * 中文提要、开篇三行与名句译文为本书原创。
 */

const fs = require('fs');
const path = require('path');
const util = require('../lib/util');
const library = require('../lib/library');

const SRC = path.join(__dirname, '..', '_work', 'dante');
const cantos = JSON.parse(fs.readFileSync(path.join(SRC, 'cantos.json'), 'utf8'));

const PARTS = [
  {
    key: 'INFERNO',
    id: 'shenqu-diyu',
    title: '神曲·地狱篇',
    subtitle: '但丁《神曲》三部曲之一 · 意大利原文 · Longfellow 公版英译 · 中文提要',
    file: 'zh-inferno.json',
    order: 20,
    intro:
      '《地狱篇》是《神曲》的第一部，共三十四歌。但丁在人生中途迷失于幽暗森林，被三兽拦住，维吉尔受贝雅特丽齐之托前来引路。二人穿过地狱九圈，直至地心，见到形形色色的罪人与惩罚，最后从地心另一侧走出，重见群星。本卷以意大利原文与朗费罗公版英译为底，附原创中文提要、开篇三行与名句译文；中文全译本因版权原因不收录。',
    guide: [
      '但丁·阿利吉耶里（1265—1321）生于佛罗伦萨，曾任城市共和国的行政官，1302 年被政敌放逐，终身未归。《神曲》约作于 1307 至 1321 年，原题《喜剧》（La Commedia），薄伽丘后来加上「神圣的」一词，遂成《神圣的喜剧》，中文通称《神曲》。',
      '全诗一万四千余行，采用三行韵（terza rima）连锁押韵，以但丁本人为叙述者，写他于 1300 年复活节前后游历地狱、炼狱、天堂的幻游。数字「三」贯穿全诗：三部、每部三十三歌（《地狱篇》另加序歌一歌）、三行一节、三的倍数构成结构。',
      '《地狱篇》的伦理结构以亚里士多德与托马斯·阿奎那为骨架：地狱形如漏斗，自上而下九圈，罪愈重者愈深。第一至五圈为不能自制之罪，第六圈为异端，第七圈为暴力，第八圈为欺诈，第九圈为背叛。撒旦位于地心，三面三口，口衔犹大、布鲁图斯与卡西乌斯。',
      '本卷的意大利原文依据 Gutenberg #1000（La Divina Commedia），英译依据 Gutenberg #1004（Longfellow 译本），二者均属公有领域。中文提要与译诗为本项目原创，依据原文与公版英译整理，不代表任何现代中文译本的措辞。',
      '阅读建议：先读中文提要把握情节与象征，再看开篇三行与名句对照，最后进入原文与英译。遇到专名，可参考每歌提要中的人名说明。'
    ]
  },
  {
    key: 'PURGATORIO',
    id: 'shenqu-lianyu',
    title: '神曲·炼狱篇',
    subtitle: '但丁《神曲》三部曲之二 · 意大利原文 · Longfellow 公版英译 · 中文提要',
    file: 'zh-purgatorio.json',
    order: 21,
    intro:
      '《炼狱篇》共三十三歌。但丁与维吉尔从地狱底部走出，来到南半球海中的炼狱山。炼狱是灵魂悔罪净化之地，分山脚、七层与山顶乐园。七层对应七宗罪，灵魂逐层上行，愈往上愈轻。维吉尔在乐园门前退场，贝雅特丽齐出现，引导但丁准备升入天堂。全篇以「自由」与「归乡」为线索，终句「纯洁而准备上升，向群星」与《地狱篇》遥相呼应。',
    guide: [
      '炼狱（Purgatorio）是基督教末世论中的中间状态：灵魂在恩典中去世，却仍需洁净，才能进入天堂。但丁把炼狱想象为南半球的一座高山，与耶路撒冷相对，山顶即地上乐园。',
      '全篇三十三歌，加上《地狱篇》的序歌，合计一百歌。结构上，炼狱山脚为迟悔者，山门以上七层对应傲慢、嫉妒、愤怒、怠惰、贪财、贪食、贪色；每层有鞭策德行的榜样与惩罚罪行的实例。山顶乐园中，但丁经历忘川与欧诺埃河，遗忘罪恶、记起善行。',
      '维吉尔象征理性和古典智慧，他能引导但丁直到乐园，却不能进入天堂，因为他未受洗。贝雅特丽齐象征启示与信仰，接替维吉尔成为向导。这一交接是全诗最重要的象征转折之一。',
      '本卷原文与英译来源同上：Gutenberg #1000 与 #1004，均属公有领域。中文提要与译诗为原创，依据原文与公版英译整理。',
      '阅读建议：注意每层炼狱的「鞭策」与「缰绳」——前者是德行的榜样，后者是罪行的警戒；二者构成但丁式的道德教育。'
    ]
  },
  {
    key: 'PARADISO',
    id: 'shenqu-tiantang',
    title: '神曲·天堂篇',
    subtitle: '但丁《神曲》三部曲之三 · 意大利原文 · Longfellow 公版英译 · 中文提要',
    file: 'zh-paradiso.json',
    order: 22,
    intro:
      '《天堂篇》共三十三歌。贝雅特丽齐引导但丁穿越九重天，直至净火天与三位一体的神视。天堂不再是惩罚与净化的空间，而是光、爱与知识的层级：月天、水星天、金星天、日天、火星天、木星天、土星天、恒星天、原动天。最后，圣伯尔纳代替贝雅特丽齐祈祷，但丁得以一窥神的面貌，却无法用语言表达。全诗以「爱推动太阳与群星」作结。',
    guide: [
      '《天堂篇》是三部中最抽象、神学最密集的一部。但丁把托勒密体系与基督教神学结合：九重天由天使推动，层层向上，速度与光愈增；最高处是净火天，超越时间与空间，蒙福者在此直观神。',
      '天堂中的灵魂并不真的住在各重天，而是按各自德行的等级向但丁显现；贝雅特丽齐解释，这是为了适应但丁有限的视觉。越往上，但丁的视力越强，最后必须由圣伯尔纳接替向导，因为理性与象征都已不足以承受神视。',
      '全诗结尾，但丁说自己的语言无力表达，记忆也跟不上；他看见「一光之中有三环」，又看见「人的形象」在光中，却无法解开这个谜。最后一行「l’amor che move il sole e l’altre stelle」——爱推动太阳与群星——把宇宙的秩序归结为爱。',
      '本卷原文与英译来源同上：Gutenberg #1000 与 #1004，均属公有领域。中文提要与译诗为原创，依据原文与公版英译整理。',
      '阅读建议：天堂篇的难点在神学与经院哲学。建议先读每歌提要，抓住人物与主题，再读原文；不必强求一次理解全部典故。'
    ]
  }
];

function groupLines(lines, size = 3) {
  const out = [];
  for (let i = 0; i < lines.length; i += size) {
    const chunk = lines.slice(i, i + size).map((line) => String(line || '').trim()).filter(Boolean);
    if (chunk.length) out.push(chunk.join('\n'));
  }
  return out;
}

function buildPart(part) {
  const zh = JSON.parse(fs.readFileSync(path.join(SRC, part.file), 'utf8'));
  const zhMap = new Map(zh.map((item) => [Number(item.canto), item]));
  const chapters = [];

  chapters.push({
    title: '卷首导读',
    paragraphs: part.guide
  });

  const list = cantos.filter((item) => item.part === part.key);
  for (const canto of list) {
    const info = zhMap.get(Number(canto.canto));
    if (!info) throw new Error(`${part.title} 第 ${canto.canto} 歌缺少中文提要`);
    const paragraphs = [];
    paragraphs.push(`【内容提要】${String(info.summary || '').trim()}`);
    if (Array.isArray(info.opening) && info.opening.length) {
      paragraphs.push(
        `【开篇三行】\n原文：\n${canto.it.slice(0, 3).join('\n')}\n译文：\n${info.opening.join('\n')}`
      );
    }
    if (info.keyline && info.keyline.it) {
      paragraphs.push(`【名句】\n原文：${info.keyline.it}\n译文：${info.keyline.zh}`);
    }
    paragraphs.push(`【意大利原文】\n${groupLines(canto.it).join('\n\n')}`);
    paragraphs.push(`【Longfellow 英译】\n${groupLines(canto.en).join('\n\n')}`);
    chapters.push({
      title: `第 ${canto.canto} 歌`,
      paragraphs
    });
  }

  const book = {
    schema: 1,
    id: part.id,
    title: part.title,
    subtitle: part.subtitle,
    author: '但丁·阿利吉耶里（Dante Alighieri）',
    era: '约 1307—1321 年',
    category: '世界',
    tags: ['神曲', '但丁', '三部曲', '意大利文', '公版英译', 'Longfellow'],
    intro: part.intro,
    script: 'simplified',
    type: 'text',
    cover: 'world',
    order: part.order,
    builtin: true,
    source: {
      provider: 'Project Gutenberg',
      files: ['#1000 La Divina Commedia', '#1004 The Divine Comedy (Longfellow)'],
      license: '原文与 1867 年 Longfellow 英译均属公有领域',
      note: '中文提要、开篇三行与名句译文为本项目原创；不收录现代中文全译本'
    },
    chapters,
    charCount: chapters.reduce(
      (sum, chapter) => sum + chapter.paragraphs.reduce((n, p) => n + util.countChars(p), 0),
      0
    ),
    addedAt: new Date().toISOString()
  };
  const out = path.join(library.BOOKS_DIR, `${part.id}.json`);
  util.writeJsonAtomic(out, book);
  console.log(`[dante] ${part.title}：${chapters.length} 章 / ${book.charCount} 字`);
  return book;
}

for (const part of PARTS) buildPart(part);
library.rebuildCatalog({ quiet: true });
console.log('[dante] 目录已重建');
