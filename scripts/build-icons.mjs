// Favicon set iz jednog SVG znaka: icon.svg, PNG 192/512 (+ maskable),
// apple-touch-icon.png (180) i favicon.ico (16 + 32, PNG unutar ICO).
//   node scripts/build-icons.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ICONS = path.join(ROOT, 'assets', 'icons');

// Znak: prozor sa kutijom rolo komarnika i mrezicom spustenom do lajsne.
const mark = (pad = 0) => {
  const s = 64 - pad * 2;
  const k = s / 64;
  const t = (v) => (pad + v * k).toFixed(2);
  const mesh = [];
  for (let y = 25; y < 38; y += 3) mesh.push(`M${t(18.5)} ${t(y)}H${t(45.5)}`);
  for (let x = 21.5; x < 45; x += 3) mesh.push(`M${t(x)} ${t(21)}V${t(38)}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${pad ? 0 : 14}" fill="#1D2422"/>
  <path d="${mesh.join('')}" stroke="#9FD3B8" stroke-opacity=".55" stroke-width="${(1 * k).toFixed(2)}" fill="none"/>
  <rect x="${t(17)}" y="${t(19)}" width="${(30 * k).toFixed(2)}" height="${(33 * k).toFixed(2)}" fill="none" stroke="#FFF" stroke-width="${(3 * k).toFixed(2)}"/>
  <rect x="${t(13)}" y="${t(11)}" width="${(38 * k).toFixed(2)}" height="${(9 * k).toFixed(2)}" rx="${(2 * k).toFixed(2)}" fill="#FFF"/>
  <rect x="${t(17)}" y="${t(37)}" width="${(30 * k).toFixed(2)}" height="${(4 * k).toFixed(2)}" fill="#9FD3B8"/>
</svg>`;
};

await mkdir(ICONS, { recursive: true });
const svg = mark();
await writeFile(path.join(ICONS, 'icon.svg'), svg);
const png = (src, size) => sharp(Buffer.from(src), { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

await writeFile(path.join(ICONS, 'icon-192.png'), await png(svg, 192));
await writeFile(path.join(ICONS, 'icon-512.png'), await png(svg, 512));
await writeFile(path.join(ICONS, 'icon-maskable-512.png'), await png(mark(10), 512));
await writeFile(path.join(ROOT, 'apple-touch-icon.png'), await png(mark(6), 180));

// ICO sa dve PNG slike
const imgs = [await png(svg, 16), await png(svg, 32)];
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(imgs.length, 4);
let offset = 6 + 16 * imgs.length;
const dir = imgs.map((buf, i) => {
  const size = [16, 32][i];
  const e = Buffer.alloc(16);
  e.writeUInt8(size, 0); e.writeUInt8(size, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(buf.length, 8); e.writeUInt32LE(offset, 12);
  offset += buf.length;
  return e;
});
await writeFile(path.join(ROOT, 'favicon.ico'), Buffer.concat([header, ...dir, ...imgs]));
console.log('ikonice spremne');
