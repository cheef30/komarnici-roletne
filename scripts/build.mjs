// Odrzava zajednicke delove svih stranica bez build alata za sajt.
// Stranice ostaju obican HTML koji radi i bez ove skripte; skripta samo
// prepisuje sadrzaj izmedju markera, pa se pokrece posle svake izmene:
//
//   node scripts/build.mjs
//
//  <!-- @head --> ... <!-- /@head -->      partials/head.html + inline critical.css
//  <!-- @header --> ... <!-- /@header -->  partials/header.html (+ aria-current)
//  <!-- @footer --> ... <!-- /@footer -->  partials/footer.html
//  <picture data-img="ime" data-sizes=".." data-alt=".." [data-eager] [data-class=".."]></picture>
//      dobija <source> za AVIF i WebP i <img> sa tacnim width/height iz scripts/images.json

import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['index.html', 'komarnici/index.html', 'roletne/index.html', 'servis/index.html', 'kontakt/index.html', '404.html'];

const read = (p) => readFile(path.join(ROOT, p), 'utf8');
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);
const minifyCss = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s*\n\s*/g, '')
  .replace(/\s*([{};,>])\s*/g, '$1')
  .replace(/;}/g, '}');

const images = JSON.parse(await read('scripts/images.json'));
const critical = minifyCss(await read('assets/css/critical.css'));
const css = await read('assets/css/style.css');
const js = await read('assets/js/main.js');
const head = (await read('partials/head.html'))
  .replace('{{CRITICAL}}', critical)
  .replaceAll('{{JS_V}}', hash(js));
// SVG sprajt: Phosphor (regular/fill) za ikonice, Simple Icons za WhatsApp i Viber logotipe,
// i znak firme (prozor sa kutijom i mrežicom, isti kao favicon).
const PH = 'node_modules/@phosphor-icons/core/assets';
const ICONS = {
  'i-phone': `${PH}/regular/phone.svg`,
  'i-mail': `${PH}/regular/envelope-simple.svg`,
  'i-pin': `${PH}/regular/map-pin.svg`,
  'i-pin-fill': `${PH}/fill/map-pin-fill.svg`,
  'i-ruler': `${PH}/regular/ruler.svg`,
  'i-swatch': `${PH}/regular/palette.svg`,
  'i-camera': `${PH}/regular/camera.svg`,
  'i-frame': `${PH}/regular/grid-nine.svg`,
  'i-check': `${PH}/regular/check.svg`,
  'i-clock': `${PH}/regular/clock.svg`,
  'i-wind': `${PH}/regular/wind.svg`,
  'i-menu': `${PH}/regular/list.svg`,
  'i-close': `${PH}/regular/x.svg`,
  'i-prev': `${PH}/regular/caret-left.svg`,
  'i-next': `${PH}/regular/caret-right.svg`,
  'i-star': `${PH}/fill/star-fill.svg`,
  'i-arrow': `${PH}/regular/arrow-up-right.svg`,
  'i-chat': 'node_modules/simple-icons/icons/whatsapp.svg',
  'i-viber': 'node_modules/simple-icons/icons/viber.svg',
};
const symbols = [];
for (const [id, file] of Object.entries(ICONS)) {
  const svg = await read(file);
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[\s\S]*?<\/title>/, '');
  symbols.push(`<symbol id="${id}" viewBox="${viewBox}">${inner.trim()}</symbol>`);
}
symbols.push('<symbol id="i-mark" viewBox="0 0 32 32"><rect x="5" y="3" width="22" height="5" rx="1" fill="currentColor"/><path d="M7.5 8v21h17V8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M8.7 12h14.6M8.7 15h14.6M11.5 9v10M15 9v10M18.5 9v10M22 9v10" stroke="currentColor" stroke-width=".9" opacity=".55"/><rect x="8.7" y="19" width="14.6" height="2.6" fill="var(--mark-accent,currentColor)"/></symbol>');
const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${symbols.join('')}</svg>`;
const header = (await read('partials/header.html')).replace('{{SPRITE}}', sprite);
const footer = await read('partials/footer.html');

const between = (html, name, content) => {
  const re = new RegExp(`(<!-- @${name} -->)[\\s\\S]*?(<!-- /@${name} -->)`);
  if (!re.test(html)) throw new Error(`nema markera @${name}`);
  return html.replace(re, `$1\n${content}\n$2`);
};

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
};

function picture(openTag) {
  const name = attr(openTag, 'data-img');
  const img = images[name];
  if (!img) throw new Error(`nepoznata slika: ${name}`);
  const sizes = attr(openTag, 'data-sizes') || '100vw';
  const alt = attr(openTag, 'data-alt') ?? '';
  const cls = attr(openTag, 'data-class');
  const eager = /\sdata-eager/.test(openTag);
  const set = (ext) => img.widths.map((w) => `/assets/img/${name}-${w}.${ext} ${w}w`).join(', ');
  const fallbackW = img.widths.includes(800) ? 800 : img.widths[img.widths.length - 1];
  const w = fallbackW;
  const h = Math.round((img.height / img.width) * w);
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"';
  return `${openTag}<source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="/assets/img/${name}-${fallbackW}.jpg" srcset="${set('jpg')}" sizes="${sizes}" width="${w}" height="${h}" alt="${alt}"${cls ? ` class="${cls}"` : ''} ${loading}></picture>`;
}

function relative(html, depth) {
  const up = depth ? '../'.repeat(depth) : './';
  return html
    .replace(/(\s(?:href|src|data-lightbox)=")\/(?!\/)/g, `$1${up}`)
    .replace(/(\ssrcset=")([^"]+)"/g, (_, a, set) => `${a}${set.replace(/(^|,\s*)\/(?!\/)/g, `$1${up}`)}"`)
    .replace(/url\(\/(?!\/)/g, `url(${up}`);
}

for (const page of PAGES) {
  let html;
  try { html = await read(page); } catch { console.log('nema', page); continue; }
  // Na kontakt stranici je forma u prvom ekranu, pa se ceo CSS učitava odmah; drugde asinhrono.
  const cssHref = `/assets/css/style.css?v=${hash(css)}`;
  const cssLink = page === 'kontakt/index.html'
    ? `<link rel="stylesheet" href="${cssHref}">`
    : `<link rel="stylesheet" href="${cssHref}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="${cssHref}"></noscript>`;
  html = between(html, 'head', head.replace('{{CSS_LINK}}', cssLink));
  const route = page === 'index.html' ? '/' : '/' + page.replace('index.html', '');
  const hdr = header.replace(`href="${route}"`, `href="${route}" aria-current="page"`);
  html = between(html, 'header', hdr);
  html = between(html, 'footer', footer);
  html = html.replace(/(<picture\s[^>]*data-img="[^"]+"[^>]*>)[\s\S]*?<\/picture>/g, (_, open) => picture(open));
  // Relativne putanje: stranice rade i kad se otvore direktno sa diska i na podfolderu.
  // 404.html ostaje apsolutna jer je server prikazuje na bilo kojoj adresi.
  if (page !== '404.html') html = relative(html, page.split('/').length - 1);
  await writeFile(path.join(ROOT, page), html);
  console.log('ok', page);
}
