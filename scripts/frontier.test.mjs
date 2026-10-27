// npm test: the frontier incident reference (scripts/frontier.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeIncident, computeAll, checkIncidents, resolveTokens, tokensIn, loadIncidents } from './frontier.mjs';

const medicare = {
  id: 'm',
  activity_start: '2026-06-18',
  developer_aware: '2026-08-11',
  notified_at: '2026-09-10',
  notified_authority: 'Services Australia',
  first_public_disclosure: '2026-09-24',
};

test('day counts are computed from the dates', () => {
  const c = computeIncident(medicare);
  assert.equal(c.days_access_to_notice, 84);
  assert.equal(c.days_awareness_to_notice, 30);
  assert.equal(c.days_notice_to_public, 14);
});

test('a missing date gives null, never a guess', () => {
  const c = computeIncident({ ...medicare, developer_aware: null, notified_at: null });
  assert.equal(c.days_access_to_notice, null);
  assert.equal(c.days_awareness_to_notice, null);
  assert.equal(c.days_notice_to_public, null);
});

test('incidents sort newest first by public disclosure', () => {
  const rows = computeAll([{ id: 'a', first_public_disclosure: '2025-11-13' }, { id: 'b', first_public_disclosure: '2026-09-24' }, { id: 'c', first_public_disclosure: null }]);
  assert.deepEqual(rows.map((r) => r.id), ['b', 'a', 'c']);
});

test('typed day counts, reversed dates and duplicate ids are rejected', () => {
  const problems = checkIncidents([
    { ...medicare, days_access_to_notice: 84 },
    { ...medicare, id: 'm', activity_start: '2026-10-01' },
    { id: 'n', notified_at: '2026-01-01', notified_authority: null },
  ]).join('\n');
  assert.match(problems, /computed by scripts\/frontier.mjs, do not type it/);
  assert.match(problems, /duplicate id/);
  assert.match(problems, /activity_start is after notified_at/);
  assert.match(problems, /notified_at needs notified_authority/);
});

test('paper tokens resolve to computed numbers and fail loudly otherwise', () => {
  const incidents = computeAll([medicare]);
  assert.equal(resolveTokens('took {{frontier:m:days_access_to_notice}} days', incidents), 'took 84 days');
  assert.throws(() => resolveTokens('{{frontier:x:days_access_to_notice}}', incidents), /no incident "x"/);
  assert.throws(() => resolveTokens('{{frontier:m:developer}}', incidents), /not a computed field/);
  assert.throws(() => resolveTokens('{{frontier:m:days_access_to_notice}}', computeAll([{ ...medicare, notified_at: null }])), /has no value/);
  assert.deepEqual(tokensIn('a {{frontier:m:days_notice_to_public}} b'), [{ token: '{{frontier:m:days_notice_to_public}}', id: 'm', field: 'days_notice_to_public' }]);
});

test('the published data gives the numbers Analysis 01 states', () => {
  const row = loadIncidents().find((r) => r.id === 'openai-medicare-portal-2026');
  assert.equal(row.days_access_to_notice, 84);
  assert.equal(row.days_awareness_to_notice, 30);
});
