'use strict';

/** 生成分类封面 SVG。纯程序绘制，含真实分类文字。 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'images', 'covers');

const COVERS = [
  ['jingbu', '经部', '經', '#26344e', '#8a6a3a', '六经'],
  ['shibu', '史部', '史', '#4a3424', '#a47c4a', '正史'],
  ['zibu', '子部', '子', '#23463c', '#7d9a6a', '诸子'],
  ['jibu', '集部', '集', '#43303f', '#9a7c8a', '诗文'],
  ['shi', '释部', '釋', '#6b3a1f', '#c08a3e', '佛典'],
  ['dao', '道部', '道', '#1f4a40', '#6fa08a', '玄门'],
  ['bible', '圣经', '聖', '#1b2f4a', '#b8944e', '新旧约'],
  ['prophecy', '预言', '讖', '#3a2b52', '#9a86c0', '推演'],
  ['shushu', '术数', '術', '#4a2626', '#b07a5a', '九宫'],
  ['military', '兵法', '兵', '#2f3d26', '#96a06a', '谋略'],
  ['divination', '术数', '玄', '#3d2f4a', '#a08ab0', '奇门'],
  ['classic', '典籍', '典', '#3a3028', '#a08a6a', '三易'],
  ['world', '世界', '世', '#243a4a', '#7a9ab0', '寰宇'],
  ['other', '其他', '籍', '#333333', '#999999', '别类']
];

function motif(kind, accent) {
  if (kind === 'bible') {
    return `<g opacity="0.22" stroke="${accent}" stroke-width="6" fill="none">
      <rect x="222" y="130" width="156" height="220" rx="6"/>
      <line x1="300" y1="160" x2="300" y2="320"/>
      <line x1="258" y1="205" x2="342" y2="205"/>
    </g>`;
  }
  if (kind === 'shushu' || kind === 'divination') {
    return `<g opacity="0.18" fill="none" stroke="${accent}" stroke-width="4">
      <circle cx="300" cy="250" r="86"/><circle cx="300" cy="250" r="54"/>
      <line x1="214" y1="250" x2="386" y2="250"/><line x1="300" y1="164" x2="300" y2="336"/>
    </g>`;
  }
  if (kind === 'prophecy' || kind === 'classic') {
    return `<g opacity="0.2" fill="${accent}">
      <circle cx="220" cy="180" r="4"/><circle cx="380" cy="160" r="3"/><circle cx="340" cy="260" r="5"/>
      <circle cx="250" cy="300" r="3"/><circle cx="400" cy="330" r="4"/><circle cx="180" cy="350" r="3"/>
      <path d="M300 130 l8 26 27 2 -21 18 7 27 -21 -14 -21 14 7 -27 -21 -18 27 -2z" fill="none" stroke="${accent}" stroke-width="3"/>
    </g>`;
  }
  return `<g opacity="0.16" fill="none" stroke="${accent}" stroke-width="3">
    <path d="M120 620 q60 -40 120 0 t120 0 t120 0"/>
    <path d="M120 660 q60 -40 120 0 t120 0 t120 0"/>
  </g>`;
}

function svg(kind, label, glyph, bg, accent, sub) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="#120e0a"/>
    </linearGradient>
    <pattern id="p" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M0 42 L42 0" stroke="${accent}" stroke-width="1" opacity="0.08"/>
    </pattern>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <rect width="600" height="800" fill="url(#p)"/>
  <rect x="28" y="28" width="544" height="744" rx="10" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5"/>
  <rect x="42" y="42" width="516" height="716" rx="6" fill="none" stroke="${accent}" stroke-width="1" opacity="0.3"/>
  ${motif(kind, accent)}
  <text x="300" y="440" text-anchor="middle" font-family="'Noto Serif SC','Source Han Serif SC','Songti SC',serif" font-size="200" fill="${accent}">${glyph}</text>
  <text x="300" y="560" text-anchor="middle" font-family="'Noto Serif SC','Source Han Serif SC',serif" font-size="54" letter-spacing="12" fill="${accent}">${label}</text>
  <line x1="220" y1="600" x2="380" y2="600" stroke="${accent}" stroke-width="2" opacity="0.6"/>
  <text x="300" y="650" text-anchor="middle" font-family="'Noto Sans SC',sans-serif" font-size="28" letter-spacing="8" fill="${accent}" opacity="0.8">${sub}</text>
</svg>`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const [kind, label, glyph, bg, accent, sub] of COVERS) {
  fs.writeFileSync(path.join(OUT, `${kind}.svg`), svg(kind, label, glyph, bg, accent, sub), 'utf8');
  console.log(`[covers] ${kind}.svg`);
}
