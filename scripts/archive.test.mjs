// npm test: the archive script, with the network mocked.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWayback, setArchiveFields, archiveAll, findSnapshot, saveSnapshot, collectSources } from './archive.mjs';

const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body, headers: new Map() });

test('wayback addresses give an https url and the snapshot day', () => {
  assert.deepEqual(parseWayback('http://web.archive.org/web/20250113093000/https://example.org/a'), {
    archive_url: 'https://web.archive.org/web/20250113093000/https://example.org/a',
    archived_at: '2025-01-13',
  });
  assert.equal(parseWayback('https://example.org/'), null);
});

test('archive fields are added beside the source line and nothing else changes', () => {
  const deadlines = `# a comment that must survive
- date_said: 2025-01-13
  who: Someone, Body
  outcome_en: >
    Folded text that must survive.
  source_url: https://example.org/a

- date_said: 2024-01-01
  source_url: https://example.org/b
`;
  const out = setArchiveFields(deadlines, 'source_url', 'https://example.org/a', { archive_url: 'https://web.archive.org/web/1/https://example.org/a', archived_at: '2025-01-14' });
  assert.equal(
    out,
    deadlines.replace(
      '  source_url: https://example.org/a\n',
      '  source_url: https://example.org/a\n  archive_url: https://web.archive.org/web/1/https://example.org/a\n  archived_at: 2025-01-14\n',
    ),
  );
  // Running it again replaces the values instead of adding a second pair.
  const again = setArchiveFields(out, 'source_url', 'https://example.org/a', { archive_url: 'https://web.archive.org/web/2/https://example.org/a', archived_at: '2025-02-01' });
  assert.equal(again.match(/archive_url/g).length, 1);
  assert.match(again, /archived_at: 2025-02-01/);
});

test('entry sources get fields at the list item indent', () => {
  const entry = `sources:
  - title: A story
    url: https://example.org/a
    outlet: Example
    language: id
quote:
  source_url: https://example.org/a
`;
  const out = setArchiveFields(entry, 'url', 'https://example.org/a', { archive_url: 'https://web.archive.org/web/1/x', archived_at: '2025-01-14' });
  assert.match(out, /    url: https:\/\/example.org\/a\n    archive_url: https:\/\/web.archive.org\/web\/1\/x\n    archived_at: 2025-01-14\n    outlet: Example/);
  // The quote's source_url is a different key and is left alone.
  assert.match(out, /quote:\n  source_url: https:\/\/example.org\/a\n$/);
});

test('an existing snapshot is used before asking for a new one', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return json({ archived_snapshots: { closest: { available: true, status: '200', url: 'http://web.archive.org/web/20250201000000/https://example.org/a' } } });
  };
  assert.deepEqual(await findSnapshot('https://example.org/a', fetchImpl), {
    archive_url: 'https://web.archive.org/web/20250201000000/https://example.org/a',
    archived_at: '2025-02-01',
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0], /^https:\/\/archive\.org\/wayback\/available\?url=/);
});

test('save page now reads the snapshot address from the response', async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, url: 'https://web.archive.org/web/20261025010203/https://example.org/b', headers: new Map() });
  assert.deepEqual(await saveSnapshot('https://example.org/b', fetchImpl), {
    archive_url: 'https://web.archive.org/web/20261025010203/https://example.org/b',
    archived_at: '2026-10-25',
  });
});

