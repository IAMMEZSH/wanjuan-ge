#!/usr/bin/env node
'use strict';

/**
 * 万卷阁 · 发布包构建（零第三方依赖）
 *
 * 生成：
 *   release/wanjuan-ge-v<版本>.zip                 全平台源码包
 *   release/wanjuan-ge-v<版本>-windows.zip         Windows 启动器 + 完整运行文件
 *   release/wanjuan-ge-v<版本>-linux.tar.gz        Linux 启动器 + 完整运行文件
 *   release/wanjuan-ge-v<版本>-macos.zip           macOS 启动器 + 完整运行文件
 *   release/wanjuan-ge-v<版本>-android-termux.zip  Termux 启动器 + 完整运行文件
 *   release/wanjuan-ge-v<版本>-iphone-ipad-ish.zip iSH 启动器 + 完整运行文件
 *   release/SHA256SUMS.txt                         校验清单
 *
 * 安全约定：
 *   - 永不打包 _work/、node_modules/、release/、.git/；
 *   - 永不打包 data/user.json（其中保存 API Key）、译文缓存与用户上传；
 *   - 打包前扫描常见密钥格式，发现疑似 token 立即中止。
 *
 * 用法：
 *   node tools/build-release.js
 *   npm run release
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const RELEASE_DIR = path.join(ROOT, 'release');
const VERSION_FILE = path.join(ROOT, 'VERSION');

const EXCLUDED_DIRS = new Set(['_work', 'node_modules', 'release', '.git', '.idea', '.vscode', '.github', '__pycache__']);
const EXCLUDED_PREFIXES = ['data/translations/', 'data/uploads/'];
const EXCLUDED_FILES = new Set([
  'data/user.json',
  'data/user.json.bak',
  'data/user.json.tmp',
  'data/search-index.json',
  '.DS_Store',
  'Thumbs.db'
]);

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /glpat-[A-Za-z0-9_-]{20,}/,
  /AKIA[0-9A-Z]{16}/
];

const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.json', '.html', '.htm', '.css', '.md', '.txt',
  '.bat', '.cmd', '.vbs', '.sh', '.command', '.xml', '.gradle', '.kts',
  '.properties', '.yml', '.yaml', '.webmanifest', '.svg', '.java', '.gitignore'
]);

function readVersion() {
  try {
    const value = fs.readFileSync(VERSION_FILE, 'utf8').trim();
    if (value) return value;
  } catch {
    // 文件不存在时按约定写入 1.0.0
  }
  fs.writeFileSync(VERSION_FILE, '1.0.0\n', 'utf8');
  console.log('[release] VERSION 不存在或为空，已写入 1.0.0');
  return '1.0.0';
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function isExcluded(rel) {
  const parts = rel.split('/');
  if (parts.some((part) => EXCLUDED_DIRS.has(part))) return true;
  if (EXCLUDED_FILES.has(rel) || EXCLUDED_FILES.has(parts[parts.length - 1])) return true;
  if (EXCLUDED_PREFIXES.some((prefix) => rel.startsWith(prefix))) return true;
  if (/\.log$/i.test(rel)) return true;
  if (/(^|\/)\.env(\.|$)/i.test(rel)) return true;
  return false;
}

function collectFiles() {
  const entries = [];
  function walk(absDir, relDir) {
    for (const dirent of fs.readdirSync(absDir, { withFileTypes: true })) {
      const rel = relDir ? `${relDir}/${dirent.name}` : dirent.name;
      const abs = path.join(absDir, dirent.name);
      if (isExcluded(rel)) continue;
      if (dirent.isDirectory()) {
        walk(abs, rel);
      } else if (dirent.isFile()) {
        const stat = fs.statSync(abs);
        const executable = /\.(sh|command)$/i.test(dirent.name);
        entries.push({
          rel: toPosix(rel),
          abs,
          size: stat.size,
          mtime: stat.mtime,
          mode: executable ? 0o755 : 0o644
        });
      }
    }
  }
  walk(ROOT, '');
  entries.sort((a, b) => a.rel.localeCompare(b.rel));

  // Windows 文件系统不区分大小写，源码中的 docs/manual.html 与 docs/MANUAL.html
  // 实际是同一个文件；为兼容 Linux/macOS 的大小写敏感文件系统，打包时补一个小写别名。
  const manual = entries.find(entry => entry.rel === 'docs/MANUAL.html');
  if (manual && !entries.some(entry => entry.rel === 'docs/manual.html')) {
    entries.push({ ...manual, rel: 'docs/manual.html' });
    entries.sort((a, b) => a.rel.localeCompare(b.rel));
  }
  return entries;
}

function scanForSecrets(entries) {
  const findings = [];
  let scanned = 0;
  for (const entry of entries) {
    const ext = path.extname(entry.rel).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext) && !entry.rel.endsWith('.gitignore')) continue;
    if (entry.size > 8 * 1024 * 1024) continue;
    let text;
    try {
      text = fs.readFileSync(entry.abs, 'utf8');
    } catch {
      continue;
    }
    scanned += 1;
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${entry.rel}（匹配 ${pattern}）`);
        break;
      }
    }
  }
  if (findings.length) {
    throw new Error(
      `检测到疑似密钥，已中止打包：\n  - ${findings.join('\n  - ')}\n` +
        '请把密钥移出项目目录，或加入忽略规则后重试。'
    );
  }
  console.log(`[release] 密钥扫描：${scanned} 个文本文件，未发现疑似 token`);
}

/* ---------------------------------- ZIP ---------------------------------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buffer.length; i += 1) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

async function createZip(outFile, entries, prefix) {
  const fd = fs.openSync(outFile, 'w');
  let offset = 0;
  const central = [];
  const write = (buffer) => {
    fs.writeSync(fd, buffer);
    offset += buffer.length;
  };

  try {
    for (const entry of entries) {
      const name = Buffer.from(`${prefix}/${entry.rel}`, 'utf8');
      const data = fs.readFileSync(entry.abs);
      const deflated = zlib.deflateRawSync(data, { level: 9 });
      const compressed = deflated.length < data.length;
      const body = compressed ? deflated : data;
      const crc = crc32(data);
      const stamp = dosDateTime(entry.mtime);
      const localOffset = offset;

      const header = Buffer.alloc(30);
      header.writeUInt32LE(0x04034b50, 0);
      header.writeUInt16LE(20, 4);
      header.writeUInt16LE(0x0800, 6); // UTF-8 文件名
      header.writeUInt16LE(compressed ? 8 : 0, 8);
      header.writeUInt16LE(stamp.time, 10);
      header.writeUInt16LE(stamp.date, 12);
      header.writeUInt32LE(crc, 14);
      header.writeUInt32LE(body.length, 18);
      header.writeUInt32LE(data.length, 22);
      header.writeUInt16LE(name.length, 26);
      header.writeUInt16LE(0, 28);

      write(header);
      write(name);
      write(body);

      central.push({
        name,
        crc,
        compressedSize: body.length,
        rawSize: data.length,
        method: compressed ? 8 : 0,
        time: stamp.time,
        date: stamp.date,
        offset: localOffset,
        mode: entry.mode
      });
    }

    const centralStart = offset;
    for (const item of central) {
      const header = Buffer.alloc(46);
      header.writeUInt32LE(0x02014b50, 0);
      header.writeUInt16LE((3 << 8) | 20, 4); // Unix 创建，保留权限位
      header.writeUInt16LE(20, 6);
      header.writeUInt16LE(0x0800, 8);
      header.writeUInt16LE(item.method, 10);
      header.writeUInt16LE(item.time, 12);
      header.writeUInt16LE(item.date, 14);
      header.writeUInt32LE(item.crc, 16);
      header.writeUInt32LE(item.compressedSize, 20);
      header.writeUInt32LE(item.rawSize, 24);
      header.writeUInt16LE(item.name.length, 28);
      header.writeUInt16LE(0, 30);
      header.writeUInt16LE(0, 32);
      header.writeUInt16LE(0, 34);
      header.writeUInt16LE(0, 36);
      header.writeUInt32LE(((0o100000 | item.mode) << 16) >>> 0, 38);
      header.writeUInt32LE(item.offset, 42);
      write(header);
      write(item.name);
    }

    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(central.length, 8);
    end.writeUInt16LE(central.length, 10);
    end.writeUInt32LE(offset - centralStart, 12);
    end.writeUInt32LE(centralStart, 16);
    end.writeUInt16LE(0, 20);
    write(end);
  } finally {
    fs.closeSync(fd);
  }
}

/* -------------------------------- TAR.GZ --------------------------------- */

