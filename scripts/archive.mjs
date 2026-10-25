// npm run archive
//
// Evidence preservation. For every source url in data/deadlines.yml, data/instruments.yml and
// the entries, it records a preserved copy in the Internet Archive:
//   1. ask the Wayback Machine availability API whether a snapshot already exists;
//   2. if not, request one through the public Save Page Now endpoint, politely rate limited;
//   3. write archive_url and archived_at beside the source, in place, keeping every comment
//      and every other line of the file exactly as it was.
// It never changes any other field. Failures are logged and never fail the run, so an archive
// outage cannot block a scan or a build. The validator warns about sources still unarchived.
//
// Flags:
//   --dry-run        Check and report, write nothing.
//   --max-saves <n>  Save Page Now requests per run (default 8). Snapshots that already exist
//                    are always recorded.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const AVAILABILITY = 'https://archive.org/wayback/available?url=';
const SAVE = 'https://web.archive.org/save/';
const USER_AGENT = 'MonsoonLedgerArchiver/1.0 (+https://github.com/SteveBehren/monsoon-ledger)';
const SAVE_GAP_MS = 12_000;

/** 20250113093000 becomes 2025-01-13. */
export const stampToDate = (ts) => `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;

/** The snapshot timestamp and an https url from any Wayback address. */
export function parseWayback(address) {
  const m = /web\.archive\.org\/web\/(\d{14})[^/]*\/(.+)$/.exec(String(address));
  if (!m) return null;
  return { archive_url: `https://web.archive.org/web/${m[1]}/${m[2]}`, archived_at: stampToDate(m[1]) };
}

/**
 * Sets archive_url and archived_at beside every `key: url` line in a YAML text, replacing
 * values already there. Works on lines, so comments and folded text are untouched.
 */
export function setArchiveFields(text, key, url, archive) {
  const lines = text.split('\n');
  const keyLine = new RegExp(`^(\\s*)(- )?${key}:\\s*["']?(\\S+?)["']?\\s*$`);
  for (let i = 0; i < lines.length; i++) {
    const m = keyLine.exec(lines[i]);
    if (!m || m[3] !== url) continue;
    const indent = m[1].length + (m[2] ? 2 : 0);
    const pad = ' '.repeat(indent);
    // Find existing archive fields in the same mapping, which ends at a shallower line or a new item.
    let end = i + 1;
    const found = {};
    while (end < lines.length) {
      const line = lines[end];
      if (line.trim() === '') break;
      const ind = line.length - line.trimStart().length;
      if (ind < indent || (ind === indent - 2 && line.trimStart().startsWith('- '))) break;
      const f = /^\s*(archive_url|archived_at):/.exec(line);
      if (f && ind === indent) found[f[1]] = end;
      end += 1;
    }
    const want = { archive_url: `${pad}archive_url: ${archive.archive_url}`, archived_at: `${pad}archived_at: ${archive.archived_at}` };
    if (found.archive_url !== undefined && found.archived_at !== undefined) {
      lines[found.archive_url] = want.archive_url;
      lines[found.archived_at] = want.archived_at;
    } else {
      for (const k of ['archived_at', 'archive_url']) if (found[k] !== undefined) lines.splice(found[k], 1);
      lines.splice(i + 1, 0, want.archive_url, want.archived_at);
    }
  }
  return lines.join('\n');
}

/** Every source in the given files: { file, key, url, archived }. */
export function collectSources(files, readYaml) {
  const out = [];
  for (const { file, kind } of files) {
    const data = readYaml(file);
    const rows = kind === 'entry' ? data?.sources ?? [] : Array.isArray(data) ? data : [];
    const key = kind === 'entry' ? 'url' : 'source_url';
    for (const row of rows) if (row?.[key]) out.push({ file, key, url: row[key], archived: Boolean(row.archive_url) });
  }
  return out;
}

async function getJson(fetchImpl, url) {
  const res = await fetchImpl(url, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** An existing snapshot, or null. */
export async function findSnapshot(url, fetchImpl) {
  const json = await getJson(fetchImpl, AVAILABILITY + encodeURIComponent(url));
  const c = json?.archived_snapshots?.closest;
  if (!c?.available || !c.url || String(c.status) !== '200') return null;
  return parseWayback(c.url);
}

/** Asks Save Page Now for a fresh snapshot. */
export async function saveSnapshot(url, fetchImpl) {
  const res = await fetchImpl(SAVE + url, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const place = res.headers.get('content-location') ?? res.headers.get('location') ?? res.url;
  const parsed = parseWayback(place?.startsWith('/') ? `https://web.archive.org${place}` : place);
  if (!parsed) throw new Error('no snapshot address in the response');
  return parsed;
}

/**
 * Archives every unarchived source. Network and file access are passed in, so tests can run
 * it without either.
 */
export async function archiveAll({ sources, fetchImpl, sleep, readText, writeText, maxSaves = 8, dryRun = false, log = console.log }) {
  const pending = new Map();
  for (const s of sources) if (!s.archived && !pending.has(s.url)) pending.set(s.url, []);
  for (const s of sources) if (pending.has(s.url)) pending.get(s.url).push(s);

  const result = { checked: pending.size, found: 0, saved: 0, failed: [], skipped: 0 };
  const done = new Map();
  let saves = 0;
  for (const url of pending.keys()) {
    try {
      let snap = await findSnapshot(url, fetchImpl);
      if (snap) result.found += 1;
      else if (saves < maxSaves) {
        if (saves > 0) await sleep(SAVE_GAP_MS);
        saves += 1;
        snap = await saveSnapshot(url, fetchImpl);
        result.saved += 1;
      } else {
        result.skipped += 1;
        continue;
      }
      done.set(url, snap);
      log(`  ok ${url}\n     ${snap.archive_url}`);
    } catch (error) {
      result.failed.push({ url, error: error.message });
      log(`  x  ${url}: ${error.message}`);
    }
  }

  if (!dryRun) {
    const byFile = new Map();
    for (const [url, snap] of done) for (const s of pending.get(url)) byFile.set(s.file, [...(byFile.get(s.file) ?? []), { ...s, snap }]);
    for (const [file, items] of byFile) {
      let text = readText(file);
      for (const it of items) text = setArchiveFields(text, it.key, it.url, it.snap);
      writeText(file, text);
    }
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { DATA, ENTRIES, readYaml, entryFiles } = await import('./lib.mjs');
  const args = process.argv.slice(2);
  const maxArg = args.indexOf('--max-saves');
  const files = [
    { file: path.join(DATA, 'deadlines.yml'), kind: 'list' },
    { file: path.join(DATA, 'instruments.yml'), kind: 'list' },
    ...entryFiles().map((f) => ({ file: path.join(ENTRIES, f), kind: 'entry' })),
  ];
  const sources = collectSources(files, readYaml);
  console.log(`Archive: ${sources.length} sources, ${sources.filter((s) => !s.archived).length} without an archived copy.`);
  const result = await archiveAll({
    sources,
    fetchImpl: fetch,
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    readText: (f) => fs.readFileSync(f, 'utf8'),
    writeText: (f, t) => fs.writeFileSync(f, t),
    maxSaves: maxArg >= 0 ? Number(args[maxArg + 1]) : 8,
    dryRun: args.includes('--dry-run'),
  });
  console.log(
    `\nArchive done: ${result.checked} urls checked, ${result.found} existing snapshots recorded, ${result.saved} new snapshots saved, ${result.skipped} left for the next run, ${result.failed.length} failed.${args.includes('--dry-run') ? ' Dry run: nothing written.' : ''}`,
  );
}
