// Preuzima prave fotografije radova sa Google profila firme i pravi
// optimizovane verzije (AVIF, WebP, JPG) u assets/img/.
//
// Pokretanje:  node scripts/fetch-images.mjs             (preuzmi + obradi)
//              node scripts/fetch-images.mjs --download  (samo preuzmi u scripts/raw/)
//              node scripts/fetch-images.mjs --process   (samo obradi postojece originale)
//
// Zahteva Node 18+ i `npm i -D sharp`.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'scripts', 'raw');
const OUT = path.join(ROOT, 'assets', 'img');
const PREFIX = 'https://lh3.googleusercontent.com/';
const SUFFIX = '=w2400';

// Redni brojevi fotografija na Google profilu i njihovi ID-jevi.
const SOURCES = {
  0: 'gps-cs-s/ANWiy9QOtRULEBzPRnvBWay8MNiVxI4QQH01aeHI2f-6kvrleTqJwqOWueZdokS6vdfSfGmLDDR5S_jl3GBsWNem5XwSwWPoP3G0wRIptH-tSU2GsyBiCo2iNCj1qppfHAP3UkZwTMivAWw0kDc',
  1: 'gps-cs-s/ANWiy9S6xeqnPzhIPopvZXlTeyyMPAsaZ0uVyD7PaT1cdXTcDtgBerSQpLuYI_BC7dD5PpbB-MHQl13OGEk7XjZ4vZA8vrj8_83Sc-YHKvABEhtcVQzQS1MCAbhdDgfdnXAc3VhgzV6kdRS9HsI',
  2: 'gps-cs-s/ANWiy9TkhwP28Bt7WagYcik3f4ZjaJUJHDxIFgUT_okWmFMjWG4qXZ83m5MLjnZbyRK5kdNT_hmPzF-98QnBwi_gQpE_hrOsaoH5bH2uakGF8tv6g0hvC274LQBcz9BgUYYquj4ivnOSgS7HWn3y',
  3: 'gps-cs-s/ANWiy9T_24g1iezmigvaZ3j4PtobaNcXnDg1ePPSZgozNSzS5rvwEPMM_W0UIf_TICZprmEri_NC2ksDcM5I2VR-Txo6nupKAsUZZ6sXgRpYj-05LvoMj_qrFkVRVC-ZtGmIs8WwrAlUZtn8A144',
  4: 'gps-cs-s/ANWiy9TBThRND6m0r0i5gpi8OGzXzQPGNlK-_z-i_W5Oa3WBRq9dtlddFSxUwES38oRJYr_uA4iy8Bofdpjww6YiQl9haWZe1whBsvMhcCR8pKpqjX4FGQrmP8AlBSzpjqhsxqisD6pHH2x23I8',
  5: 'gps-cs-s/ANWiy9QG4E1Q74IokTIwTkqTAPIW-dV67quGwN1oEIInxH_9NCvEdPrgFskUrplZTVprV1T0clH_FKcBfYZgfGh_RrXDqd3B2BpBjQ2Lj-WH1Miap3fmKmrM_r0Q6XbbHfdx6VtljLYTFwE9HjiD',
  6: 'gps-cs-s/ANWiy9TUMZ3jGzzx3RJ0-5DTDH9HJZ-iWVyG5g9NB2X5EAD7LMLr3xpngTl9DImbxFxXBq0gTJUqQCoxU4keb_LjFV0SLqBKRUR1dil3w2mYiFo29qEZv9vogYv0vytOCnBntI4GreVyWzSROt1U',
  7: 'gps-cs-s/ANWiy9Siz7HgrYrx7-Y2c7DdzlxMhAT2BNK4CO92YgGWml6SS9tRtsEXlx0NkDAKdPlcBksMFSP6M4EONc1vLRi7gVC4v2rx5ch0rHNr_FWrvrMr0nD5EemnwR-upOTCKCCs0jaNxVKawuUyVxra',
  8: 'gps-cs-s/ANWiy9RuDfBnoXMJcnWhaX9M6-kX7yZc7-5L3LvWMOvzmAh-HI647hQKNbxIOMy8_v3b8enjKvLd92mRnAaKc9yGQzifjypW2cz_BIz5-fjezNjE_NeDsaEVlqLgI_PMbKzEA828L7bBB8T7WuM',
  9: 'gps-cs-s/ANWiy9SgHhCQdl_WJ3TPPodW4JkuzlrgRqAOT312l3k1fCKfS9XMs7otreGbdvGvyFa-kyATT8tLdtx006eS8ndgodHuzHt9Q85kWHM3UjvsQY7DyLsUJ3tBKjcliknqgy9K5DTmI8VI9wQDsp-0',
  10: 'gps-cs-s/ANWiy9RI6u0IBoGcgb_yrx9qZGfjLpVCX84GD8Y2EMsgCZAYAttDpn_igPOnH8c2671HyzqsxE4lTCwbMidcCow6MxHyltizRpqn7rxEK256XpLegrNHFq-2FbnozzL01mQ2iWB6TaxyVs5dBDU',
  11: 'gps-cs-s/ANWiy9QvZngke-viSUUnmBKfgdQiRuAn6oMzwLRGWJKPQhevPgkY2NgdIEbxyUvoK-tqGHKexjG1sawz3oaaK31ZhB2zkUIbxGiDMWJDkxsSiCoN2_YteP6tIgHQEtiGamRdt22ghNF8KlRzzGsM',
  12: 'gps-cs-s/ANWiy9SEWD0L4BXXXc7sX5dbWzp_6YpbM8ZkAHErkzHewC8uuOGzPcxBd8-zG2ZwwdwfDiweP3b8FunzCTyeKs2wuumYy8l0yw6lqYUb32hciVYwIm6iNJ-WdcQ9jLwO1-oVaVV_c48xtywBL85-',
  14: 'gps-cs-s/ANWiy9R-MGWCgjd1lM6yn3JvtG1adQZruLX8OeVXhZV1aMIAaT4ccMidE9U-TEW_pbAfVmqY9pD4BgHZ342YjkHj0mM1nwCC_zuV5xTA21Y2BJptONbBuSSK7OOZM5VE0yJKVlMoui9ALE8oHqXh',
};

