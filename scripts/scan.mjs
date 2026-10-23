// npm run scan
//
// The ledger's automatic monitoring layer. It reads every source in data/watch/sources.yml,
// keeps the items that score above the threshold in data/watch/keywords.yml, drops anything
// already seen or already in the ledger, optionally asks Claude for a second opinion, and
// writes the result to data/radar.yml and data/scan-log.yml.
//
// It never creates or edits entries. Leads on the Radar are unreviewed until the author
// reads the source and, if it holds up, writes an entry with npm run new-entry.
//
// Flags:
//   --dry-run          Print what would change, write nothing.
//   --fixtures <dir>   Read <dir>/<source-id>.xml or .html instead of the network (tests).
//   --no-claude        Skip Claude triage even if ANTHROPIC_API_KEY is set.
//   --today <date>     Pretend today is YYYY-MM-DD (tests).
//   --out <dir>        Write radar.yml, scan-log.yml and seen.json to <dir> instead of data/ (tests).
import fs from 'node:fs';
import path from 'node:path';
import { DATA, ENTRIES, readYaml, entryFiles, siteRequire } from './lib.mjs';
import { parseFeed, parseLinks } from './scan/parse.mjs';
import { makeScorer, normaliseDashes, normaliseUrl, leadId, titleKey } from './scan/score.mjs';
import { triage } from './scan/triage.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const DRY_RUN = flag('--dry-run');
const FIXTURES = option('--fixtures');
const NO_CLAUDE = flag('--no-claude');
const NOW = option('--today') ? new Date(`${option('--today')}T06:00:00Z`) : new Date();
const TODAY = NOW.toISOString().slice(0, 10);

const OUT = option('--out');
const RADAR_FILE = OUT ? path.join(OUT, 'radar.yml') : path.join(DATA, 'radar.yml');
const LOG_FILE = OUT ? path.join(OUT, 'scan-log.yml') : path.join(DATA, 'scan-log.yml');
const SEEN_FILE = OUT ? path.join(OUT, 'seen.json') : path.join(DATA, 'watch', 'seen.json');

// Retention: unreviewed leads stay 180 days, reviewed ones a year, the seen index 400 days.
const KEEP_NEW_DAYS = 180;
const KEEP_REVIEWED_DAYS = 365;
const KEEP_SEEN_DAYS = 400;
const MAX_NEW_PER_SOURCE = 25;
const LOG_LENGTH = 104;

const USER_AGENT = 'MonsoonLedgerScanner/1.0 (+https://github.com/SteveBehren/monsoon-ledger)';

const daysAgo = (date) => (NOW.getTime() - new Date(`${date}T00:00:00Z`).getTime()) / 86_400_000;

function feedUrl(source) {
  if (source.kind !== 'news-search') return source.url;
  const [hl, gl] = source.edition.split('-');
  const params = new URLSearchParams({ q: `${source.query} when:30d`, hl: source.edition, gl, ceid: `${gl}:${hl}` });
  return `https://news.google.com/rss/search?${params}`;
}

