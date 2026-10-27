// npm test: the reading list rules (scripts/reading.mjs) and its schema.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { checkReading } from './reading.mjs';
import { readYaml, siteRequire, ROOT } from './lib.mjs';

const known = new Set(['analysis:nobody-to-call']);
const row = { id: 'a', title: 'T', authors: 'A', year: 2026, kind: 'report', url: 'https://a.example/1', status: 'planned', used_in: ['analysis:nobody-to-call'] };

test('planned and reading items need no notes', () => {
  assert.deepEqual(checkReading([row, { ...row, id: 'b', url: 'https://a.example/2', status: 'reading' }], { known, today: '2026-10-27' }), []);
});

test('an item marked read needs a finish date and notes in both languages', () => {
  assert.match(checkReading([{ ...row, status: 'read' }], { known }).join('\n'), /needs date_finished, my_notes_en and my_notes_id/);
  const done = { ...row, status: 'read', date_finished: '2026-10-20', my_notes_en: 'Notes.', my_notes_id: 'Catatan.' };
  assert.deepEqual(checkReading([done], { known, today: '2026-10-27' }), []);
  assert.match(checkReading([done], { known, today: '2026-10-19' }).join('\n'), /after today/);
  assert.match(checkReading([{ ...done, my_notes_id: undefined }], { known }).join('\n'), /go together/);
});

test('a finish date on an unread item, duplicates and unknown uses are rejected', () => {
  const problems = checkReading(
    [
      { ...row, date_finished: '2026-10-01' },
      { ...row, used_in: ['analysis:nope'] },
    ],
    { known },
  ).join('\n');
  assert.match(problems, /only for items marked read/);
  assert.match(problems, /duplicate id/);
  assert.match(problems, /duplicate url/);
  assert.match(problems, /used_in "analysis:nope" does not exist/);
});

test('the reading list matches its schema, and the schema enforces notes for read items', () => {
  const Ajv = siteRequire('ajv/dist/2020').default;
  const schema = readYaml(path.join(ROOT, 'data', 'reading.schema.json'));
  const validate = new Ajv({ allErrors: true }).compile(schema);
  assert.equal(validate(readYaml(path.join(ROOT, 'data', 'reading.yml'))), true, JSON.stringify(validate.errors));
  assert.equal(validate([{ ...row, status: 'read' }]), false);
  assert.equal(validate([{ ...row, kind: 'book' }]), false);
});