function tarOctal(value, width) {
  return `${Math.max(0, Math.floor(value)).toString(8).padStart(width - 1, '0')}\0`;
}

function tarHeader(rel, mode, size, mtimeMs) {
  const header = Buffer.alloc(512);
  const full = Buffer.from(rel, 'utf8');
  let name = rel;
  let prefix = '';
  if (full.length > 100) {
    let split = -1;
    for (let i = rel.length - 1; i > 0; i -= 1) {
      if (rel[i] !== '/') continue;
      const candidatePrefix = rel.slice(0, i);
      const candidateName = rel.slice(i + 1);
      if (Buffer.byteLength(candidateName, 'utf8') <= 100 && Buffer.byteLength(candidatePrefix, 'utf8') <= 155) {
        split = i;
        break;
      }
    }
    if (split < 0) throw new Error(`tar 路径过长：${rel}`);
    name = rel.slice(split + 1);
    prefix = rel.slice(0, split);
  }

  Buffer.from(name, 'utf8').copy(header, 0, 0, 100);
  header.write(tarOctal(mode, 8), 100, 8, 'ascii');
  header.write(tarOctal(0, 8), 108, 8, 'ascii');
  header.write(tarOctal(0, 8), 116, 8, 'ascii');
  header.write(tarOctal(size, 12), 124, 12, 'ascii');
  header.write(tarOctal(Math.floor(mtimeMs / 1000), 12), 136, 12, 'ascii');
  header.fill(0x20, 148, 156); // 校验和先填空格
  header.write('0', 156, 1, 'ascii');
  header.write('ustar\0', 257, 6, 'ascii');
  header.write('00', 263, 2, 'ascii');
  header.write('root', 265, 4, 'ascii');
  header.write('root', 297, 4, 'ascii');
  header.write(tarOctal(0, 8), 329, 8, 'ascii');
  header.write(tarOctal(0, 8), 337, 8, 'ascii');
  if (prefix) Buffer.from(prefix, 'utf8').copy(header, 345, 0, 155);

  let checksum = 0;
  for (const byte of header) checksum += byte;
  const sum = checksum.toString(8).padStart(6, '0');
  header.write(sum, 148, 6, 'ascii');
  header[154] = 0;
  header[155] = 0x20;
  return header;
}

