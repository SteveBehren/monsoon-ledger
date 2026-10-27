// The share images: link preview cards (1200 x 630) and the site icons, drawn as SVG and
// rendered to PNG with @resvg/resvg-js, using the Inter font files in scripts/fonts/ (OFL).
// One pipeline for everything:
//   - the site build imports siteCard, receiptCard and renderPng (site/src/pages/og/) and
//     renders a card for the site and for every promise receipt, in both languages, so a
//     card always matches the data it was built from and says "as of" which day;
//   - running this file directly regenerates the icons in site/public/:
//       node scripts/make-share-images.mjs
//     favicon.svg, favicon.ico (16, 32, 48), favicon-32.png, apple-touch-icon.png (180),
//     icon-192.png, icon-512.png and icon-maskable-512.png.
// Nothing here reads data files: callers pass in the words, so the numbers on a card come
// from scripts/promises.mjs like everywhere else.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const COLOURS = {
  bg: '#0a0e13',
  accent: '#5cc2cc',
  ink: '#e4e9ee',
  soft: '#a3aebb',
  faint: '#8190a0',
  red: '#ef7b7f',
  amber: '#e2b45c',
  green: '#6fcf9f',
};
const C = COLOURS;
const FONT = 'Inter';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The mark: two ledger rules with an isobar running between them.
const markInner = `<path d="M6 10h20M6 24h20" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
    <path d="M5.5 17.5q2.6-4.4 5.2 0t5.2 0 5.2 0 5.2 0" fill="none" stroke="${C.accent}" stroke-width="2.6" stroke-linecap="round"/>`;

/** The brand mark as a standalone SVG. pad keeps it inside a maskable icon's safe zone. */
export function markSvg(size, { pad = 0, radius = 6 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  <rect width="32" height="32" rx="${radius}" fill="${C.bg}"/>
  <g transform="translate(${pad} ${pad}) scale(${(32 - pad * 2) / 32})">
    ${markInner}
  </g>
</svg>`;
}

const markAt = (x, y, size) =>
  `<g transform="translate(${x} ${y}) scale(${size / 32})"><rect width="32" height="32" rx="6" fill="${C.bg}" stroke="${C.ink}" stroke-opacity="0.15"/>${markInner}</g>`;

// Faint isobars behind the right half of a card. Decoration only.
function isobars(cx, cy, opacityKey = 0.55) {
  let d = '';
  for (let k = 1; k <= 11; k++) {
    const pts = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const r = (18 + k * 30) * (1 + 0.13 * Math.sin(2 * a + k * 0.45) + 0.06 * Math.sin(3 * a - k * 0.3));
      pts.push(`${(cx + r * Math.cos(a) * 1.25).toFixed(1)} ${(cy + r * Math.sin(a) * 0.85).toFixed(1)}`);
    }
    d += `<path d="M${pts.join(' L')}Z" fill="none" stroke="${C.accent}" stroke-opacity="${k === 4 ? opacityKey : 0.16}" stroke-width="${k === 4 ? 2 : 1.1}"/>`;
  }
  return d;
}

// Approximate Inter advance widths, in em, good enough to wrap lines without a text engine.
function textWidth(text, size, weight = 400) {
  let em = 0;
  for (const ch of text) {
    if (' .,:;!|il1jtfr\'"()[]'.includes(ch)) em += 0.3;
    else if ('mwMW'.includes(ch)) em += 0.86;
    else if (ch >= 'A' && ch <= 'Z') em += 0.68;
    else if (ch >= '0' && ch <= '9') em += 0.6;
    else em += 0.56;
  }
  return em * size * (weight >= 600 ? 1.04 : 1);
}

/** Greedy word wrap. Lines past maxLines are cut with an ellipsis. */
export function wrap(text, size, maxWidth, { weight = 400, maxLines = 3 } = {}) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, size, weight) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[\s,.;:]+$/, '')}…`;
    return kept;
  }
  return lines;
}

const tspans = (lines, x, y, step) => lines.map((l, i) => `<tspan x="${x}" y="${y + i * step}">${esc(l)}</tspan>`).join('');

function frame(inner, footer) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="0.8" cy="0.45" r="0.75">
      <stop offset="0" stop-color="#12303a"/>
      <stop offset="0.62" stop-color="${C.bg}"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#glow)"/>
  ${isobars(960, 300)}
  ${markAt(72, 64, 52)}
  <text x="140" y="100" font-family="${FONT}" font-weight="600" font-size="30" fill="${C.ink}">Monsoon Ledger</text>
  ${inner}
  <text x="72" y="584" font-family="${FONT}" font-size="22" fill="${C.soft}">${esc(footer)}</text>
