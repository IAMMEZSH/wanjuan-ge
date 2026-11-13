'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, '_work', 'ne_countries.geojson');
const OUT = path.join(ROOT, 'public', 'images', 'world-map.svg');

const WIDTH = 1000;
const HEIGHT = 500;

function project(lon, lat) {
  return [((lon + 180) / 360) * WIDTH, ((90 - lat) / 180) * HEIGHT];
}

function perpendicularDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return Math.hypot(point[0] - start[0], point[1] - start[1]);
  const t = ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy);
  const clampT = Math.max(0, Math.min(1, t));
  const px = start[0] + clampT * dx;
  const py = start[1] + clampT * dy;
  return Math.hypot(point[0] - px, point[1] - py);
}

function simplify(points, tolerance) {
  if (points.length <= 4) return points;
  let maxDistance = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  if (maxDistance > tolerance) {
    const left = simplify(points.slice(0, index + 1), tolerance);
    const right = simplify(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

function unwrapRing(ring) {
  const result = [];
  let offset = 0;
  let previous = null;
  for (const [lon, lat] of ring) {
    let adjusted = lon + offset;
    if (previous != null) {
      while (adjusted - previous > 180) {
        offset -= 360;
        adjusted -= 360;
      }
      while (adjusted - previous < -180) {
        offset += 360;
        adjusted += 360;
      }
    }
    previous = adjusted;
    result.push([adjusted, lat]);
  }
  return result;
}

function ringToPath(ring) {
  const unwrapped = unwrapRing(ring);
  const simplified = simplify(unwrapped, 0.09);
  if (simplified.length < 3) return '';
  return simplified
    .map(([lon, lat], index) => {
      const [x, y] = project(lon, lat);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join('') + 'Z';
}

function featurePath(feature) {
  const geometry = feature.geometry;
  if (!geometry) return '';
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  const parts = [];
  for (const polygon of polygons) {
    for (const ring of polygon) {
      const pathData = ringToPath(ring);
      if (pathData) parts.push(pathData);
    }
  }
  return parts.join('');
}

const geojson = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const countryPaths = [];
for (const feature of geojson.features) {
  const d = featurePath(feature);
  if (d) countryPaths.push(d);
}

const graticule = [];
for (let lon = -180; lon <= 180; lon += 30) {
  const [x] = project(lon, 0);
  graticule.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${HEIGHT}" />`);
}
for (let lat = -60; lat <= 60; lat += 30) {
  const [, y] = project(0, lat);
  graticule.push(`<line x1="0" y1="${y.toFixed(1)}" x2="${WIDTH}" y2="${y.toFixed(1)}" />`);
}
const [, equatorY] = project(0, 0);
const [, tropicNorth] = project(0, 23.436);
const [, tropicSouth] = project(0, -23.436);

const labels = [
  ['亚洲', 92, 40, 22],
  ['欧洲', 20, 31, 15],
  ['非洲', 20, 55, 19],
  ['北美洲', -105, 32, 18],
  ['南美洲', -60, 66, 15],
  ['大洋洲', 135, 72, 15],
  ['太平洋', -150, 48, 14],
  ['大西洋', -30, 47, 13],
  ['印度洋', 78, 64, 13],
  ['北冰洋', 10, 8, 12]
]
  .map(([name, lon, lat, size]) => {
    const [x, y] = project(lon, lat);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="${size}" fill="#a89878" font-family="'Noto Serif SC','Songti SC',SimSun,serif" opacity="0.75" letter-spacing="3">${name}</text>`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="世界文明遗址地图">
  <defs>
    <clipPath id="frame"><rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}"/></clipPath>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9efe9"/>
      <stop offset="1" stop-color="#dfe9e2"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sea)"/>
  <g clip-path="url(#frame)">
    <g stroke="#cfdcd2" stroke-width="0.6" opacity="0.75">${graticule.join('')}</g>
    <line x1="0" y1="${equatorY.toFixed(1)}" x2="${WIDTH}" y2="${equatorY.toFixed(1)}" stroke="#b9cbbd" stroke-width="0.9" stroke-dasharray="6 5"/>
    <line x1="0" y1="${tropicNorth.toFixed(1)}" x2="${WIDTH}" y2="${tropicNorth.toFixed(1)}" stroke="#c8d6ca" stroke-width="0.6" stroke-dasharray="3 5"/>
    <line x1="0" y1="${tropicSouth.toFixed(1)}" x2="${WIDTH}" y2="${tropicSouth.toFixed(1)}" stroke="#c8d6ca" stroke-width="0.6" stroke-dasharray="3 5"/>
    <g fill="#f3e8d1" stroke="#c3b08c" stroke-width="0.45" fill-rule="evenodd">
      ${countryPaths.map((d) => `<path d="${d}"/>`).join('\n      ')}
    </g>
    <g transform="translate(-${WIDTH} 0)" fill="#f3e8d1" stroke="#c3b08c" stroke-width="0.45" fill-rule="evenodd">${countryPaths.map((d) => `<path d="${d}"/>`).join('')}</g>
    <g transform="translate(${WIDTH} 0)" fill="#f3e8d1" stroke="#c3b08c" stroke-width="0.45" fill-rule="evenodd">${countryPaths.map((d) => `<path d="${d}"/>`).join('')}</g>
    ${labels}
  </g>
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" fill="none" stroke="#c3b08c" stroke-width="1"/>
</svg>`;

fs.writeFileSync(OUT, svg, 'utf8');
console.log(`[world-map] ${OUT} ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB，${countryPaths.length} 个国家/地区路径`);
