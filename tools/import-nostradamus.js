'use strict';

const fs = require('fs');
const path = require('path');
const { buildBook } = require('../lib/importers');
const util = require('../lib/util');
const library = require('../lib/library');

const SRC = path.join(__dirname, '..', '_work', 'nostradamus');
const OUT = path.join(library.BOOKS_DIR, 'zhushiji.json');

const CENTURY_TITLES = [
  '卷一 · 百年之始',
  '卷二 · 欧陆风云',
  '卷三 · 城邦与王冠',
  '卷四 · 兵戈与疫病',
  '卷五 · 海陆之间',
  '卷六 · 列国与征伐',
  '卷七 · 残卷四十二首',
  '卷八 · 王侯与城垣',
  '卷九 · 流亡与回归',
  '卷十 · 终末之幕'
];

const CENTURY_SUMMARIES = [
  '第一卷共一百首。诺查丹玛斯以深夜书房中的灵感开篇，随后转入法国、意大利与地中海世界的王侯、战争、瘟疫与天象。诗中大量使用拉丁语、普罗旺斯方言与隐喻，事件不按时间排列，同一首中常并置多个地域。',
  '第二卷共一百首。主题包括宗教冲突、围城、海战、逃亡与王位更替。部分诗行被后世解读为与法国宗教战争有关，但原文并未给出明确年代与姓名，任何对应都应视为解释而非文本自证。',
  '第三卷共一百首。视野扩展到地中海东部、意大利城邦与东方。诗中反复出现「东方」「大海」「列国」等意象，涉及贸易、舰队、瘟疫与帝国兴衰。',
  '第四卷共一百首。战争、瘟疫、饥荒与王权更替密集出现。诺查丹玛斯常以天体 conjunction（合相）和动物象征标记事件，读者应注意这些象征在其时代具有占星学含义，而非现代密码。',
  '第五卷共一百首。篇幅中多见海难、远征、教廷与地方诸侯的冲突。部分地名拼写与当时地图不一致，是版本传抄与作者有意隐晦共同造成的结果。',
  '第六卷共一百首。包含对意大利、西班牙、法国与北非的描写，也涉及使节、婚姻与继承。诗行常以「将有一位」「将看见」起句，语气含混，留下多种解释空间。',
  '第七卷仅存四十二首，是全书最明显的残卷。原计划每卷百首，但第七卷的手稿与刊本均不完整。本卷保留传世四十二首，另将后世刊本多出的六首列入附录，不与正卷混编。',
  '第八卷共一百首。主题包括王侯的兴衰、城邦的陷落、海战与宗教冲突。1672 年英译本在正卷后另附六首「旧刊异文」，本版将其列入附录，以保持正卷一百首的编号完整。',
  '第九卷共一百首。诗中出现大量地名与河流，涉及意大利、法国南部、西班牙与东方。部分诗行被后世与法国大革命、拿破仑战争相联系，但这些对应均建立在事后解释之上，文本本身没有断代。',
  '第十卷共一百首。全书以战争、洪水、天象与「终末」意象收束，但并未给出世界末日的确定日期。诺查丹玛斯在致亨利二世的书信中亦强调，预言的时间被有意遮蔽。'
];

