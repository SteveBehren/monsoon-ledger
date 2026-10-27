// npm test: English and Bahasa Indonesia parity (scripts/check-parity.mjs). No network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { twinGaps, routeGaps } from './check-parity.mjs';

test('every filled _en field needs its _id twin, at any depth', () => {
  assert.deepEqual(twinGaps({ title_en: 'A', title_id: 'B' }, 'f'), []);
  assert.deepEqual(twinGaps({ title_en: 'A' }, 'f'), ['f.title_en has no title_id']);
  assert.deepEqual(twinGaps([{ x: { points_en: ['a'], points_id: [] } }], 'f'), ['f[0].x.points_en has no points_id']);
  assert.deepEqual(twinGaps({ note_en: '', note_id: '' }, 'f'), [], 'empty English needs no twin');
});

test('an entry summary pairs with ringkasan_id', () => {
  assert.deepEqual(twinGaps({ summary_en: 'A', ringkasan_id: 'B' }, 'f'), []);
  assert.deepEqual(twinGaps({ summary_en: 'A', summary_id: 'B' }, 'f'), []);
  assert.equal(twinGaps({ summary_en: 'A' }, 'f').length, 1);
});

test('a page in one language fails unless it is marked partial', () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-'));
  const page = (lang, p, html = '<html></html>') => {
    fs.mkdirSync(path.join(dist, lang, p), { recursive: true });
    fs.writeFileSync(path.join(dist, lang, p, 'index.html'), html);
  };
  page('en', 'a');
  page('id', 'a');
  page('en', 'only-en');
  page('id', 'only-id', '<html><head><meta name="ml:partial" content="true" /></head></html>');
  assert.deepEqual(routeGaps(dist), ['/en/only-en/ has no /id/ twin']);
  fs.rmSync(dist, { recursive: true, force: true });
});