async function fetchSource(source) {
  if (FIXTURES) {
    for (const ext of ['xml', 'html']) {
      const file = path.join(FIXTURES, `${source.id}.${ext}`);
      if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
    }
    throw new Error('no fixture');
  }
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const res = await fetch(feedUrl(source), {
        headers: { 'user-agent': USER_AGENT, accept: 'application/rss+xml, application/xml, text/html;q=0.9, */*;q=0.5' },
        redirect: 'follow',
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function loadLedgerUrls() {
  const urls = new Set();
  for (const name of entryFiles()) for (const s of readYaml(path.join(ENTRIES, name))?.sources ?? []) urls.add(normaliseUrl(s.url));
  for (const row of readYaml(path.join(DATA, 'deadlines.yml')) ?? []) urls.add(normaliseUrl(row.source_url));
  for (const row of readYaml(path.join(DATA, 'instruments.yml')) ?? []) urls.add(normaliseUrl(row.source_url));
  return urls;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function main() {
  const sources = readYaml(path.join(DATA, 'watch', 'sources.yml'));
  const keywords = readYaml(path.join(DATA, 'watch', 'keywords.yml'));
  const instrumentIds = (readYaml(path.join(DATA, 'instruments.yml')) ?? []).map((i) => i.id);
  const score = makeScorer(keywords);

  const radar = (fs.existsSync(RADAR_FILE) ? readYaml(RADAR_FILE) : null) ?? { updated: null, leads: [] };
  radar.leads ??= [];
  const seen = readJson(SEEN_FILE, {});
  const ledgerUrls = loadLedgerUrls();
  const knownIds = new Set(radar.leads.map((l) => l.id));
  const knownTitles = new Set(radar.leads.map((l) => titleKey(l.title)));

  const stats = { total: sources.length, ok: 0, failed: [], items: 0, kept: 0 };
  const fresh = [];

  for (const source of sources) {
    let body;
    try {
      body = await fetchSource(source);
    } catch (error) {
      stats.failed.push(source.id);
      console.warn(`  x ${source.id}: ${error.message}`);
      continue;
    }
    stats.ok += 1;
    const base = source.url ?? 'https://news.google.com/';
    const items = source.kind === 'page-links' ? parseLinks(body, base) : parseFeed(body, base);
    stats.items += items.length;

    let added = 0;
    for (const item of items) {
      const title = normaliseDashes(item.title);
      const result = score(`${title} ${item.summary ?? ''}`);
      if (!result.keep) continue;
      stats.kept += 1;
      const id = leadId(item.link);
      const tkey = titleKey(title);
      if (knownIds.has(id) || seen[id] || knownTitles.has(tkey) || ledgerUrls.has(normaliseUrl(item.link))) continue;
      if (added >= MAX_NEW_PER_SOURCE) break;

      const lead = {
        id,
        found: TODAY,
        ...(item.published ? { published: item.published } : {}),
        title,
        url: item.link,
        ...(item.outlet ? { outlet: normaliseDashes(item.outlet) } : {}),
        country: source.country,
        language: source.language,
        source: source.id,
        score: result.score,
        terms: result.terms,
        ...(result.instrument ? { instrument: result.instrument } : {}),
        status: 'new',
      };
      fresh.push(lead);
      knownIds.add(id);
      knownTitles.add(tkey);
      added += 1;
    }
    console.log(`  ok ${source.id}: ${items.length} items, ${added} new`);
  }

  const claude = NO_CLAUDE || DRY_RUN ? { used: false, triaged: 0 } : await triage(fresh, instrumentIds);

  // Merge, newest first, then apply retention.
  const merged = [...fresh, ...radar.leads]
    .filter((l) => daysAgo(l.found) <= (l.status === 'new' ? KEEP_NEW_DAYS : KEEP_REVIEWED_DAYS))
    .sort((a, b) => (b.found.localeCompare(a.found) || b.score - a.score || a.id.localeCompare(b.id)));

  for (const lead of fresh) seen[lead.id] = TODAY;
  for (const [id, date] of Object.entries(seen)) if (daysAgo(date) > KEEP_SEEN_DAYS) delete seen[id];

  const run = {
    at: NOW.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    mode: claude.used ? 'rules+claude' : 'rules',
    ...(claude.used ? { model: claude.model } : {}),
    sources_total: stats.total,
    sources_ok: stats.ok,
    ...(stats.failed.length ? { sources_failed: stats.failed } : {}),
    items_read: stats.items,
    items_relevant: stats.kept,
    new_leads: fresh.length,
    triaged: claude.triaged,
  };

  console.log(`\nScan ${run.at}: ${stats.ok}/${stats.total} sources ok, ${stats.items} items read, ${stats.kept} above threshold, ${fresh.length} new leads (${run.mode}).`);
  for (const lead of fresh.slice(0, 40)) console.log(`  + [${lead.country}] ${lead.title} (${lead.outlet ?? lead.source}, score ${lead.score})`);

  if (DRY_RUN) {
    console.log('\nDry run: nothing written.');
  } else {
    const yaml = siteRequire('js-yaml');
    const dump = (value) => yaml.dump(value, { lineWidth: -1, noRefs: true, quotingType: '"' });
    const header = '# Written by npm run scan. Leads are unreviewed: they are not entries and not verified.\n# To review one, set status to reviewed, promoted or dismissed. Promote by writing an entry.\n';
    fs.writeFileSync(RADAR_FILE, header + dump({ updated: run.at, leads: merged }));

    const log = (fs.existsSync(LOG_FILE) ? readYaml(LOG_FILE) : null) ?? [];
    fs.writeFileSync(LOG_FILE, '# One row per scan, newest first. Written by npm run scan.\n' + dump([run, ...log].slice(0, LOG_LENGTH)));
    fs.writeFileSync(SEEN_FILE, JSON.stringify(Object.fromEntries(Object.entries(seen).sort()), null, 1) + '\n');
  }

  // A run where every source failed means the scanner is broken, not that nothing happened.
  if (stats.ok === 0) {
    console.error('\nEvery source failed. Check the network or the source list.');
    process.exit(1);
  }
}

await main();