const FRONT = [
  {
    title: '版本与翻译说明',
    paragraphs: [
      '本书正文为诺查丹玛斯《诸世纪》（Les Prophéties，又译《百诗集》）的法文原诗全本，共十卷、九百四十二首四行诗。原典取自 1672 年伦敦刊行的 Theophilus de Garencieres 英法对照本（Project Gutenberg 电子文本第 68907 号）。该版本的法文原诗与英译均属公有领域。',
      '正文每一首按「原文—译文」排列。法文保留 1672 年刊本的拼写、重音与古语，个别 OCR 讹字已据上下文校正；中文为本书据法文原诗重译的四行译诗，参考了 1672 年英译，但不是逐字直译的学术定本。遇古语、方言、专名难以确解处，译文以保留意象为主，并在必要处采用通行译名。',
      '1672 年刊本的编号有几处明显讹误：卷二第 77 与第 82 首重号，卷六第 20 与第 21 首重号，卷八第 19 与第 26 首重号，卷九第 46 与第 66 首重号。本版据诗序与传世抄本校定，使每卷编号连续；卷七仅存四十二首，卷八正卷一百首，正卷合计九百四十二首。',
      '1672 年刊本在正卷之后另收第七卷六首、第八卷六首「旧刊异文」。这些诗不见于 1568 年全集的正卷编号，本版列入书末附录，仅存法文原文，不混入正卷统计。',
      '本书不是占卜手册，也不主张任何一首诗已经「应验」。预言诗的解释高度依赖事后选择与语义滑动；同一首可以被套用于不同事件。请把本书当作十六世纪法国的文学、宗教与政治想象来读，而不是当作可验证的预测。'
    ]
  },
  {
    title: '诺查丹玛斯小传',
    paragraphs: [
      '米歇尔·德·诺斯特拉达姆（Michel de Nostredame，1503—1566），拉丁化名 Nostradamus，生于法国普罗旺斯圣雷米。祖父与父亲从事医学与贸易，他自幼学习拉丁语、希腊语与希伯来语，后入阿维尼翁大学与蒙彼利埃大学学医。',
      '1546 年普罗旺斯爆发鼠疫，他以医生身份参与救治，因反对当时流行的放血疗法、主张清洁与草药而获得名声。1555 年，他在里昂出版《诸世纪》初版，仅含前三卷与第五十三首；1557 年增补至七卷；1568 年，即他去世两年后，才出现包含十卷的全集。',
      '他曾在 1556 年应王后卡特琳·德·美第奇之召入宫，并为亨利二世留下著名的「年轻狮子击败年老狮子」四行诗。亨利二世 1559 年在比武中被长矛刺中眼部而死，这首诗因此被广泛传颂，也成为「诺查丹玛斯应验」叙事的起点。',
      '晚年他受痛风与水肿折磨，1566 年 7 月 2 日死于萨隆。他留下的作品还包括历书、医学著作与给儿子的书信。这些文本显示，他熟悉占星学、天使学与犹太—基督教启示传统，但其知识边界仍在十六世纪的自然哲学之内。'
    ]
  },
  {
    title: '如何阅读《诸世纪》',
    paragraphs: [
      '第一，注意「世纪」（centurie）在这里是「百首」之意，不是时间单位。每卷原则上收一百首四行诗，但第七卷仅存四十二首。诗与诗之间没有连续的叙事，也没有标明年代；把它们按时间排序，是后世编者与解读者的工作。',
      '第二，诺查丹玛斯的语言是刻意的多义。他混用法语、拉丁语、意大利语、普罗旺斯方言，使用占星术语、圣经典故、动物象征与地名变体。一个词可能同时指向人名、地名与物名；这种模糊性是文本的构造，而不是等待破译的密码。',
      '第三，警惕「事后应验」。当一首诗被说成预言了某场战争、某位领袖或某次灾难时，解释者通常已经知道结果，再从诗中挑选可以对应的词。真正的检验应看预言是否在事件发生前给出足够具体、可证伪的信息；《诸世纪》几乎从不满足这一条件。',
      '第四，可以把本书与《推背图》《烧饼歌》《乾坤万年歌》《格庵遗录》对读。它们共享一种「以隐语写历史」的文体传统：用象征、拆字、卦象与地名暗示王朝更替。比较它们的修辞策略，比争论哪一本更「准」更有意义。'
    ]
  }
];

function loadCentury(c) {
  const srcFile = path.join(SRC, `c${c}.json`);
  const zhFile = path.join(SRC, `zh-c${c}.json`);
  if (!fs.existsSync(zhFile)) throw new Error(`缺少中文译诗：${zhFile}`);
  const src = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  const zh = JSON.parse(fs.readFileSync(zhFile, 'utf8'));
  const zhMap = new Map(zh.map((item) => [Number(item.n), item.zh]));
  if (!Array.isArray(src) || !src.length) throw new Error(`源文件为空：${srcFile}`);
  return src.map((q) => {
    const lines = zhMap.get(Number(q.n));
    if (!Array.isArray(lines) || lines.length !== 4) {
      throw new Error(`第 ${c} 卷第 ${q.n} 首缺少四行译文`);
    }
    return {
      n: q.n,
      fr: q.fr,
      zh: lines.map((line) => String(line).trim())
    };
  });
}