test('archiveAll records found and saved copies, rate limits saves, and survives failures', async () => {
  const files = { 'd.yml': '- date_said: 2025-01-13\n  source_url: https://example.org/a\n\n- date_said: 2025-01-12\n  source_url: https://example.org/b\n\n- date_said: 2025-01-11\n  source_url: https://example.org/c\n' };
  const sources = ['a', 'b', 'c'].map((k) => ({ file: 'd.yml', key: 'source_url', url: `https://example.org/${k}`, archived: false }));
  const slept = [];
  const fetchImpl = async (url) => {
    if (url.includes('available')) {
      if (url.includes('example.org%2Fa')) return json({ archived_snapshots: { closest: { available: true, status: '200', url: 'http://web.archive.org/web/20250101000000/https://example.org/a' } } });
      return json({ archived_snapshots: {} });
    }
    if (url.endsWith('/b')) return { ok: true, status: 200, url: 'https://web.archive.org/web/20261025000000/https://example.org/b', headers: new Map() };
    return { ok: false, status: 429, headers: new Map() };
  };
  const result = await archiveAll({
    sources,
    fetchImpl,
    sleep: async (ms) => slept.push(ms),
    readText: (f) => files[f],
    writeText: (f, t) => (files[f] = t),
    log: () => {},
  });
  assert.deepEqual({ ...result, failed: result.failed.map((f) => f.url) }, { checked: 3, found: 1, saved: 1, failed: ['https://example.org/c'], skipped: 0 });
  assert.equal(slept.length, 1, 'waits between save requests');
  assert.match(files['d.yml'], /example.org\/a\n  archive_url: https:\/\/web.archive.org\/web\/20250101000000\/https:\/\/example.org\/a\n  archived_at: 2025-01-01/);
  assert.match(files['d.yml'], /example.org\/b\n  archive_url: https:\/\/web.archive.org\/web\/20261025000000\/https:\/\/example.org\/b\n  archived_at: 2026-10-25/);
  assert.doesNotMatch(files['d.yml'], /example.org\/c\n  archive_url/);
});

test('a dry run writes nothing and already archived sources are not checked again', async () => {
  let wrote = false;
  const sources = [
    { file: 'd.yml', key: 'source_url', url: 'https://example.org/a', archived: true },
    { file: 'd.yml', key: 'source_url', url: 'https://example.org/b', archived: false },
  ];
  const result = await archiveAll({
    sources,
    fetchImpl: async () => json({ archived_snapshots: { closest: { available: true, status: '200', url: 'http://web.archive.org/web/20250101000000/https://example.org/b' } } }),
    sleep: async () => {},
    readText: () => '',
    writeText: () => (wrote = true),
    dryRun: true,
    log: () => {},
  });
  assert.equal(result.checked, 1);
  assert.equal(wrote, false);
});

test('sources are collected from every kind of file the archive step reads', () => {
  const files = {
    'entry.yml': { sources: [{ url: 'https://a.example/1', archive_url: 'https://web.archive.org/web/1/x' }] },
    'deadlines.yml': [{ source_url: 'https://a.example/2' }],
    'paper.sources.yml': [{ n: 1, url: 'https://a.example/3' }, { n: 2, url: 'https://a.example/4' }],
    'incidents.yml': [{ id: 'x', sources: [{ url: 'https://a.example/5' }] }, { id: 'y' }],
  };
  const out = collectSources(
    [
      { file: 'entry.yml', kind: 'entry' },
      { file: 'deadlines.yml', kind: 'list' },
      { file: 'paper.sources.yml', kind: 'sources' },
      { file: 'incidents.yml', kind: 'nested' },
    ],
    (f) => files[f],
  );
  assert.deepEqual(
    out.map((s) => [s.file, s.key, s.url, s.archived]),
    [
      ['entry.yml', 'url', 'https://a.example/1', true],
      ['deadlines.yml', 'source_url', 'https://a.example/2', false],
      ['paper.sources.yml', 'url', 'https://a.example/3', false],
      ['paper.sources.yml', 'url', 'https://a.example/4', false],
      ['incidents.yml', 'url', 'https://a.example/5', false],
    ],
  );
});

test('archive fields are added beside a numbered analysis source', () => {
  const text = `- n: 1
  key: a
  url: https://a.example/3
  accessed: 2026-10-26
- n: 2
  url: https://a.example/4
`;
  const out = setArchiveFields(text, 'url', 'https://a.example/3', { archive_url: 'https://web.archive.org/web/20261026000000/https://a.example/3', archived_at: '2026-10-26' });
  assert.equal(
    out,
    `- n: 1
  key: a
  url: https://a.example/3
  archive_url: https://web.archive.org/web/20261026000000/https://a.example/3
  archived_at: 2026-10-26
  accessed: 2026-10-26
- n: 2
  url: https://a.example/4
`,
  );
});
