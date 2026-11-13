'use strict';

/**
 * 将和合本圣经（ChiUn，繁体）转为简体并生成 library/books/shengjing.json。
 * 数据源：scrollmapper/bible_databases 的 sources/zh-hant/ChiUn/ChiUn.json
 * 单一书籍、66 卷、全部章节与节，逐节收录，未删减。
 */

const fs = require('fs');
const path = require('path');

const { toSimplified } = require('../lib/importers');
const util = require('../lib/util');
const library = require('../lib/library');

const SOURCE = path.join(__dirname, '..', '_work', 'ChiUn.json');
const OUT = path.join(library.BOOKS_DIR, 'shengjing.json');

const META = [
  ['创世记', '旧约', '起初，神创造天地。记载创造、堕落、洪水与以色列先祖的故事。'],
  ['出埃及记', '旧约', '以色列人在埃及为奴，摩西带领出埃及，并在西奈山领受律法。'],
  ['利未记', '旧约', '祭司与献祭的条例，教导以色列人如何在圣洁中亲近神。'],
  ['民数记', '旧约', '旷野四十年漂泊的记载，包括两次人口统计与世代更替。'],
  ['申命记', '旧约', '摩西在摩押平原的三篇讲论，重申律法并嘱咐新一代守约。'],
  ['约书亚记', '旧约', '约书亚接续摩西，带领以色列人进入并分取应许之地。'],
  ['士师记', '旧约', '士师时代的循环：背约、受压迫、呼求、拯救。'],
  ['路得记', '旧约', '外邦女子路得因信归入以色列，成为大卫王的曾祖母。'],
  ['撒母耳记上', '旧约', '撒母耳、扫罗与大卫的兴起，王权在以色列建立。'],
  ['撒母耳记下', '旧约', '大卫作王、定都耶路撒冷，以及他犯罪与悔改的记载。'],
  ['列王纪上', '旧约', '所罗门建殿、王国分裂，以利亚在北国先知事奉。'],
  ['列王纪下', '旧约', '北国以色列与南国犹大的衰亡，以及耶路撒冷被毁。'],
  ['历代志上', '旧约', '从亚当到大卫的家谱与大卫王朝的敬拜制度。'],
  ['历代志下', '旧约', '所罗门建殿至被掳归回，以圣殿与敬拜为中心重述历史。'],
  ['以斯拉记', '旧约', '被掳归回后重建圣殿，以斯拉恢复律法教导。'],
  ['尼希米记', '旧约', '尼希米重建耶路撒冷城墙，百姓重新立约。'],
  ['以斯帖记', '旧约', '波斯宫廷中，以斯帖冒死拯救犹太人，设立普珥节。'],
  ['约伯记', '旧约', '义人约伯受苦，在辩论与神显现中认识神的主权。'],
  ['诗篇', '旧约', '一百五十篇祷词与诗歌，涵盖赞美、哀诉、悔罪与信靠。'],
  ['箴言', '旧约', '智慧格言集，教导敬畏神与日常生活中的明智。'],
  ['传道书', '旧约', '在虚空与劳苦中追问人生意义，归结为敬畏神、守祂诫命。'],
  ['雅歌', '旧约', '以爱情诗歌表达良人与佳偶之间炽热的爱与委身。'],
  ['以赛亚书', '旧约', '审判与安慰并重，预言弥赛亚与神的救恩临到万邦。'],
  ['耶利米书', '旧约', '先知耶利米在国破前夕呼喊悔改，宣告新约的应许。'],
  ['耶利米哀歌', '旧约', '耶路撒冷被毁后的五首哀歌，在苦难中仰望神的慈爱。'],
  ['以西结书', '旧约', '被掳中的异象与预言：神的荣耀离开又归回，枯骨复活。'],
  ['但以理书', '旧约', '但以理在巴比伦的忠诚与末世异象，宣告神掌管列国。'],
  ['何西阿书', '旧约', '先知以婚姻比喻神与以色列，呼唤背约之民回转。'],
  ['约珥书', '旧约', '蝗灾与耶和华的日子，应许圣灵浇灌凡有血气的。'],
  ['阿摩司书', '旧约', '向列国与以色列宣告公义审判，斥责宗教虚仪与欺压。'],
  ['俄巴底亚书', '旧约', '最短的旧约书卷，宣告以东因狂傲欺压雅各而受审判。'],
  ['约拿书', '旧约', '先知约拿逃避呼召，神却怜悯尼尼微全城。'],
  ['弥迦书', '旧约', '宣告审判与弥赛亚出自伯利恒，要求行公义、好怜悯。'],
  ['那鸿书', '旧约', '宣告尼尼微倾覆，显明耶和华是忌邪施报的神。'],
  ['哈巴谷书', '旧约', '先知与神对话，学习「义人因信得生」的功课。'],
  ['西番雅书', '旧约', '耶和华的日子临近，余民蒙保守，万民归向神。'],
  ['哈该书', '旧约', '呼吁被掳归回的百姓重建圣殿，应许神的同在。'],
  ['撒迦利亚书', '旧约', '一系列异象与预言，指向弥赛亚君王与洁净的泉源。'],
  ['玛拉基书', '旧约', '旧约最后一卷，责备祭司与百姓，预言立约的使者来到。'],
  ['马太福音', '新约', '耶稣是应许的弥赛亚君王，天国福音临到万民。'],
  ['马可福音', '新约', '以简洁有力的笔触记述耶稣作为受苦仆人的事奉。'],
  ['路加福音', '新约', '路加的详细考据，呈现耶稣是罪人与外邦人的救主。'],
  ['约翰福音', '新约', '道成肉身的耶稣，七大神迹与「我是」宣告，叫人因信得生命。'],
  ['使徒行传', '新约', '圣灵降临，福音从耶路撒冷传到罗马，教会建立与扩展。'],
  ['罗马书', '新约', '系统阐述因信称义、罪与恩典、以色列与万民的救恩。'],
  ['哥林多前书', '新约', '回应教会纷争与道德问题，阐述十字架与复活的福音。'],
  ['哥林多后书', '新约', '保罗为职分辩护，在软弱中显明基督的能力与恩典。'],
  ['加拉太书', '新约', '因信称义而非靠律法，在基督里得自由。'],
  ['以弗所书', '新约', '教会是基督的身体，在基督里合一同归于一。'],
  ['腓立比书', '新约', '在捆锁中仍然喜乐，以基督的心彼此相顾。'],
  ['歌罗西书', '新约', '基督是万有之首，信徒在祂里面得完全。'],
  ['帖撒罗尼迦前书', '新约', '劝勉圣洁生活，安慰并教导主再来的盼望。'],
  ['帖撒罗尼迦后书', '新约', '澄清主再来的次序，勉励坚守真理、勤勉做工。'],
  ['提摩太前书', '新约', '教会治理与牧养指引，持守纯正教义。'],
  ['提摩太后书', '新约', '保罗临终嘱咐提摩太忠心传道，打完美好的仗。'],
  ['提多书', '新约', '在各城设立长老，教导敬虔生活与纯正教训。'],
  ['腓利门书', '新约', '保罗为逃跑归主的奴仆阿尼西母求情，请求收纳如弟兄。'],
  ['希伯来书', '新约', '基督超越天使、摩西与旧约祭，是更美之约的中保。'],
  ['雅各书', '新约', '信心若没有行为就是死的，教导生活中的智慧与忍耐。'],
  ['彼得前书', '新约', '在试炼中的盼望，信徒是蒙拣选的族类、君尊的祭司。'],
  ['彼得后书', '新约', '防备假教师，在应许上长进，等候主的日子。'],
  ['约翰一书', '新约', '神就是光、就是爱，信徒彼此相爱并在真理中确信永生。'],
  ['约翰二书', '新约', '劝勉在真理与爱中行事，不要接待假教师。'],
  ['约翰三书', '新约', '称赞该犹接待客旅，责备丢特腓好为首。'],
  ['犹大书', '新约', '为真道力争，警戒背道者，将信徒交托给能保守他们的神。'],
  ['启示录', '新约', '给七教会的书信与末世异象，终局是神与人同住、万有更新。']
];