function run() {
  const chapters = FRONT.map((item) => ({ title: item.title, paragraphs: item.paragraphs }));
  let total = 0;

  for (let c = 1; c <= 10; c += 1) {
    const quatrains = loadCentury(c);
    total += quatrains.length;
    const expected = c === 7 ? 42 : 100;
    if (quatrains.length !== expected) {
      throw new Error(`第 ${c} 卷首数异常：${quatrains.length}，应为 ${expected}`);
    }
    const paragraphs = [
      `${CENTURY_SUMMARIES[c - 1]}\n本卷收录第 1—${quatrains.length} 首。`
    ];
    for (const q of quatrains) {
      paragraphs.push(
        `第 ${q.n} 首\n原文：${q.fr.join('\n')}\n译文：${q.zh.join('\n')}`
      );
    }
    chapters.push({ title: CENTURY_TITLES[c - 1], paragraphs });
  }

  const appendixFile = path.join(SRC, 'appendix.json');
  if (fs.existsSync(appendixFile)) {
    const appendix = JSON.parse(fs.readFileSync(appendixFile, 'utf8'));
    if (appendix.length) {
      const paragraphs = [
        '以下十二首为 1672 年刊本在正卷之外收录的异文：第七卷六首、第八卷六首。它们不见于 1568 年全集的正卷编号，本版仅存法文原文，供版本研究参考。',
        ...appendix.map(
          (q) =>
            `第 ${q.century} 卷异文（编号 ${q.n}）\n原文：${(q.fr || []).join('\n')}`
        )
      ];
      chapters.push({ title: '附录 · 旧刊异文十二首', paragraphs });
    }
  }

  if (total !== 942) throw new Error(`正卷首数异常：${total}，应为 942`);

  const book = buildBook({
    id: 'zhushiji',
    title: '诸世纪',
    subtitle: '诺查丹玛斯预言集 · 法文原典全本 942 首 · 中文四行译诗',
    author: '米歇尔·德·诺斯特拉达姆（Nostradamus）',
    era: '1555 年初版 · 1568 年十卷全集',
    category: '预言',
    tags: ['诺查丹玛斯', '百诗集', '四行诗', '法文原典', '全本', '942首', '预言'],
    intro:
      '《诸世纪》（Les Prophéties）是法国医生、占星家诺查丹玛斯于十六世纪中叶写下的预言诗集。本书收录法文原诗十卷九百四十二首，每首四行，逐首附中文四行译诗；另附 1672 年刊本的十二首异文。原典与英译均属公有领域，中文译诗为本项目重译。预言诗语义多歧，本书主张把它们作为文学与历史文本阅读，不把事后附会当作应验。',
    script: 'simplified',
    type: 'text',
    cover: 'prophecy',
    order: 6,
    builtin: true,
    source: {
      provider: 'Les Prophéties（1672 年 Garencieres 英法对照本）',
      repo: 'Project Gutenberg #68907',
      file: '_work/nostradamus-garencieres-1672.txt',
      license: '法文原诗与 1672 年英译均属公有领域；中文译诗为本项目原创',
      note: '正卷 942 首；编号据诗序校正；卷七残卷 42 首；附录异文 12 首'
    },
    chapters
  });

  book.stats = { centuries: 10, quatrains: total, chineseTranslations: total };
  util.writeJsonAtomic(OUT, book);
  library.rebuildCatalog({ quiet: false });
  console.log(`[nostradamus] 完成：10 卷 / ${total} 首 / ${book.charCount} 字`);
  console.log(`[nostradamus] 已写入 ${OUT}`);
}

run();
