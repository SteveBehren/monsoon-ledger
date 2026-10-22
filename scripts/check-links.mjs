// npm run links
// Requests every source url in the entries, deadlines and instruments and
// prints the ones that look broken. Informational only, always exits 0.
import path from 'node:path';
import { DATA, ENTRIES, readYaml, entryFiles } from './lib.mjs';

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