function verseText(raw) {
  const simplified = toSimplified(String(raw || ''));
  return normalizeSpaces(simplified);
}

function normalizeSpaces(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/([\u3400-\u9FFF\uF900-\uFAFF])[ \t]+([，。；：！？、」』）》])/g, '$1$2')
    .replace(/([，。；：！？、」』）》])[ \t]+(?=[\u3400-\u9FFF\uF900-\uFAFF「『（《])/g, '$1')
    .replace(/([\u3400-\u9FFF\uF900-\uFAFF])[ \t]+(?=[\u3400-\u9FFF\uF900-\uFAFF])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function run() {
  const data = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  if (!Array.isArray(data.books) || data.books.length !== 66) {
    throw new Error(`圣经卷数异常：${data.books?.length}，应为 66`);
  }
  if (META.length !== 66) throw new Error(`中文卷名映射数量异常：${META.length}`);

  const chapters = [];
  let verseTotal = 0;
  data.books.forEach((book, bookIndex) => {
    const [cnName, testament] = META[bookIndex];
    const expected = book.name;
    if (!Array.isArray(book.chapters) || !book.chapters.length) {
      throw new Error(`《${expected}》没有章节`);
    }
    book.chapters.forEach((chapter, chapterIndex) => {
      const verses = (chapter.verses || []).map((verse, index) => ({
        n: Number(verse.verse) || index + 1,
        text: verseText(verse.text)
      }));
      if (!verses.length) throw new Error(`《${cnName}》第 ${chapterIndex + 1} 章没有经文`);
      verseTotal += verses.length;
      chapters.push({
        book: cnName,
        testament,
        chapter: Number(chapter.chapter) || chapterIndex + 1,
        title: `第 ${Number(chapter.chapter) || chapterIndex + 1} 章`,
        verses
      });
    });
    console.log(`[bible] ${cnName}（${expected}）${book.chapters.length} 章`);
  });

  if (chapters.length !== 1189) throw new Error(`章节总数异常：${chapters.length}，应为 1,189`);
  if (verseTotal < 30000) throw new Error(`节数异常：${verseTotal}`);

  const charCount = chapters.reduce(
    (sum, chapter) => sum + chapter.verses.reduce((n, verse) => n + verse.text.replace(/\s/g, '').length, 0),
    0
  );

  const book = {
    schema: 1,
    id: 'shengjing',
    title: '圣经',
    subtitle: '和合本 · 新旧约全书 66 卷',
    author: '摩西、大卫、保罗、约翰等',
    era: '约公元前 1500 年 — 公元 95 年',
    category: '圣经',
    tags: ['和合本', '旧约', '新约', '全本', '66卷', '1189章'],
    intro:
      '本版为和合本（Chinese Union Version）新旧约全书：66 卷、1,189 章、31,104 节，逐卷逐章逐节完整收录，未删减、未节选。正文转为简体中文，保留经文编号。旧约 39 卷、新约 27 卷，按圣经传统次序排列。',
    script: 'simplified',
    type: 'bible',
    cover: 'bible',
    order: 5,
    builtin: true,
    source: {
      provider: '和合本圣经（Chinese Union Version）',
      repo: 'scrollmapper/bible_databases',
      file: 'sources/zh-hant/ChiUn/ChiUn.json',
      license: '和合本于 1919 年出版，已进入公有领域；本程序完整收录 66 卷正文',
      note: '仅做繁转简与空白整理，不改动经文内容与次序'
    },
    chapters,
    charCount,
    addedAt: new Date().toISOString(),
    stats: {
      books: 66,
      chapters: chapters.length,
      verses: verseTotal
    }
  };

  util.writeJsonAtomic(OUT, book);
  console.log(`\n[bible] 完成：66 卷 / ${chapters.length} 章 / ${verseTotal} 节 / ${charCount} 字`);
  console.log(`[bible] 已写入 ${OUT}`);
}

run();
