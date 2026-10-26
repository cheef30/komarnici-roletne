// Open Graph slika 1200x630: hero fotografija + naziv firme, renderovano u Chromium-u
// (Playwright) sa istim Archivo fontom kao sajt.
//   node scripts/build-og.mjs

import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { woff2: 'font/woff2', jpg: 'image/jpeg' };
const url = async (p) => `data:${types[p.split('.').pop()]};base64,${(await readFile(path.join(ROOT, p))).toString('base64')}`;
const mesh = (await readFile(path.join(ROOT, 'assets/css/critical.css'), 'utf8')).match(/--mesh-light:(url\("[^"]+"\))/)[1];

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Archivo;src:url(${await url('assets/fonts/archivo-var.woff2')}) format("woff2");font-weight:400 820;font-stretch:75% 100%}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;display:grid;grid-template-columns:600px 600px;font-family:Archivo;background:#1D2422 ${mesh};color:#fff}
.t{padding:64px 56px;display:flex;flex-direction:column;justify-content:space-between}
.logo{font-weight:800;font-stretch:88%;font-size:32px;letter-spacing:-.015em}.logo span{color:#9FD3B8}
h1{font-size:76px;line-height:.98;font-weight:780;font-stretch:82%;letter-spacing:-.018em}
p{font-size:26px;color:rgba(255,255,255,.8);margin-top:22px;line-height:1.35}
.tel{font-size:34px;font-weight:720;letter-spacing:-.01em}
.tel small{display:block;font-size:20px;font-weight:450;color:rgba(255,255,255,.7);margin-bottom:6px;letter-spacing:0}
img{width:600px;height:630px;object-fit:cover;object-position:50% 40%}
</style></head><body>
<div class="t"><div class="logo">Komarnici <span>i roletne</span> Ivan</div>
<div><h1>Komarnici i roletne po meri</h1><p>Izrada, ugradnja i popravka u Beogradu</p></div>
<div class="tel"><small>Pozovite ili pošaljite sliku</small>060 193 0660</div></div>
<img src="${await url('assets/img/plise-komarnik-balkonski-prozor-i-vrata-1200.jpg')}">
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png' });
await browser.close();
await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(ROOT, 'assets/img/og-komarnici-roletne-ivan.jpg'));
console.log('OG slika spremna');
