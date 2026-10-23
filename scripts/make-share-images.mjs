// node scripts/make-share-images.mjs
//
// Regenerates the icons and link preview images in site/public/ from the brand mark.
// Needs Playwright with a Chromium build. It is a one-off design tool, not part of the
// site build, so Playwright is not a project dependency:
//   PLAYWRIGHT=/path/to/playwright/index.mjs node scripts/make-share-images.mjs
//
// Writes:
//   favicon.svg, favicon.ico (16, 32, 48), favicon-32.png, apple-touch-icon.png (180),
//   icon-192.png, icon-512.png, icon-maskable-512.png, og-en.jpg and og-id.jpg (1200 x 630).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const OUT = path.join(ROOT, 'site', 'public');
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

const BG = '#0a0e13';
const ACCENT = '#5cc2cc';
const INK = '#e4e9ee';

// The mark: two ledger rules with an isobar running between them.
const mark = (size, { pad = 0, radius = 6, bg = BG } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  <rect width="32" height="32" rx="${radius}" fill="${bg}"/>
  <g transform="translate(${pad} ${pad}) scale(${(32 - pad * 2) / 32})">
    <path d="M6 10h20M6 24h20" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
    <path d="M5.5 17.5q2.6-4.4 5.2 0t5.2 0 5.2 0 5.2 0" fill="none" stroke="${ACCENT}" stroke-width="2.6" stroke-linecap="round"/>
  </g>
</svg>`;

async function png(html, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${html}</body></html>`);
  const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width, height } });
  await page.close();
  return buf;
}

// ICO with embedded PNG images, supported by every current browser.
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    dir.push(e);
  }
  return Buffer.concat([header, ...dir, ...images.map((i) => i.data)]);
}

fs.writeFileSync(path.join(OUT, 'favicon.svg'), mark(32).trim() + '\n');
const small = [];
for (const size of [16, 32, 48]) small.push({ size, data: await png(mark(size), size, size) });
fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico(small));
fs.writeFileSync(path.join(OUT, 'favicon-32.png'), small[1].data);
// iOS draws its own rounded corners, so the touch icon is a full square.
fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), await png(mark(180, { radius: 0, pad: 3 }), 180, 180));
fs.writeFileSync(path.join(OUT, 'icon-192.png'), await png(mark(192), 192, 192));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), await png(mark(512), 512, 512));
// Maskable icons keep the mark inside the central 80 percent safe zone.
fs.writeFileSync(path.join(OUT, 'icon-maskable-512.png'), await png(mark(512, { radius: 0, pad: 5 }), 512, 512));

// Link preview cards, one per language.
function isobars() {
  let d = '';
  const cx = 930;
  const cy = 300;
  for (let k = 1; k <= 11; k++) {
    const n = 64;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = (18 + k * 30) * (1 + 0.13 * Math.sin(2 * a + k * 0.45) + 0.06 * Math.sin(3 * a - k * 0.3));
      pts.push([cx + r * Math.cos(a) * 1.25, cy + r * Math.sin(a) * 0.85]);
    }
    d += `<path d="M${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L')}Z" fill="none" stroke="${ACCENT}" stroke-opacity="${k === 4 ? 0.85 : 0.22}" stroke-width="${k === 4 ? 2.2 : 1.2}"/>`;
  }
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" style="position:absolute;inset:0">${d}<circle cx="${cx}" cy="${cy}" r="6" fill="${ACCENT}"/></svg>`;
}

const cards = {
  en: {
    kicker: 'An independent AI governance tracker',
    tagline: 'AI governance from the archipelago, promises checked against the record.',
    foot: 'English and Bahasa Indonesia · Sourced · Open data',
  },
  id: {
    kicker: 'Pelacak independen tata kelola AI',
    tagline: 'Catatan janji dan kenyataan tata kelola AI di Nusantara.',
    foot: 'Bahasa Indonesia dan Inggris · Bersumber · Data terbuka',
  },
};

for (const [lang, c] of Object.entries(cards)) {
  const html = `
  <div style="position:relative;width:1200px;height:630px;overflow:hidden;background:radial-gradient(120% 90% at 78% 45%, #12303a 0%, ${BG} 62%);font-family:-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${INK}">
    ${isobars()}
    <div style="position:absolute;left:72px;top:72px;right:420px">
      <div style="display:flex;align-items:center;gap:18px">
        ${mark(64)}
        <span style="font-size:30px;font-weight:600;letter-spacing:0.01em">Monsoon Ledger</span>
      </div>
      <p style="margin:56px 0 0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:20px;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT}">${c.kicker}</p>
      <p style="margin:18px 0 0;font-size:52px;line-height:1.15;font-weight:600;letter-spacing:-0.01em">${c.tagline}</p>
    </div>
    <p style="position:absolute;left:72px;bottom:56px;margin:0;font-size:22px;color:#a3aebb">${c.foot}</p>
  </div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(`<!doctype html><html><body style="margin:0">${html}</body></html>`);
  // JPEG keeps the card well under the size limit WhatsApp applies to preview images.
  fs.writeFileSync(path.join(OUT, `og-${lang}.jpg`), await page.screenshot({ type: 'jpeg', quality: 86 }));
  await page.close();
}

await browser.close();
console.log('Icons and preview images written to site/public/.');
