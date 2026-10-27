// npm run check-quotes
//
// Checks that every direct quote appears, word for word, in its source. It reads each source
// (or, if the source cannot be read, its archived copy), normalises the text and looks for the
// quote's words. Results go to data/quote-check.yml with a status per quote:
//   found        the words are in the source
//   not_found    the source was read and the words are not in it. The validator fails on this.
//   unreachable  neither the source nor its archived copy could be read. Shown as "not yet checked".
//
// It writes only data/quote-check.yml. It never changes a quote.
//
// Flags:
//   --cache <dir>  Read sources from a folder instead of the network: <dir>/index.json maps each
//                  url to a file holding that page's HTML, Markdown or text. Urls not in the
//                  index count as unreachable. Used when the network blocks the sources.
//   --dry-run      Print the results, write nothing.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, DATA, ENTRIES, entryFiles, readYaml, siteRequire } from './lib.mjs';
import { collectQuotes, checkQuote, summary } from './quotes.mjs';
import { todayWIB } from './promises.mjs';

const USER_AGENT = 'MonsoonLedgerQuoteCheck/1.0 (+https://github.com/SteveBehren/monsoon-ledger)';
const OUT = path.join(DATA, 'quote-check.yml');

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    // PDFs need a text layer this script cannot extract; give them to --cache as text instead.
    if (!/text|html|xml|json/.test(type)) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function cacheReader(dir) {
  const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
  return async (url) => (index[url] ? fs.readFileSync(path.join(dir, index[url]), 'utf8') : null);
}

const args = process.argv.slice(2);
const cacheArg = args.indexOf('--cache');
const read = cacheArg >= 0 ? cacheReader(path.resolve(args[cacheArg + 1])) : fetchText;
const today = todayWIB();

const entries = entryFiles().map((f) => ({ file: path.relative(ROOT, path.join(ENTRIES, f)), data: readYaml(path.join(ENTRIES, f)) }));
const quotes = collectQuotes({ root: ROOT, entries });
const pages = new Map();
const rows = [];
for (const q of quotes) {
  for (const [via, url] of [
    ['source', q.url],
    ['archive', q.archive_url],
  ]) {
    if (!url) continue;
    if (!pages.has(url)) pages.set(url, await read(url));
    if (pages.get(url) !== null) {
      rows.push(checkQuote(q, pages.get(url), via, today));
      break;
    }
  }
  if (!rows.find((r) => r.hash === q.hash && r.url === q.url)) rows.push(checkQuote(q, null, null, today));
}

for (const r of rows) console.log(`  ${r.status === 'found' ? 'ok' : r.status === 'not_found' ? 'x ' : '? '} ${r.status.padEnd(11)} ${r.quote.slice(0, 60)}  (${new URL(r.url).hostname})`);
const s = summary(quotes, rows);
console.log(`\nQuotes checked on ${today}: ${s.found} of ${s.total} found in their sources.`);

if (!args.includes('--dry-run')) {
  const yaml = siteRequire('js-yaml');
  const header = `# Written by npm run check-quotes (scripts/check-quotes.mjs). Do not edit by hand.
# One row per quote and source. status: found, not_found (fails validation) or unreachable.
# via: which copy was read, the source itself or its archived copy.
`;
  fs.writeFileSync(OUT, header + yaml.dump(rows, { lineWidth: -1, quotingType: '"' }));
  console.log(`Wrote ${path.relative(ROOT, OUT)}.`);
}
