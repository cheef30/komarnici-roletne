// Screenshotovi stranica na 390, 768 i 1440 px (Playwright).
// node scripts/shots.mjs <izlazni-folder> [putanja ...]
import { chromium } from 'playwright';
const [out, ...paths] = process.argv.slice(2);
const routes = paths.length ? paths : ['/', '/komarnici/', '/roletne/', '/servis/', '/kontakt/', '/404.html'];
const widths = (process.env.W || '390,768,1440').split(',').map(Number);
const browser = await chromium.launch();
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 800 ? 844 : 900 }, deviceScaleFactor: 1 });
  for (const r of routes) {
    await page.goto((process.env.BASE || 'http://localhost:4321') + r, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);
    const name = (r === '/' ? 'naslovna' : r.replace(/\//g, '').replace('.html', '')) + `-${w}`;
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    if (process.env.FOLD) await page.screenshot({ path: `${out}/${name}-fold.png` });
  }
  await page.close();
}
await browser.close();
