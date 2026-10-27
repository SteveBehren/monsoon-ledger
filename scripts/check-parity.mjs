// npm run parity
//
// Checks that English and Bahasa Indonesia stay in step:
//   1. Field twins: in the data files, every non-empty <field>_en has a non-empty <field>_id.
//   2. Routes (with --routes, after a build): every page under site/dist/en/ has a twin under
//      site/dist/id/ and the other way round, unless the page that exists is marked partial with
//      <meta name="ml:partial" content="true">.
// It fails (exit code 1) on any gap, so the site build fails too. Tests: scripts/parity.test.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Some twins have a Bahasa Indonesia name of their own: an entry's summary_en pairs with ringkasan_id.
export const TWIN_ALIASES = { summary: ['summary_id', 'ringkasan_id'] };
// Files with English-only machine text (the Radar's triage summaries).
export const SKIP_FILES = new Set(['radar.yml', 'scan-log.yml', 'quote-check.yml']);

/** Every place in a value where <key>_en is set and <key>_id is missing or empty. */
export function twinGaps(value, where = '') {
  const gaps = [];
  const visit = (v, at) => {
    if (Array.isArray(v)) return v.forEach((x, i) => visit(x, `${at}[${i}]`));
    if (!v || typeof v !== 'object') return;
    for (const [k, x] of Object.entries(v)) {
      const m = /^(.+)_en$/.exec(k);
      const twins = TWIN_ALIASES[m?.[1]] ?? [`${m?.[1]}_id`];
      if (m && filled(x) && !twins.some((t) => filled(v[t]))) gaps.push(`${at}.${k} has no ${twins.join(' or ')}`);
      visit(x, `${at}.${k}`);
    }
  };
  visit(value, where);
  return gaps;
}

const filled = (x) => (Array.isArray(x) ? x.length > 0 : x !== undefined && x !== null && String(x).trim() !== '');

/** Page paths (relative to a language folder) that exist in one language and not the other. */
export function routeGaps(dist) {
  const pages = (lang) => {
    const root = path.join(dist, lang);
    const out = new Map();
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, item.name);
        if (item.isDirectory()) walk(p);
        else if (item.name === 'index.html') out.set(path.relative(root, dir), p);
      }
    };
    walk(root);
    return out;
  };
  const en = pages('en');
  const id = pages('id');
  const partial = (file) => /<meta name="ml:partial" content="true"/.test(fs.readFileSync(file, 'utf8'));
  const gaps = [];
  for (const [p, file] of en) if (!id.has(p) && !partial(file)) gaps.push(`/en/${p}/ has no /id/ twin`);
  for (const [p, file] of id) if (!en.has(p) && !partial(file)) gaps.push(`/id/${p}/ has no /en/ twin`);
  return gaps;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { DATA, ROOT, readYaml } = await import('./lib.mjs');
  const gaps = [];
  const files = [];
  const walk = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, item.name);
      if (item.isDirectory()) walk(p);
      else if (/\.ya?ml$/.test(item.name) && !SKIP_FILES.has(item.name)) files.push(p);
    }
  };
  walk(DATA);
  for (const f of files) for (const g of twinGaps(readYaml(f), path.relative(ROOT, f))) gaps.push(g);
  let routes = 0;
  if (process.argv.includes('--routes')) {
    const dist = path.join(ROOT, 'site', 'dist');
    if (!fs.existsSync(dist)) {
      console.error('Parity: site/dist does not exist. Build the site first.');
      process.exit(1);
    }
    const r = routeGaps(dist);
    routes = fs.readdirSync(path.join(dist, 'en'), { recursive: true }).filter((f) => String(f).endsWith('index.html')).length;
    gaps.push(...r);
  }
  if (gaps.length) {
    console.error(`Parity failed with ${gaps.length} gap(s):\n`);
    for (const g of gaps) console.error(`  x ${g}`);
    process.exit(1);
  }
  console.log(`Parity passed: ${files.length} data files${routes ? `, ${routes} English pages, each with a Bahasa Indonesia twin` : ''}.`);
}
