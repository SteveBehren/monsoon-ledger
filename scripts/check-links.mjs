// npm run links
// 1. Internal links (no network): in the built site (site/dist), every link to a page on the
//    site must reach a file, and every #anchor must exist on its page. Broken internal links
//    exit with code 1. Skipped if the site has not been built.
// 2. External sources: requests every source url in the entries, deadlines, instruments,
//    analysis sources, the frontier incident reference and the reading list, and prints the
//    ones that look broken. Informational only. Skip it with --internal.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, DATA, ENTRIES, readYaml, entryFiles } from './lib.mjs';

/** Broken internal links in a built site: [{ page, href }]. */
export function internalBroken(dist) {
  const pages = [];
  const walk = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, item.name);
      if (item.isDirectory()) walk(p);
      else if (item.name.endsWith('.html')) pages.push(p);
    }
  };
  walk(dist);
  const ids = new Map();
  const idsOf = (file) => {
    if (!ids.has(file)) ids.set(file, new Set([...fs.readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
    return ids.get(file);
  };
  const target = (pathname) => {
    const clean = decodeURIComponent(pathname);
    const candidates = [path.join(dist, clean), path.join(dist, clean, 'index.html')];
    return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null;
  };
  const broken = [];
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    const here = '/' + path.relative(dist, page).replace(/index\.html$/, '').split(path.sep).join('/');
    for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
      const href = m[1].replace(/&amp;/g, '&');
      if (/^(https?:|mailto:|data:|javascript:)/.test(href) || href.startsWith('//')) continue;
      const url = new URL(href, `https://site.invalid${here}`);
      const file = url.pathname === here && href.startsWith('#') ? page : target(url.pathname);
      if (!file) {
        broken.push({ page: here, href });
        continue;
      }
      const hash = decodeURIComponent(url.hash.slice(1));
      // The ontology explorer reads its hash with a script to select an object, so it has no static ids.
      const scripted = /\/ontology\/$/.test(url.pathname);
      if (hash && !scripted && file.endsWith('.html') && !idsOf(file).has(hash)) broken.push({ page: here, href });
    }
  }
  return broken;
}

const dist = path.join(ROOT, 'site', 'dist');
if (fs.existsSync(dist)) {
  const broken = internalBroken(dist);
  if (broken.length) {
    console.log(`${broken.length} broken internal link(s):`);
    for (const b of broken) console.log(`  ${b.page}  ->  ${b.href}`);
    process.exitCode = 1;
  } else {
    console.log('Internal links: every page link and #anchor in site/dist resolves.');
  }
} else {
  console.log('Internal links: site/dist not found, build the site first to check them.');
}
if (process.argv.includes('--internal')) process.exit(process.exitCode ?? 0);

const urls = new Map();
const add = (url, where) => {
  if (!url) return;
  if (!urls.has(url)) urls.set(url, new Set());
  urls.get(url).add(where);
};

for (const name of entryFiles()) {
  const entry = readYaml(path.join(ENTRIES, name));
  for (const s of entry?.sources ?? []) add(s.url, `entries/${name}`);
}
for (const row of readYaml(path.join(DATA, 'deadlines.yml')) ?? []) add(row.source_url, 'deadlines.yml');
for (const row of readYaml(path.join(DATA, 'instruments.yml')) ?? []) add(row.source_url, 'instruments.yml');
const analysisDir = path.join(DATA, 'analysis');
for (const f of fs.existsSync(analysisDir) ? fs.readdirSync(analysisDir).filter((x) => x.endsWith('.sources.yml')) : []) {
  for (const row of readYaml(path.join(analysisDir, f)) ?? []) add(row.url, `analysis/${f}`);
}
for (const row of readYaml(path.join(DATA, 'frontier-incidents.yml')) ?? []) for (const s of row.sources ?? []) add(s.url, 'frontier-incidents.yml');
for (const row of readYaml(path.join(DATA, 'reading.yml')) ?? []) add(row.url, 'reading.yml');

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; MonsoonLedgerLinkCheck/1.0; +https://github.com/SteveBehren/monsoon-ledger)',
  accept: 'text/html,application/pdf;q=0.9,*/*;q=0.8',
};

async function check(url) {
  let last = '';
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      if (res.body) await res.body.cancel().catch(() => {});
      if (res.ok) return { ok: true, status: res.status };
      last = `HTTP ${res.status}`;
    } catch (err) {
      last = err.cause?.code ?? err.name ?? 'error';
    }
  }
  return { ok: false, status: last };
}

const list = [...urls.keys()];
const results = new Map();
const queue = [...list];
await Promise.all(
  Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      results.set(url, await check(url));
    }
  }),
);

const broken = list.filter((u) => !results.get(u).ok);
console.log(`Checked ${list.length} unique urls.`);
if (broken.length === 0) {
  console.log('No broken links found.');
} else {
  console.log(`\n${broken.length} url(s) did not respond with a 2xx status:\n`);
  for (const url of broken) {
    console.log(`  ${results.get(url).status}  ${url}`);
    console.log(`        used in: ${[...urls.get(url)].join(', ')}`);
  }
  console.log('\nSome sites block automated requests. Open each one in a browser before changing anything.');
}
