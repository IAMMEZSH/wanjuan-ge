# 万卷阁 · 书目与公版来源

版本 1.0.0 · 更新日期 2026-11-13

本清单说明万卷阁内置 143 部典籍的底本、仓库编号、许可与已知限制。程序只收录**已进入公有领域的原文**或**本项目原创的导读/译文**，不包含现代出版社的排印、标点、校注、白话译本或版权译本；现代版权作品（侦探小说、漫画等）一律只提供原创导读，不收录正文。

> 书目会随版本变化。运行 `npm run index` 后，`library/catalog.json` 中的 `source` 字段是最准确的机器可读来源；本文件为人工整理说明。

---

## 一、来源汇总

| 来源 | 部数 | 许可与说明 |
| --- | ---: | --- |
| [Kanripo 汉籍全文仓库](https://github.com/kanripo)（[kanripo.org](https://www.kanripo.org/)） | 101 | 原典属公有领域；数字化文本由 Kanripo 社群整理。再分发请保留仓库编号（如 `KR1a0001`）与来源说明，具体许可与引用格式以各仓库为准。 |
| 和合本圣经（Chinese Union Version, 1919） | 1 | 1919 年版已进入公有领域。底本来自 `scrollmapper/bible_databases` 的 `sources/zh-hant/ChiUn/ChiUn.json`；本项目仅做繁转简与空白整理，不改动经文内容与次序。 |
| 死海古卷（Dead Sea Scrolls） | 1 | 古卷原典属公有领域；80 章中文译述、导读与注释为本项目原创，依据学界通行校勘本的结构与内容整理，不复制现代译本原句。 |
| Project Gutenberg | 4 | 《神曲》使用 #1000（意文）与 #1004（Longfellow 1867 英译）；《诸世纪》使用 #68907（1672 年 Garencieres 英法对照本）。原文与旧译本均属公有领域。 |
| Papyrus of Ani（大英博物馆 EA10470） | 1 | 布奇（E. A. Wallis Budge）1895/1913 年译本属公有领域；中文译文、导读、术语表与年表为本项目原创。**仅选译十二篇，非全本**。 |
| Culdian Trust / Your Own World Books | 1 | 原书正文、编者导言与英文译文均受版权保护。本书**仅为原创中文导读，不含正文摘录与节译**。 |
| [kansini/tuibeitu](https://github.com/kansini/tuibeitu)（MIT） | 1 | 《推背图》原典属公有领域；仅收录诗文与卦象，未收录插图。 |
| 本项目原创中文导读 | 3 | 希腊罗马神话、世界文明与遗址百科、伊索寓言。中文重述、年表与导读为本项目原创，不复制现代受版权保护的译本。 |
| 万卷阁原创导读 | 6 | 三十六计、奇门遁甲、烧饼歌、乾坤万年歌、连山易、归藏易。原创整理部分采用 MIT 许可，引用的古籍原文属公有领域。 |
| 韩国国立中央图书馆藏本系统（正见网连载本、破解系列、人民网转载本等） | 1 | 《格庵遗录》古籍原文属公有领域；六十篇通行本全文按上述底本互校整理，坏字校补、阙文以“□”存记。 |
| 公版侦探小说底本（Project Gutenberg 等） | 2 | 福尔摩斯探案全集、爱伦·坡侦探与恐怖小说集；英文原作属公有领域，中文译述为本项目原创。 |
| 公有领域怪谈与恐怖作品 | 3 | 日本怪谈百物语（据小泉八云等公版材料改写）、世界恐怖小说经典、克苏鲁神话；中文译述/改写为本项目原创。 |
| 本项目原创导读（现代版权作品） | 6 | 十宗罪、埃勒里·奎因、东野圭吾、世界侦探小说史与名著导读、DC 漫画宇宙、漫威漫画宇宙。均为原创导读，不收录原著正文、画面、台词与情节原文转述。 |

合计 **143 部**。

---

## 二、逐书清单

### 圣经（2 部）

| 书名 | 作者/传统 | 底本与编号 | 备注 |
| --- | --- | --- | --- |
| 圣经 | 摩西、大卫、保罗、约翰等 | `scrollmapper/bible_databases` · `sources/zh-hant/ChiUn/ChiUn.json` | 和合本 66 卷、1,189 章、31,104 节；不含次经；仅繁转简。 |

| 死海古卷 | 库姆兰社团（传统归属） | 库姆兰古卷（Dead Sea Scrolls） | 80 章中文译述；依据通行校勘本结构整理，非学术校勘本。 |
### 经部（14 部）

| 书名 | 作者/传统 | 底本与编号 | 备注 |
| --- | --- | --- | --- |
| 周易 | 佚名 | [KR1a0001](https://github.com/kanripo/KR1a0001) | 白文，含卦爻辞与易传。 |
| 尚书 | 佚名 | [KR1b0001](https://github.com/kanripo/KR1b0001) | 白文。 |
| 诗经 | 佚名 | [KR1c0001](https://github.com/kanripo/KR1c0001) | 毛诗白文。 |
| 周礼 | 佚名 | [KR1d0001](https://github.com/kanripo/KR1d0001) | 白文。 |
| 仪礼 | 佚名（郑玄 注） | [KR1d0026](https://github.com/kanripo/KR1d0026) | 含注文。 |
| 礼记 | 佚名 | [KR1d0052](https://github.com/kanripo/KR1d0052) | 白文。 |
| 春秋左传 | 左丘明（传） | [KR1e0001](https://github.com/kanripo/KR1e0001) | 白文。 |
| 孝经 | 佚名 | [KR1f0001](https://github.com/kanripo/KR1f0001) | 白文。 |
| 论语 | 孔子弟子及再传弟子 | [KR1h0004](https://github.com/kanripo/KR1h0004) | 白文。 |
| 孟子 | 孟子及其弟子 | [KR1h0001](https://github.com/kanripo/KR1h0001) | 白文。 |
| 四书章句集注 | 朱熹 | [KR1h0015](https://github.com/kanripo/KR1h0015) | 含朱熹集注。 |
| 尔雅 | 佚名（郭璞 注） | [KR1j0002](https://github.com/kanripo/KR1j0002) | 含注文。 |
| 连山易 | 佚名 | 万卷阁原创导读 | 原书早佚；仅存辑佚与转引，不伪造全文。 |
| 归藏易 | 佚名 | 万卷阁原创导读 | 原书早佚；仅存辑佚与转引，不伪造全文。 |

### 史部（6 部）

| 书名 | 作者 | 底本与编号 | 备注 |
| --- | --- | --- | --- |
| 史记 | 司马迁 | [KR2a0001](https://github.com/kanripo/KR2a0001) | 底本按大卷切分，篇级目录待细化。 |
| 汉书 | 班固 | [KR2a0007](https://github.com/kanripo/KR2a0007) | 白文。 |
| 后汉书 | 范晔 | [KR2a0009](https://github.com/kanripo/KR2a0009) | 白文。 |
| 三国志 | 陈寿 | [KR2a0012](https://github.com/kanripo/KR2a0012) | 白文。 |
| 资治通鉴 | 司马光 | [KR2b0007](https://github.com/kanripo/KR2b0007) | 篇幅极大，首次打开较慢。 |
| 战国策 | 刘向 编 | [KR2e0003](https://github.com/kanripo/KR2e0003) | 白文。 |

### 子部（51 部）

| 书名 | 作者/传统 | 底本与编号 | 备注 |
| --- | --- | --- | --- |
| 荀子 | 荀况 | [KR3a0002](https://github.com/kanripo/KR3a0002) | 白文。 |
| 墨子 | 墨翟及其后学 | [KR3j0002](https://github.com/kanripo/KR3j0002) | 白文。 |
| 韩非子 | 韩非 | [KR3c0005](https://github.com/kanripo/KR3c0005) | 白文。 |
| 淮南子 | 刘安 等 | [KR3j0010](https://github.com/kanripo/KR3j0010) | 白文。 |
| 鬼谷子 | 鬼谷子（传） | [KR3j0008](https://github.com/kanripo/KR3j0008) | 白文。 |
| 孙子兵法 | 孙武 | [KR3b0003](https://github.com/kanripo/KR3b0003) | 白文。 |
| 吴子 | 吴起 | [KR3b0004](https://github.com/kanripo/KR3b0004) | 白文。 |
| 司马法 | 司马穰苴（传） | [KR3b0005](https://github.com/kanripo/KR3b0005) | 白文。 |
| 尉缭子 | 尉缭 | [KR3b0006](https://github.com/kanripo/KR3b0006) | 白文。 |
| 六韬 | 吕望（传） | [KR3b0002](https://github.com/kanripo/KR3b0002) | 按 6 卷切分。 |
| 黄石公素书 | 黄石公（传） | [KR3b0009](https://github.com/kanripo/KR3b0009) | 白文。 |
| 山海经 | 佚名 | [KR3l0090](https://github.com/kanripo/KR3l0090) | 白文。 |
| 黄帝内经素问 | 佚名（王冰 注） | [KR3e0001](https://github.com/kanripo/KR3e0001) | 含王冰注。 |
| 难经本义 | 滑寿 | [KR3e0004](https://github.com/kanripo/KR3e0004) | 含注。 |
| 伤寒论注释 | 张机（成无己 注） | [KR3e0008](https://github.com/kanripo/KR3e0008) | 含成无己注。 |
| 神农本草经疏 | 缪希雍 | [KR3e0084](https://github.com/kanripo/KR3e0084) | 含疏文。 |
| 三十六计 | 佚名 | 万卷阁原创导读 | 原文属公有领域；分类与说明为本项目原创。 |

| 管子 | 管仲及稷下学者 | [KR3c0001](https://github.com/kanripo/KR3c0001) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 邓析子 | 邓析 | [KR3c0003](https://github.com/kanripo/KR3c0003) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 商君书 | 商鞅及其后学 | [KR3c0004](https://github.com/kanripo/KR3c0004) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 鬻子 | 鬻熊 | [KR3j0001](https://github.com/kanripo/KR3j0001) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 子华子 | 程本 | [KR3j0003](https://github.com/kanripo/KR3j0003) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 尹文子 | 尹文 | [KR3j0004](https://github.com/kanripo/KR3j0004) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 慎子 | 慎到 | [KR3j0005](https://github.com/kanripo/KR3j0005) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 鹖冠子 | 鹖冠子 | [KR3j0006](https://github.com/kanripo/KR3j0006) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 公孙龙子 | 公孙龙 | [KR3j0007](https://github.com/kanripo/KR3j0007) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 吕氏春秋 | 吕不韦及门客 | [KR3j0009](https://github.com/kanripo/KR3j0009) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 人物志 | 刘劭 | [KR3j0011](https://github.com/kanripo/KR3j0011) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 刘子 | 刘昼 | [KR3j0013](https://github.com/kanripo/KR3j0013) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 颜氏家训 | 颜之推 | [KR3j0014](https://github.com/kanripo/KR3j0014) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 日知录 | 顾炎武 | [KR3j0070](https://github.com/kanripo/KR3j0070) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 论衡 | 王充 | [KR3j0080](https://github.com/kanripo/KR3j0080) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 说苑 | 刘向 | [KR3a0007](https://github.com/kanripo/KR3a0007) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 新序 | 刘向 | [KR3a0008](https://github.com/kanripo/KR3a0008) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 法言 | 扬雄 | [KR3a0009](https://github.com/kanripo/KR3a0009) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 中说 | 王通 | [KR3a0014](https://github.com/kanripo/KR3a0014) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 晏子春秋 | 晏婴及后学 | [KR2g0003](https://github.com/kanripo/KR2g0003) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 长短经 | 赵蕤 | [KR3j0015](https://github.com/kanripo/KR3j0015) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 黄石公三略 | 黄石公（传） | [KR3b0007](https://github.com/kanripo/KR3b0007) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 李卫公问对 | 李靖（传） | [KR3b0010](https://github.com/kanripo/KR3b0010) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 太白阴经 | 李筌 | [KR3b0011](https://github.com/kanripo/KR3b0011) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 虎钤经 | 许洞 | [KR3b0013](https://github.com/kanripo/KR3b0013) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 纪效新书 | 戚继光 | [KR3b0019](https://github.com/kanripo/KR3b0019) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 练兵实纪 | 戚继光 | [KR3b0020](https://github.com/kanripo/KR3b0020) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 武经总要 | 曾公亮等 | [KR3b0012](https://github.com/kanripo/KR3b0012) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 守城录 | 陈规 | [KR3b0015](https://github.com/kanripo/KR3b0015) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 何博士备论 | 何去非 | [KR3b0014](https://github.com/kanripo/KR3b0014) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 齐民要术 | 贾思勰 | [KR3d0001](https://github.com/kanripo/KR3d0001) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 世说新语 | 刘义庆 | [KR3l0002](https://github.com/kanripo/KR3l0002) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 搜神记 | 干宝 | [KR3l0099](https://github.com/kanripo/KR3l0099) | Kanripo 底本，白文或旧注，以仓库为准。 |
| 博物志 | 张华 | [KR3l0123](https://github.com/kanripo/KR3l0123) | Kanripo 底本，白文或旧注，以仓库为准。 |
### 道部（17 部）

| 书名 | 作者/传统 | 底本与编号 | 备注 |
| --- | --- | --- | --- |
| 道德经 | 老子 | [KR5c0057](https://github.com/kanripo/KR5c0057) | 白文。 |
| 庄子 | 庄周及其后学 | [KR5c0126](https://github.com/kanripo/KR5c0126) | 白文。 |
| 列子 | 列御寇（传） | [KR5c0124](https://github.com/kanripo/KR5c0124) | 白文。 |
| 黄帝阴符经 | 佚名 | [KR5a0031](https://github.com/kanripo/KR5a0031) | 白文。 |
| 太上黄庭内景玉经 | 佚名 | [KR5b0015](https://github.com/kanripo/KR5b0015) | 白文。 |
| 太上老君说常清静经 | 佚名（李道纯 注） | [KR5c0151](https://github.com/kanripo/KR5c0151) | 含注。 |
| 太上玄灵北斗本命延生真经 | 佚名 | [KR5c0003](https://github.com/kanripo/KR5c0003) | 白文。 |
| 元始天尊说三官宝号经 | 佚名 | [KR5a0071](https://github.com/kanripo/KR5a0071) | 白文。 |
| 高上玉皇本行集经 | 佚名 | [KR5a0010](https://github.com/kanripo/KR5a0010) | 白文。 |
| 灵宝无量度人上品妙经 | 佚名 | [KR5a0001](https://github.com/kanripo/KR5a0001) | 白文。 |
| 太上感应篇 | 佚名（李昌龄 传） | [KR5f0001](https://github.com/kanripo/KR5f0001) | 含传。 |
| 文昌帝君阴骘文 | 佚名 | [KR5i0087](https://github.com/kanripo/KR5i0087) | 白文。 |
| 关圣帝君觉世真经 | 佚名 | [KR5i0088](https://github.com/kanripo/KR5i0088) | 白文。 |
| 抱朴子内篇 | 葛洪 | [KR5f0019](https://github.com/kanripo/KR5f0019) | 白文。 |
| 周易参同契 | 魏伯阳 | [KR5d0016](https://github.com/kanripo/KR5d0016) | 白文。 |
| 悟真篇注释 | 张伯端 | [KR5a0146](https://github.com/kanripo/KR5a0146) | 含注。 |

| 抱朴子外篇 | 葛洪 | [KR5f0021](https://github.com/kanripo/KR5f0021) | Kanripo 底本，白文或旧注，以仓库为准。 |
### 释部（16 部）

| 书名 | 译者/作者 | 底本与编号 | 备注 |
| --- | --- | --- | --- |
| 般若波罗蜜多心经 | 玄奘 译 | [KR6c0128](https://github.com/kanripo/KR6c0128) | 白文。 |
| 金刚般若波罗蜜经 | 鸠摩罗什 译 | [KR6c0023](https://github.com/kanripo/KR6c0023) | 白文。 |
| 妙法莲华经 | 鸠摩罗什 译 | [KR6d0001](https://github.com/kanripo/KR6d0001) | 白文。 |
| 大方广佛华严经 | 佛陀跋陀罗 译 | [KR6e0001](https://github.com/kanripo/KR6e0001) | 白文。 |
| 大佛顶首楞严经 | 般剌蜜帝 译 | [KR6j0118](https://github.com/kanripo/KR6j0118) | 白文。 |
| 地藏菩萨本愿经 | 实叉难陀 译 | [KR6h0016](https://github.com/kanripo/KR6h0016) | 白文。 |
| 佛说阿弥陀经 | 鸠摩罗什 译 | [KR6f0082](https://github.com/kanripo/KR6f0082) | 白文。 |
| 佛说无量寿经 | 康僧铠 译 | [KR6f0060](https://github.com/kanripo/KR6f0060) | 白文。 |
| 佛说观无量寿佛经 | 畺良耶舍 译 | [KR6f0071](https://github.com/kanripo/KR6f0071) | 白文。 |
| 维摩诘所说经 | 鸠摩罗什 译 | [KR6i0076](https://github.com/kanripo/KR6i0076) | 白文。 |
| 六祖大师法宝坛经 | 惠能（宗宝 编） | [KR6q0083](https://github.com/kanripo/KR6q0083) | 宗宝本。 |
| 大方广圆觉修多罗了义经 | 佛陀多罗 译 | [KR6i0551](https://github.com/kanripo/KR6i0551) | 白文。 |
| 梵网经 | 鸠摩罗什 译 | [KR6k0076](https://github.com/kanripo/KR6k0076) | 白文。 |
| 千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼经 | 伽梵达摩 译 | [KR6j0260](https://github.com/kanripo/KR6j0260) | 白文。 |
| 拔一切业障根本得生净土神咒 | 求那跋陀罗 译 | [KR6f0094](https://github.com/kanripo/KR6f0094) | 白文。 |

| 弘明集 | 僧祐 | [KR6r0137](https://github.com/kanripo/KR6r0137) | Kanripo 底本，白文或旧注，以仓库为准。 |
### 世界（20 部）

| 书名 | 作者 | 底本 | 备注 |
| --- | --- | --- | --- |
| 神曲·地狱篇 | 但丁·阿利吉耶里 | Project Gutenberg [#1000](https://www.gutenberg.org/ebooks/1000) / [#1004](https://www.gutenberg.org/ebooks/1004) | 含 1867 年 Longfellow 英译；中文提要与名句译文为本项目原创，不收录现代中文全译本。 |
| 神曲·炼狱篇 | 但丁·阿利吉耶里 | 同上 | 同上。 |
| 神曲·天堂篇 | 但丁·阿利吉耶里 | 同上 | 同上。 |
| 埃及死者之书 | 古埃及祭司与书吏（传统归属） | E. A. Wallis Budge, *The Papyrus of Ani*（1895）与 *The Book of the Dead*（1913），大英博物馆 EA10470 | 公有领域英译；中文译文、导读、术语表、年表为本项目原创。**选译十二篇，非全本**，不是学术校勘本。 |
| 柯尔布林圣经 | Culdian Trust 传统（现代整理本） | Culdian Trust / Your Own World Books | 原书正文、编者导言与英文译文均受版权保护；本书**仅为原创中文导读，不含正文摘录与节译**。传说性内容以“据其传承说法”“整理者声称”标示。 |
| 所罗门书 | 本书编写组 | Project Gutenberg / Internet Archive 公版文本 | 1898 年英译已进入公有领域；中文导读与整理为本项目原创。 |
| 所罗门大钥匙 | S. L. MacGregor Mathers（英译）· 本书中文导读书写 | Internet Archive 扫描本（Mathers 1889 英译） | 1889 年英译本已进入公有领域；中文导读书写为本项目原创。 |
| 所罗门小钥匙 | S. L. MacGregor Mathers（英译）· Aleister Crowley（编）· 本书中文导读书写 | Project Gutenberg [#72679](https://www.gutenberg.org/ebooks/72679) | 1904 年英译与 1916 年重印本均属公有领域；中文导读书写为本项目原创。 |
| 威卡与西方神秘学 | 本书编写组 | Project Gutenberg / Internet Archive 公版文本 | 上述底本均已进入公有领域；综述与导读为本项目原创。 |
| 驱魔者手册与罗马礼书 | 本书编写组 | Internet Archive 扫描本（Rituale Romanum, 1886 印本） | 1886 年印本已进入公有领域；中文整理与说明为本项目原创。 |
| 大天使罗杰爱尔之书 | 本书编写组 | 公版希伯来文印本与公开学术研究 | 1701 年印本已进入公有领域；中文导读为本项目原创。 |
| 天阶序论 | 伪狄奥尼修斯 著 · 本书中文译述 | Project Gutenberg / Internet Archive 公版英译 | 1897 年英译已进入公有领域；中文译述为本项目原创。 |
| 希腊罗马神话 | 本书编写组 | 本项目原创中文导读 | 中文重述/导读；不复制现代受版权保护的译本。 |
| 埃及神话 | 本书编写组 | 本项目原创中文导读 | 中文重述/导读；不复制现代受版权保护的译本。 |
| 世界文明与遗址百科 | 本书编写组 | 本项目原创中文导读 | 中文重述/导读；不复制现代受版权保护的译本。 |
| 人类文明发展史 | 本书编写组 | 本项目原创中文导读 | 中文综述/导读；不复制现代受版权保护的译本。 |
| 心理罪全系列导读 | 本书编写组 | 现代版权作品（雷米《心理罪》系列） | 本册为原创导读，不收录、不转述原著正文；请购买正版原著。 |
| 伊索寓言 | 伊索（传）· 本书中文重述 | 本项目原创中文导读 | 中文重述/导读；不复制现代受版权保护的译本。 |
| 格林童话 | 雅各布·格林、威廉·格林 · 本书中文重述 | 本项目原创中文导读 | 中文重述/导读；不复制现代受版权保护的译本。 |
| 安徒生童话 | 汉斯·克里斯蒂安·安徒生 · 本书中文重述 | 本项目原创中文导读 | 中文重述/导读；不复制现代受版权保护的译本。 |
### 预言（5 部）

| 书名 | 作者/传统 | 底本 | 备注 |
| --- | --- | --- | --- |
| 诸世纪 | 米歇尔·德·诺斯特拉达姆 | Project Gutenberg [#68907](https://www.gutenberg.org/ebooks/68907)，1672 年 Garencieres 英法对照本 | 正卷 942 首，卷七残卷 42 首，附录异文 12 首；中文译诗为本项目原创。 |
| 推背图 | 传 李淳风、袁天罡 | [kansini/tuibeitu](https://github.com/kansini/tuibeitu)（MIT） | 仅收录诗文与卦象，未收录插图。 |
| 烧饼歌 | 传 刘伯温 | 万卷阁原创导读 | 原文属公有领域；成书年代有争议，导读中说明。 |
| 乾坤万年歌 | 传 姜太公 | 万卷阁原创导读 | 同上。 |
| 格庵遗录 | 传 南师古 | 韩国国立中央图书馆藏本系统：古1496 笔写本系列、1977 赵成基本（太宗出版社）、1987 辛侑承解读本（世宗出版社，372 页） | 六十篇通行本全文；以正见网连载为底本、同站破解系列互校，人民网转载本等第三方全文补正坏字与缺段；不可复原之字以“□”存阙；学界多视为后人依托之作，争议见导读。 |

### 术数（1 部）

| 书名 | 作者/传统 | 底本 | 备注 |
| --- | --- | --- | --- |
| 奇门遁甲 | 佚名（传统托名黄帝、姜太公、张良） | 万卷阁原创导读 | 排盘、术语与导读为本项目原创整理；不宣称预测效力。 |

### 侦探（6 部）

| 书名 | 作者 | 底本 | 备注 |
| --- | --- | --- | --- |
| 福尔摩斯探案全集 | 阿瑟·柯南·道尔（原著）· 本书中文译述 | Project Gutenberg 公版英文底本（#244、#2097、#2852、#3289、#108 等） | 英文原作已进入公有领域；中文译述为本项目原创。 |
| 爱伦·坡侦探与恐怖小说集 | 埃德加·爱伦·坡（原著）· 本书中文译述 | Project Gutenberg #2148—#2151（The Works of Edgar Allan Poe） | 原作属公有领域；中文译述为本项目原创。 |
| 世界侦探小说史与名著导读 | 本书编写组（原创导读） | 本项目原创导读 | 原创导读；不收录受版权保护的作品内容。 |
| 十宗罪全系列导读 | 本书编写组（原创导读） | 现代版权作品（蜘蛛《十宗罪》系列） | 本册为原创导读，不收录、不转述原著正文；请购买正版原著。 |
| 埃勒里·奎因侦探小说导读 | 本书编写组（原创导读） | 埃勒里·奎因（弗雷德里克·丹奈与曼弗雷德·李）原作 | 本册为原创导读，不收录、不转述原著正文。 |
| 东野圭吾小说导读 | 本书编写组（原创导读） | 现代版权作品（东野圭吾） | 本册为原创导读，不收录、不转述原著正文。 |

### 怪谈（3 部）

| 书名 | 作者 | 底本 | 备注 |
| --- | --- | --- | --- |
| 日本怪谈百物语 | 本书编写组（据日本怪谈传统改写） | 小泉八云《怪谈》（1904）、上田秋成《雨月物语》、浅井了意《伽婢子》、根岸镇卫《耳囊》、鹤屋南北《东海道四谷怪谈》等 | 据公有领域材料原创改写。 |
| 世界恐怖小说经典 | 本书编写组（据公版原作译述） | Project Gutenberg 与公有领域原作（作者逝世超过七十年，或作品发表于 1929 年前） | 原作属公有领域；中文译述为本项目原创。 |
| 克苏鲁神话 | H.P. 洛夫克拉夫特（原著）· 本书中文译述 | H.P. 洛夫克拉夫特原作（逝世于 1937 年，已进入公有领域） | 原作属公有领域；中文译述为本项目原创。《玄君七章秘经》为网络伪经，仅作原创导读与原创仿作。 |

### 漫画（2 部）

| 书名 | 作者 | 底本 | 备注 |
| --- | --- | --- | --- |
| DC 漫画宇宙导读 | 万卷阁编写组 | 现代版权作品（DC Comics / 华纳兄弟） | 本册为万卷阁原创导读，不收录漫画原文、画面、台词与情节原文转述；原著请通过正版渠道阅读。 |
| 漫威漫画宇宙导读 | 万卷阁编写组 | 现代版权作品（Marvel Comics / 迪士尼） | 本册为万卷阁原创导读，不收录漫画原文、画面、台词与情节原文转述；原著请通过正版渠道阅读。 |

---

## 三、已知限制与编辑原则

1. **不伪造全文**：连山易、归藏易等佚书只存辑佚与转引；烧饼歌等托名文献在导读中交代争议，不补写“原文”；《格庵遗录》六十篇按通行本系统互校整理并完整收录，真伪与版本争议在导读与“本版说明”中交代。
2. **不做现代校勘**：Kanripo 底本为白文或旧注，未经本项目重新校勘；异体字、繁简与分段保留底本面貌。
3. **不内置版权译本**：需要现代注释或权威今译时，请自行购买或导入合法文本；程序的“在线翻译”只是机器译文，不能替代权威译本。
4. **圣经范围**：和合本仅新教正典 66 卷，次经/旁经不在其中；《死海古卷》是独立的第二圣殿时期文献译述，不属于这 66 卷正典。
5. **埃及死者之书**：选译十二篇，不是全本；布奇译本带有 19 世纪埃及学背景，术语与转写不代表当代学界共识。
6. **死海古卷**：80 章为中文译述与导读，按通行校勘本结构整理，残缺处以省略号标注；不是学术校勘本，也不替代专业译本。
7. **柯尔布林圣经**：只提供原创导读，不复制受版权保护的正文；如读者需要原文，请向权利人获取。
8. **数字化差异**：同一典籍在不同整理本中可能存在字句差异；本程序以所列底本为准，不保证与纸本或其他电子本完全一致。
9. **现代版权作品只做原创导读**：十宗罪、心理罪、埃勒里·奎因、东野圭吾、DC 漫画、漫威漫画等均为受版权保护的现代作品，本程序只收录原创导读，不收录正文、画面、台词与情节原文转述；需要原著请购买正版纸本或订阅官方数字平台。

---

## 四、引用与再分发

- 引用 Kanripo 文本时，请注明“Kanripo 漢籍リポジトリ + 仓库编号（如 KR1a0001）”，并遵循该仓库的许可说明。
- 引用 Project Gutenberg 文本时，请保留其版权声明与 eBook 编号。
- 引用本项目原创导读、年表、译文与图解时，请注明“万卷阁 WANJUAN GE”，并遵循 MIT 许可。
- 古籍原文本身不受版权保护，但**整理成果**（标点、分段、校记、数字化）可能受整理者权利约束；商业再分发前请自行核对各来源条款。

## 五、纠错

发现错字、缺章、来源标注错误，请在项目仓库提交 Issue，写清书名、章节、原文片段与底本链接。请勿在 Issue 中粘贴 API Key 或个人信息。项目仓库地址以实际 GitHub / GitCode 页面为准。
