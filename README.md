# komarnici-roletneservis.rs

Statičan sajt (HTML, CSS, vanilla JS) za Komarnici i Roletne Ivan, Beograd.
Radi bez build koraka, a ide pravo na Vercel ili GitHub Pages.

## Struktura

```
index.html, komarnici/, roletne/, servis/, kontakt/, 404.html
assets/css/critical.css   kritični CSS (ubacuje se inline u <head>)
assets/css/style.css      ostatak stilova, mobile first
assets/js/main.js         meni, tabovi, birač boje, lightbox, forma, mapa
assets/img/               AVIF, WebP i JPG u više širina
assets/fonts/             Archivo, jedan varijabilni fajl (debljina 400-820, širina 75-100)
assets/icons/             favicon set
partials/                 zajednički head, header i footer
scripts/                  pomoćne skripte (Node 18+)
```

## Izmene

Header, footer i zajednički `<head>` se menjaju u `partials/`, a zatim se pokrene:

```
npm install
node scripts/build.mjs
```

Ikonice su iz paketa `@phosphor-icons/core`, a WhatsApp i Viber logotipi iz `simple-icons`. Build ih sklapa u SVG sprajt u headeru.

Skripta prepisuje sadržaj između markera `<!-- @head -->`, `<!-- @header -->` i
`<!-- @footer -->` u svim stranicama, ubacuje `critical.css` inline, dodaje verziju
(`?v=hash`) na CSS i JS i od `<picture data-img="...">` pravi pune `<picture>` elemente
sa tačnim dimenzijama iz `scripts/images.json`.

Ostale skripte:

| Skripta | Šta radi |
| --- | --- |
| `scripts/fetch-images.mjs` | preuzima fotografije sa Google profila u `scripts/raw/` i pravi AVIF, WebP i JPG (480 do 2000 px), bez EXIF podataka |
| `scripts/build-font.py` | pravi `archivo-var.woff2` od punog Archivo fonta: samo znakovi koje sajt koristi i ose debljine i širine (python, `pip install fonttools brotli`) |
| `scripts/build-og.mjs` | pravi OG sliku 1200x630 |
| `scripts/build-icons.mjs` | pravi favicon.ico, PNG ikonice i apple-touch-icon |
| `scripts/shots.mjs` | screenshotovi svih stranica na 390, 768 i 1440 px |
| `scripts/check.mjs` | provera u browseru: linkovi, meni, tabovi, lightbox, forma, mapa, ciljevi za dodir |

Lokalno: `npx serve . -l 4321`, pa `node scripts/check.mjs`.

## Fotografije

Koriste se samo prave fotografije sa Google profila firme. Posle pregleda:

- #2 ima natpis preko sredine kadra, #14 ima reklamni bilbord, #13 i #15 nisu vezane za posao: ne koriste se.
- #12 prikazuje drvene škure, a ne aluminijumske roletne, pa se ne koristi.
- #10 prikazuje aluminijumske roletne sa pogledom na grad i služi kao hero stranice Roletne.
- #8, #9 i #11 Google daje samo u 405x900, pa se koriste samo u malim formatima.

## Deploy

**Vercel:** uvezite repozitorijum, framework "Other", bez build komande.
`vercel.json` uključuje čiste adrese, cache za `/assets/` (godinu dana, immutable) i
sigurnosna zaglavlja. `.vercelignore` isključuje `scripts/`, `partials/` i `node_modules/`.

**GitHub Pages:** objavite granu iz korena (fajl `CNAME` za domen je već tu).

Putanje u stranicama su relativne (`../assets/...`), pa se slike i stilovi vide i kad se
`index.html` otvori duplim klikom sa diska. Za klikanje između stranica lokalno pokrenite
`npx serve .`, jer browser sa diska otvara folder umesto stranice. Samo `404.html` ima
apsolutne putanje, jer je server prikazuje na bilo kojoj adresi.

Slike nemaju hash u imenu. Ako zamenite sliku pod istim imenom, dajte joj novo ime
jer se `/assets/` kešira godinu dana.

## TODO za vlasnika

- [ ] Radno vreme po danima. Google prikazuje samo "radi do 23:30". Kad se potvrdi, dodati
      `openingHoursSpecification` u JSON-LD na naslovnoj i ispisati ga u kontakt bloku
      (trenutno piše "Pozovite ili pošaljite poruku, javljamo se brzo").
- [ ] Garancija na komarnike i roletne: da li postoji i koliko traje (pitanje za FAQ).
- [ ] Rok izrade komarnika i roletni od merenja do ugradnje (pitanje za FAQ).
- [ ] Da li se doplata od 2 € po m² za antracit i braon odnosi i na roletne.
- [ ] Šta tačno razlikuje "rolo sa završnom lajsnom" od klasika, da tekst bude precizniji.
- [ ] Više fotografija roletni (posebno elektro motor i obe vrste kutija).
- [ ] Posle objave: prijaviti sajt i sitemap u Google Search Console. Google profil već vodi na komarnici-roletneservis.rs.