// Posle pregleda svake fotografije (vidi README u scripts/):
//  #2  ima natpis preko sredine kadra, ne koristi se
//  #12 su drvene skure, ne aluminijumske roletne, ne koristi se
//  #14 reklamni bilbord u kadru, ne koristi se
//  #10 prikazuje aluminijumske roletne (jedna spustena do pola), ne komarnik
//  #8, #9, #11 Google daje samo u 405x900, koriste se samo u malim formatima
//
// crop: { left, top, width, height } u procentima originala
const PHOTOS = [
  { id: 4, name: 'plise-komarnik-balkonski-prozor-i-vrata', crop: { left: 0, top: 3, width: 100, height: 93.75 }, widths: [480, 800, 1200, 1600, 2000] },
  { id: 10, name: 'aluminijumske-roletne-pogled-na-beograd', crop: { left: 0, top: 4, width: 100, height: 93.75 }, widths: [480, 800, 1200, 1600, 2000] },
  { id: 10, name: 'aluminijumske-roletne-pogled-na-beograd-siroko', crop: { left: 0, top: 21, width: 100, height: 50 }, widths: [480, 800, 1200, 1600, 2000] },
  { id: 0, name: 'plise-komarnici-za-vrata-antracit', widths: [480, 800, 1200, 1600] },
  { id: 3, name: 'plise-komarnik-za-balkonska-vrata', widths: [480, 800, 1200, 1600] },
  { id: 5, name: 'plise-komarnik-prozor-pogled-iznutra', widths: [480, 800, 1200, 1600] },
  { id: 6, name: 'izrada-komarnika-aluminijumski-profil', widths: [480, 800, 1200, 1600] },
  { id: 7, name: 'komarnik-prozor-potkrovlje-spolja', widths: [480, 800, 1200, 1600] },
  { id: 8, name: 'komarnik-za-vrata-beli-okvir', widths: [480] },
  { id: 9, name: 'komarnik-za-ulazna-vrata-beli', widths: [480] },
  { id: 11, name: 'plise-komarnik-antracit-okvir', widths: [480] },
  { id: 1, name: 'aluminijumska-roletna-gurtna', widths: [480, 800, 1200, 1600] },
  { id: 1, name: 'aluminijumska-roletna-gurtna-portret', crop: { left: 0, top: 0, width: 100, height: 93.75 }, widths: [480, 800, 1200, 1600, 2000] },
];

const exists = (p) => access(p).then(() => true, () => false);
const rawPath = (id) => path.join(RAW, `${id}.jpg`);

async function download(id) {
  const file = rawPath(id);
  if (await exists(file)) return;
  const res = await fetch(PREFIX + SOURCES[id] + SUFFIX);
  if (!res.ok) throw new Error(`#${id}: HTTP ${res.status}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  console.log(`preuzeto  #${id}`);
}

// Ujednacavanje: blago podignut kontrast i ostrina, nijanse ostaju iste.
async function base(p) {
  const { data, info } = await sharp(rawPath(p.id)).rotate().toBuffer({ resolveWithObject: true });
  let img = sharp(data);
  if (p.crop) {
    const c = p.crop;
    img = img.extract({
      left: Math.round((c.left / 100) * info.width),
      top: Math.round((c.top / 100) * info.height),
      width: Math.round((c.width / 100) * info.width),
      height: Math.round((c.height / 100) * info.height),
    });
  }
  return img
    .linear(1.06, -(128 * 0.06))
    .sharpen({ sigma: 0.7, m1: 0.5, m2: 1.5 })
    .toBuffer({ resolveWithObject: true });
}

async function processPhoto(p) {
  const { data, info } = await base(p);
  let widths = p.widths.filter((w) => w <= info.width);
  if (!widths.length) widths = [info.width];
  for (const w of widths) {
    const resized = () => sharp(data).resize({ width: w, withoutEnlargement: true });
    const stem = path.join(OUT, `${p.name}-${w}`);
    // sharp ne prenosi EXIF i ostale metapodatke bez withMetadata()
    await resized().avif({ quality: 50, effort: 6 }).toFile(`${stem}.avif`);
    await resized().webp({ quality: 72, effort: 6 }).toFile(`${stem}.webp`);
    await resized().jpeg({ quality: 76, mozjpeg: true }).toFile(`${stem}.jpg`);
  }
  console.log(`obradjeno #${p.id}  ${p.name}  ${info.width}x${info.height}  [${widths.join(', ')}]`);
  return { id: p.id, width: info.width, height: info.height, widths };
}

const mode = process.argv[2];
await mkdir(RAW, { recursive: true });
await mkdir(OUT, { recursive: true });

if (mode !== '--process') {
  for (const id of Object.keys(SOURCES)) await download(id);
}
if (mode !== '--download') {
  const manifest = {};
  for (const p of PHOTOS) manifest[p.name] = await processPhoto(p);
  await writeFile(path.join(ROOT, 'scripts', 'images.json'), JSON.stringify(manifest, null, 2) + '\n');
}