async function createTarGz(outFile, entries, prefix) {
  const gzip = zlib.createGzip({ level: 9 });
  const output = fs.createWriteStream(outFile);
  gzip.pipe(output);

  const drained = (stream) => new Promise((resolve) => stream.once('drain', resolve));
  const write = async (chunk) => {
    if (!gzip.write(chunk)) await drained(gzip);
  };

  try {
    for (const entry of entries) {
      const stat = fs.statSync(entry.abs);
      await write(tarHeader(`${prefix}/${entry.rel}`, entry.mode, stat.size, stat.mtimeMs));
      if (stat.size > 0) {
        const fd = fs.openSync(entry.abs, 'r');
        try {
          let remaining = stat.size;
          const buffer = Buffer.allocUnsafe(64 * 1024);
          while (remaining > 0) {
            const read = fs.readSync(fd, buffer, 0, Math.min(buffer.length, remaining), null);
            if (!read) break;
            await write(Buffer.from(buffer.subarray(0, read)));
            remaining -= read;
          }
        } finally {
          fs.closeSync(fd);
        }
      }
      const padding = (512 - (stat.size % 512)) % 512;
      if (padding) await write(Buffer.alloc(padding));
    }
    await write(Buffer.alloc(1024)); // 两个全零块结束归档

    await new Promise((resolve, reject) => {
      output.once('finish', resolve);
      output.once('error', reject);
      gzip.once('error', reject);
      gzip.end();
    });
  } catch (error) {
    gzip.destroy();
    output.destroy();
    throw error;
  }
}