</svg>`;
}

/** The site-wide card: kicker, tagline, footer line. */
export function siteCard({ kicker, tagline, foot }) {
  const lines = wrap(tagline, 54, 760, { weight: 600, maxLines: 4 });
  return frame(
    `<text font-family="${FONT}" font-size="20" letter-spacing="2" fill="${C.accent}"><tspan x="72" y="196">${esc(kicker.toUpperCase())}</tspan></text>
  <text font-family="${FONT}" font-weight="600" font-size="54" fill="${C.ink}">${tspans(lines, 72, 270, 64)}</text>`,
    foot,
  );
}

const TONES = { missed: C.red, open: C.amber, met: C.green, 'no-deadline': C.soft };

/**
 * A receipt card. Words come from the caller, in the page's language:
 *   { kicker, promised, said, outcome, stamp, count, asOf, site }
 * outcome picks the colour; stamp is its label; count is the line next to it.
 */
export function receiptCard({ kicker, promised, said, outcome, stamp, count, asOf, site }) {
  const tone = TONES[outcome] ?? C.soft;
  const big = wrap(promised, 50, 1000, { weight: 600, maxLines: 3 });
  const saidLines = wrap(said, 25, 1000, { maxLines: 2 });
  const top = 238;
  const saidY = top + big.length * 60 + 18;
  const stampText = stamp.toUpperCase();
  const stampW = Math.round(textWidth(stampText, 22, 600) + stampText.length * 1.5 + 56);
  const statusY = 470;
  return frame(
    `<text font-family="${FONT}" font-size="20" letter-spacing="2" fill="${C.accent}"><tspan x="72" y="176">${esc(kicker.toUpperCase())}</tspan></text>
  <text font-family="${FONT}" font-weight="600" font-size="50" fill="${C.ink}">${tspans(big, 72, top, 60)}</text>
  <text font-family="${FONT}" font-size="25" fill="${C.soft}">${tspans(saidLines, 72, saidY, 34)}</text>
  <rect x="72" y="${statusY}" width="${stampW}" height="44" rx="22" fill="${tone}" fill-opacity="0.14" stroke="${tone}" stroke-width="1.5"/>
  <circle cx="94" cy="${statusY + 22}" r="6" fill="${tone}"/>
  <text x="110" y="${statusY + 30}" font-family="${FONT}" font-weight="600" font-size="22" letter-spacing="1.5" fill="${tone}">${esc(stampText)}</text>
  <text x="${72 + stampW + 20}" y="${statusY + 32}" font-family="${FONT}" font-weight="600" font-size="32" fill="${C.ink}">${esc(count)}</text>
  <text x="1128" y="584" text-anchor="end" font-family="${FONT}" font-size="20" fill="${C.faint}">${esc(asOf)}</text>`,
    site,
  );
}

/** An analysis paper: number, title, subtitle, and the day its facts were checked. */
export function paperCard({ kicker, title, subtitle, byline, asOf, site }) {
  const big = wrap(title, 64, 1000, { weight: 600, maxLines: 2 });
  const top = 250;
  const subY = top + big.length * 74 + 8;
  const sub = wrap(subtitle, 28, 1000, { maxLines: 3 });
  return frame(
    `<text font-family="${FONT}" font-size="20" letter-spacing="2" fill="${C.accent}"><tspan x="72" y="176">${esc(kicker.toUpperCase())}</tspan></text>
  <text font-family="${FONT}" font-weight="600" font-size="64" fill="${C.ink}">${tspans(big, 72, top, 74)}</text>
  <text font-family="${FONT}" font-size="28" fill="${C.soft}">${tspans(sub, 72, subY, 38)}</text>
  <text x="72" y="${subY + sub.length * 38 + 34}" font-family="${FONT}" font-size="22" fill="${C.faint}">${esc(byline)}</text>
  <text x="1128" y="584" text-anchor="end" font-family="${FONT}" font-size="20" fill="${C.faint}">${esc(asOf)}</text>`,
    site,
  );
}

/**
 * Renders an SVG string to a PNG buffer. The caller passes the Resvg class from
 * @resvg/resvg-js and the font folder, so this file works from the build and from the CLI.
 */
export function renderPng(svg, { Resvg, fontDir, width }) {
  const fontFiles = ['Inter-Regular.otf', 'Inter-SemiBold.otf'].map((f) => path.join(fontDir, f));
  const resvg = new Resvg(svg, {
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: FONT },
    ...(width ? { fitTo: { mode: 'width', value: width } } : {}),
  });
  return resvg.render().asPng();
}

/** ICO with embedded PNG images, supported by every current browser. */
export function ico(images) {
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

// CLI: regenerate the icons.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { ROOT, siteRequire } = await import('./lib.mjs');
  const { Resvg } = siteRequire('@resvg/resvg-js');
  const OUT = path.join(ROOT, 'site', 'public');
  const opts = (width) => ({ Resvg, fontDir: path.join(ROOT, 'scripts', 'fonts'), width });
  const icon = (size, o) => renderPng(markSvg(size, o), opts(size));

  fs.writeFileSync(path.join(OUT, 'favicon.svg'), `${markSvg(32).trim()}\n`);
  const small = [16, 32, 48].map((size) => ({ size, data: icon(size) }));
  fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico(small));
  fs.writeFileSync(path.join(OUT, 'favicon-32.png'), small[1].data);
  // iOS draws its own rounded corners, so the touch icon is a full square.
  fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), icon(180, { radius: 0, pad: 3 }));
  fs.writeFileSync(path.join(OUT, 'icon-192.png'), icon(192));
  fs.writeFileSync(path.join(OUT, 'icon-512.png'), icon(512));
  // Maskable icons keep the mark inside the central 80 percent safe zone.
  fs.writeFileSync(path.join(OUT, 'icon-maskable-512.png'), icon(512, { radius: 0, pad: 5 }));
  console.log('Icons written to site/public/. Preview cards are rendered by the site build.');
}
