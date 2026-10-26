// Provera sajta u browseru (Playwright): linkovi i resursi, meni, tabovi,
// birac boje, lightbox, forma, mapa i sticky traka.
//   npx serve . -l 4321   pa   node scripts/check.mjs [http://localhost:4321]

import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4321';
const PAGES = ['/', '/komarnici/', '/roletne/', '/servis/', '/kontakt/', '/404.html'];
let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'OK  ' : 'FAIL'} ${msg}`); if (!cond) failed++; };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// 1. svi interni linkovi i resursi (href, src, srcset) vracaju 200
const urls = new Set();
const external = new Set();
for (const p of PAGES) {
  await page.goto(BASE + p);
  const found = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('[href]').forEach((e) => out.push(e.getAttribute('href')));
    document.querySelectorAll('[src]').forEach((e) => out.push(e.getAttribute('src')));
    document.querySelectorAll('[srcset]').forEach((e) => e.getAttribute('srcset').split(',').forEach((s) => out.push(s.trim().split(' ')[0])));
    document.querySelectorAll('[data-lightbox]').forEach((e) => out.push(e.dataset.lightbox));
    return out;
  });
  for (const u of found) {
    if (!u || u.startsWith('#')) continue;
    if (/^(https?:|tel:|mailto:|viber:)/.test(u)) { external.add(u); continue; }
    urls.add(new URL(u.split('#')[0], BASE + p).pathname);
  }
}
for (const u of urls) {
  const res = await page.request.get(BASE + u);
  if (res.status() !== 200) ok(false, `${u} -> ${res.status()}`);
}
ok(true, `${urls.size} internih linkova i resursa proverno`);
for (const u of external) {
  const good = /^tel:\+381601930660$/.test(u)
    || u.startsWith('https://wa.me/381601930660')
    || u === 'viber://chat?number=%2B381601930660'
    || u === 'mailto:ivan.mijatovic.1984@gmail.com'
    || u.startsWith('https://www.google.com/maps')
    || u.startsWith('https://komarnici-roletneservis.rs/');
  ok(good, `spoljni link: ${u.slice(0, 90)}`);
}

// 2. 404
const r404 = await page.request.get(BASE + '/ne-postoji/');
ok(r404.status() === 404 && (await r404.text()).includes('Ova stranica ne postoji'), '404 stranica za nepostojeću adresu');

// 3. tabovi tastaturom
await page.goto(BASE + '/');
await page.focus('#tab-rolo');
await page.keyboard.press('ArrowRight');
ok(await page.evaluate(() => document.activeElement.id === 'tab-lajsna' && !document.getElementById('panel-lajsna').hidden && document.getElementById('panel-rolo').hidden), 'tabovi: strelica desno prebacuje panel i fokus');
await page.keyboard.press('End');
ok(await page.evaluate(() => document.activeElement.id === 'tab-unutrasnji'), 'tabovi: End ide na poslednji');

// 4. birac boje
await page.click('label:has(input[value=Antracit])');
ok(await page.evaluate(() => getComputedStyle(document.getElementById('okvir')).getPropertyValue('--frame').trim().toUpperCase() === '#3B3F42'), 'birač boje menja okvir u antracit');
ok((await page.textContent('[data-picker-name]')) === 'Antracit', 'birač boje menja natpis');

// 5. lightbox
const first = page.locator('[data-lightbox]').first();
await first.click();
ok(await page.isVisible('.lightbox'), 'lightbox se otvara');
ok(await page.evaluate(() => document.activeElement.classList.contains('lb-close')), 'lightbox: fokus na dugmetu za zatvaranje');
await page.keyboard.press('ArrowRight');
ok((await page.textContent('.lb-count')).startsWith('2 /'), 'lightbox: strelica lista dalje');
await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
ok(await page.evaluate(() => document.querySelector('.lightbox').contains(document.activeElement)), 'lightbox: fokus ostaje unutra');
await page.keyboard.press('Escape');
ok(!(await page.isVisible('.lightbox')) && await page.evaluate(() => document.activeElement.hasAttribute('data-lightbox')), 'lightbox: Esc zatvara i vraća fokus');

// 6. forma
await page.evaluate(() => { window.__opened = null; window.open = (u) => { window.__opened = u; }; });
await page.click('[data-quote-form] button[type=submit]');
ok(await page.evaluate(() => document.activeElement.id === 'f-ime' && document.getElementById('f-ime-err').textContent.length > 0), 'forma: prazna forma prikazuje greške i fokusira prvo polje');
await page.fill('#f-ime', 'Marko');
await page.fill('#f-telefon', '064 123 4567');
await page.selectOption('#f-usluga', 'Komarnici po meri');
await page.fill('#f-opis', 'Dva prozora 120 x 140');
await page.check('[name=slika]');
await page.click('[data-quote-form] button[type=submit]');
const wa = await page.evaluate(() => window.__opened);
ok(wa && wa.startsWith('https://wa.me/381601930660?text=') && decodeURIComponent(wa).includes('Ime: Marko') && decodeURIComponent(wa).includes('Mogu da pošaljem i sliku.'), 'forma: otvara WhatsApp sa sastavljenom porukom');

// 7. mapa na klik
ok((await page.locator('.map iframe').count()) === 0, 'mapa: iframe se ne učitava odmah');
await page.click('[data-map]');
ok((await page.locator('.map iframe').count()) === 1, 'mapa: iframe se učitava na klik');

// 8. meni i sticky traka na telefonu
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(BASE + '/komarnici/');
ok(!(await m.isVisible('#meni')), 'meni: zatvoren na telefonu');
await m.focus('.nav-toggle');
await m.keyboard.press('Enter');
ok(await m.isVisible('#meni') && (await m.getAttribute('.nav-toggle', 'aria-expanded')) === 'true', 'meni: otvara se tastaturom (aria-expanded=true)');
await m.keyboard.press('Escape');
ok(!(await m.isVisible('#meni')) && await m.evaluate(() => document.activeElement.classList.contains('nav-toggle')), 'meni: Esc zatvara i vraća fokus');
ok(!(await m.evaluate(() => document.querySelector('[data-mobile-bar]').classList.contains('show'))), 'sticky traka: skrivena na vrhu');
await m.mouse.wheel(0, 1500); await m.waitForTimeout(400);
ok(await m.evaluate(() => document.querySelector('[data-mobile-bar]').classList.contains('show')), 'sticky traka: pojavljuje se ispod hero sekcije');

// 9. dugmad i linkovi na telefonu najmanje 44x44 (osim linkova u tekstu)
const small = await m.evaluate(() => [...document.querySelectorAll('a.btn, button, .nav-toggle, .header-call, .tab, .site-footer li a, summary')]
  .filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return [e.textContent.trim().slice(0, 30), Math.round(r.width), Math.round(r.height)]; })
  .filter(([, w, h]) => w < 44 || h < 44));
ok(small.length === 0, `ciljevi za dodir >= 44px ${small.length ? JSON.stringify(small) : ''}`);

await browser.close();
console.log(failed ? `\n${failed} provera nije prošlo` : '\nSve provere su prošle');
process.exit(failed ? 1 : 0);