/* -------------------------------- 打包流程 -------------------------------- */

function sha256File(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(file);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function humanSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function selectEntries(all, platform) {
  if (!platform) return all.slice();
  const launcher = `launchers/${platform}/`;
  return all.filter((entry) => {
    if (entry.rel.startsWith('android/')) return false;
    if (entry.rel.startsWith('launchers/') && !entry.rel.startsWith(launcher)) return false;
    return true;
  });
}

async function main() {
  const version = readVersion();
  const startedAt = Date.now();
  console.log(`万卷阁 · 构建发布包 v${version}`);

  if (!fs.existsSync(path.join(ROOT, 'library', 'catalog.json'))) {
    console.warn('[release] 提示：library/catalog.json 不存在，建议先运行 node tools/build-index.js');
  }
  if (!fs.existsSync(path.join(ROOT, 'data', 'search-index.json'))) {
    console.warn('[release] 提示：data/search-index.json 不存在，发布包首次启动会自动生成。');
  }

  const allEntries = collectFiles();
  scanForSecrets(allEntries);
  console.log(`[release] 已收集 ${allEntries.length} 个文件（已排除 _work、node_modules、release、.git 与用户数据）`);

  fs.rmSync(RELEASE_DIR, { recursive: true, force: true });
  fs.mkdirSync(RELEASE_DIR, { recursive: true });

  const base = `wanjuan-ge-v${version}`;
  const packages = [
    { file: `${base}.zip`, kind: 'zip', platform: null, label: '全平台源码' },
    { file: `${base}-windows.zip`, kind: 'zip', platform: 'windows', label: 'Windows' },
    { file: `${base}-linux.tar.gz`, kind: 'tar.gz', platform: 'linux', label: 'Linux' },
    { file: `${base}-macos.zip`, kind: 'zip', platform: 'macos', label: 'macOS' },
    { file: `${base}-android-termux.zip`, kind: 'zip', platform: 'android-termux', label: 'Android Termux' },
    { file: `${base}-iphone-ipad-ish.zip`, kind: 'zip', platform: 'iphone-ipad-ish', label: 'iPhone / iPad iSH' }
  ];

  const results = [];
  for (const item of packages) {
    const entries = selectEntries(allEntries, item.platform);
    const prefix = item.platform ? `${base}-${item.platform}` : base;
    const outFile = path.join(RELEASE_DIR, item.file);
    const begin = Date.now();
    process.stdout.write(`[release] 打包 ${item.file}（${entries.length} 个文件）…… `);
    if (item.kind === 'zip') {
      await createZip(outFile, entries, prefix);
    } else {
      await createTarGz(outFile, entries, prefix);
    }
    const size = fs.statSync(outFile).size;
    const hash = await sha256File(outFile);
    results.push({ ...item, size, hash, seconds: (Date.now() - begin) / 1000 });
    console.log(`完成 ${humanSize(size)} / ${(Date.now() - begin) / 1000}s`);
  }

  const sums = results
    .map((item) => `${item.hash}  ${item.file}`)
    .join('\n');
  fs.writeFileSync(path.join(RELEASE_DIR, 'SHA256SUMS.txt'), `${sums}\n`, 'utf8');

  const total = results.reduce((sum, item) => sum + item.size, 0);
  console.log('');
  console.log('发布产物：');
  for (const item of results) {
    console.log(`  ${item.file.padEnd(46, ' ')} ${humanSize(item.size).padStart(9, ' ')}  ${item.hash.slice(0, 16)}…`);
  }
  console.log(`  SHA256SUMS.txt                                  ${humanSize(fs.statSync(path.join(RELEASE_DIR, 'SHA256SUMS.txt')).size)}`);
  console.log(`合计：${humanSize(total)}，耗时 ${((Date.now() - startedAt) / 1000).toFixed(1)} 秒`);
  console.log(`输出目录：${RELEASE_DIR}`);
}

main().catch((error) => {
  console.error(`构建发布包失败：${error.message}`);
  if (process.env.WANJUAN_DEBUG) console.error(error.stack);
  process.exitCode = 1;
});
