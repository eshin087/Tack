// Pack dist/ into release/tack-v<version>.zip for store upload.
// Cross-platform — uses Node's stream + a tiny zip encoder. No deps.

import { createReadStream, createWriteStream, mkdirSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { deflateRawSync, crc32 } from 'node:zlib';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const VERSION = pkg.version;
const OUT_DIR = 'release';
const OUT_FILE = `${OUT_DIR}/tack-v${VERSION}.zip`;

mkdirSync(OUT_DIR, { recursive: true });

// Walk dist/ and collect every file with its archive-relative path.
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
const files = walk('dist').map((p) => ({
  full: p,
  arc: relative('dist', p).split(sep).join('/'),
}));

// Minimal ZIP writer (no encryption, no Unicode flag issues — file names are ASCII).
const localParts = [];
const centralParts = [];
let offset = 0;

for (const { full, arc } of files) {
  const data = readFileSync(full);
  const compressed = deflateRawSync(data);
  const useDeflate = compressed.length < data.length;
  const stored = useDeflate ? compressed : data;
  const method = useDeflate ? 8 : 0;
  const crc = crc32(data);
  const nameBuf = Buffer.from(arc, 'utf8');

  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);     // local file header sig
  localHeader.writeUInt16LE(20, 4);             // version needed
  localHeader.writeUInt16LE(0, 6);              // flags
  localHeader.writeUInt16LE(method, 8);         // method
  localHeader.writeUInt16LE(0, 10);             // time
  localHeader.writeUInt16LE(0x21, 12);          // date (2026-01-01 = 0x21)
  localHeader.writeUInt32LE(crc, 14);
  localHeader.writeUInt32LE(stored.length, 18); // compressed size
  localHeader.writeUInt32LE(data.length, 22);   // uncompressed size
  localHeader.writeUInt16LE(nameBuf.length, 26);
  localHeader.writeUInt16LE(0, 28);             // extra field length

  localParts.push(localHeader, nameBuf, stored);

  const centralHeader = Buffer.alloc(46);
  centralHeader.writeUInt32LE(0x02014b50, 0);   // central dir sig
  centralHeader.writeUInt16LE(20, 4);           // version made by
  centralHeader.writeUInt16LE(20, 6);           // version needed
  centralHeader.writeUInt16LE(0, 8);            // flags
  centralHeader.writeUInt16LE(method, 10);
  centralHeader.writeUInt16LE(0, 12);
  centralHeader.writeUInt16LE(0x21, 14);
  centralHeader.writeUInt32LE(crc, 16);
  centralHeader.writeUInt32LE(stored.length, 20);
  centralHeader.writeUInt32LE(data.length, 24);
  centralHeader.writeUInt16LE(nameBuf.length, 28);
  centralHeader.writeUInt16LE(0, 30);           // extra field len
  centralHeader.writeUInt16LE(0, 32);           // file comment len
  centralHeader.writeUInt16LE(0, 34);           // disk number
  centralHeader.writeUInt16LE(0, 36);           // internal attrs
  centralHeader.writeUInt32LE(0, 38);           // external attrs
  centralHeader.writeUInt32LE(offset, 42);      // local header offset

  centralParts.push(centralHeader, nameBuf);
  offset += localHeader.length + nameBuf.length + stored.length;
}

const centralStart = offset;
const centralBuf = Buffer.concat(centralParts);

const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(0, 4);
eocd.writeUInt16LE(0, 6);
eocd.writeUInt16LE(files.length, 8);
eocd.writeUInt16LE(files.length, 10);
eocd.writeUInt32LE(centralBuf.length, 12);
eocd.writeUInt32LE(centralStart, 16);
eocd.writeUInt16LE(0, 20);

const all = Buffer.concat([...localParts, centralBuf, eocd]);
const out = createWriteStream(OUT_FILE);
out.end(all);

out.on('close', () => {
  const sizeKb = (all.length / 1024).toFixed(1);
  console.log(`Tack: packaged ${files.length} files -> ${OUT_FILE} (${sizeKb} KB)`);
});
