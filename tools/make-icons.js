'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 0);
  return Buffer.concat([head, data, tail]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function hexColor(hex, alpha = 255) {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    alpha
  ];
}

class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 4);
  }

  blend(x, y, color) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    const a = color[3] / 255;
    if (a >= 1) {
      this.data[i] = color[0];
      this.data[i + 1] = color[1];
      this.data[i + 2] = color[2];
      this.data[i + 3] = 255;
      return;
    }
    const dstA = this.data[i + 3] / 255;
    const outA = a + dstA * (1 - a);
    if (outA <= 0) return;
    for (let c = 0; c < 3; c += 1) {
      this.data[i + c] = Math.round((color[c] * a + this.data[i + c] * dstA * (1 - a)) / outA);
    }
    this.data[i + 3] = Math.round(outA * 255);
  }

  fillRoundedRect(x0, y0, x1, y1, radius, color) {
    const r = Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2);
    const left = Math.floor(x0);
    const right = Math.ceil(x1);
    const top = Math.floor(y0);
    const bottom = Math.ceil(y1);
    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        const px = x + 0.5;
        const py = y + 0.5;
        if (px < x0 || px > x1 || py < y0 || py > y1) continue;
        const dx = Math.max(x0 + r - px, 0, px - (x1 - r));
        const dy = Math.max(y0 + r - py, 0, py - (y1 - r));
        if (dx * dx + dy * dy <= r * r) this.blend(x, y, color);
      }
    }
  }

  fillCircle(cx, cy, radius, color) {
    const left = Math.floor(cx - radius);
    const right = Math.ceil(cx + radius);
    const top = Math.floor(cy - radius);
    const bottom = Math.ceil(cy + radius);
    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= radius * radius) this.blend(x, y, color);
      }
    }
  }

  downsample(factor) {
    const width = this.width / factor;
    const height = this.height / factor;
    const out = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        for (let sy = 0; sy < factor; sy += 1) {
          for (let sx = 0; sx < factor; sx += 1) {
            const i = ((y * factor + sy) * this.width + x * factor + sx) * 4;
            r += this.data[i];
            g += this.data[i + 1];
            b += this.data[i + 2];
            a += this.data[i + 3];
          }
        }
        const n = factor * factor;
        const o = (y * width + x) * 4;
        out[o] = Math.round(r / n);
        out[o + 1] = Math.round(g / n);
        out[o + 2] = Math.round(b / n);
        out[o + 3] = Math.round(a / n);
      }
    }
    return out;
  }
}

function drawIcon(size) {
  const scale = 4;
  const s = size * scale;
  const canvas = new Canvas(s, s);
  const red = hexColor('#9b2d20');
  const deep = hexColor('#6e1d15');
  const cream = hexColor('#f6efdf');
  const gold = hexColor('#d9b36a');

  canvas.fillRoundedRect(0, 0, s, s, s * 0.22, red);
  canvas.fillCircle(s * 0.5, s * 0.5, s * 0.355, hexColor('#000000', 22));

  const slipWidth = s * 0.078;
  const gap = s * 0.018;
  const total = slipWidth * 5 + gap * 4;
  const left = (s - total) / 2;
  const top = s * 0.235;
  const bottom = s * 0.765;

  for (let i = 0; i < 5; i += 1) {
    const x = left + i * (slipWidth + gap);
    const inset = i === 0 || i === 4 ? s * 0.012 : 0;
    canvas.fillRoundedRect(x, top + inset, x + slipWidth, bottom - inset, s * 0.012, cream);
  }

  const cordLeft = left - s * 0.02;
  const cordRight = left + total + s * 0.02;
  for (const y of [0.40, 0.60]) {
    canvas.fillRoundedRect(cordLeft, s * y, cordRight, s * (y + 0.022), s * 0.008, deep);
  }
  for (let i = 0; i < 5; i += 1) {
    const cx = left + i * (slipWidth + gap) + slipWidth / 2;
    canvas.fillCircle(cx, s * 0.411, s * 0.009, gold);
    canvas.fillCircle(cx, s * 0.611, s * 0.009, gold);
  }

  canvas.fillRoundedRect(s * 0.40, s * 0.812, s * 0.60, s * 0.824, s * 0.006, gold);

  const rgba = canvas.downsample(scale);
  return encodePng(size, size, Buffer.from(rgba));
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const size of [192, 512]) {
  const file = path.join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(file, drawIcon(size));
  console.log(`[icons] ${file} ${fs.statSync(file).size} bytes`);
}
