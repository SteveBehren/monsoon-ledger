// npm test: the quote check (scripts/quotes.mjs), against fixture pages. No network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize, isFound, quoteParts, quoteHash, checkQuote, compareWithChecks, summary } from './quotes.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const page = fs.readFileSync(path.join(here, 'fixtures', 'quotes', 'news.html'), 'utf8');

test('normalising unifies case, typographic quotes, apostrophes and punctuation', () => {
  assert.equal(normalize('Anyone’s  “Control”, here.'), normalize("anyones control here"));
  assert.equal(normalize('<p>a&nbsp;<b>b</b></p>'), 'a b');
});

test('a quote is found across inline markup and entities', () => {
  assert.equal(isFound('The notification was an email sent just to the public mailbox', page), true);
  assert.equal(isFound("anyone's guess", page), true);
  assert.equal(isFound('Kita kan tidak ada backup-nya', page), true);
});

test('changed words, and words only in scripts, are not found', () => {
  assert.equal(isFound('The notification was an email sent only to the public mailbox', page), false);
  assert.equal(isFound('The notification was hidden in a script', page), false);
});

test('an elided quote matches part by part', () => {
  assert.deepEqual(quoteParts('... persoalan terkait keterbatasan ... auditor ... di'), ['persoalan terkait keterbatasan', 'auditor']);
  assert.equal(isFound('... persoalan terkait keterbatasan anggaran dan kesulitan menjelaskan ke keuangan dan auditor.', page), true);
  assert.equal(isFound('persoalan terkait ... kesulitan besar sekali', page), false);
});

test('results record the status, and an unreadable source is unreachable, not missing', () => {
  const q = { text: 'Kita kan tidak ada backup-nya', url: 'https://x.example/a', where: 'w', hash: quoteHash('Kita kan tidak ada backup-nya') };
  assert.equal(checkQuote(q, page, 'source', '2026-10-27').status, 'found');
  assert.equal(checkQuote({ ...q, text: 'Tidak benar' }, page, 'source', '2026-10-27').status, 'not_found');
  const unreachable = checkQuote(q, null, null, '2026-10-27');
  assert.equal(unreachable.status, 'unreachable');
  assert.equal(unreachable.via, undefined);
});

test('only current quotes count: not_found fails, missing or unreachable rows are unchecked', () => {
  const a = { text: 'a b c', url: 'https://x.example/1', hash: quoteHash('a b c') };
  const b = { text: 'd e f', url: 'https://x.example/2', hash: quoteHash('d e f') };
  const c = { text: 'g h i', url: 'https://x.example/3', hash: quoteHash('g h i') };
  const rows = [
    { hash: a.hash, url: a.url, status: 'not_found', checked_at: '2026-10-27' },
    { hash: b.hash, url: b.url, status: 'unreachable', checked_at: '2026-10-27' },
    { hash: quoteHash('old words'), url: c.url, status: 'not_found', checked_at: '2026-10-20' },
  ];
  const { notFound, unchecked } = compareWithChecks([a, b, c], rows);
  assert.deepEqual(notFound, [a]);
  assert.deepEqual(unchecked, [b, c]);
});

test('a quote whose words changed needs a new check', () => {
  assert.notEqual(quoteHash('one two three'), quoteHash('one two four'));
  assert.equal(quoteHash('One, two three.'), quoteHash('one two three'));
});

test('the summary counts current quotes found, with the latest check day', () => {
  const a = { url: 'u1', hash: 'h1' };
  const b = { url: 'u2', hash: 'h2' };
  const rows = [
    { url: 'u1', hash: 'h1', status: 'found', checked_at: '2026-10-26' },
    { url: 'u2', hash: 'h2', status: 'unreachable', checked_at: '2026-10-27' },
  ];
  assert.deepEqual(summary([a, b], rows), { found: 1, total: 2, checked_at: '2026-10-27' });
});
