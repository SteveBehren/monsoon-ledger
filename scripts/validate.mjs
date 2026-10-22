// npm run validate
// Checks every entry against data/schema.json and runs the extra checks the
// schema cannot express. Exits with code 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, DATA, ENTRIES, siteRequire, readYaml, entryFiles, isRealDate } from './lib.mjs';

const Ajv2020 = siteRequire('ajv/dist/2020').default;

const errors = [];
const fail = (file, message) => errors.push(`${path.relative(ROOT, file)}: ${message}`);

function load(file) {
  try {
    return readYaml(file);
  } catch (err) {
    fail(file, `YAML error: ${err.message.split('\n')[0]}`);
    return undefined;
  }
}

// Instruments
const instrumentsFile = path.join(DATA, 'instruments.yml');
const instruments = load(instrumentsFile) ?? [];
const instrumentIds = new Set();
const instrumentRequired = ['id', 'name_en', 'name_id', 'type', 'status', 'binding', 'note_en', 'note_id', 'source_url'];
if (!Array.isArray(instruments)) {
  fail(instrumentsFile, 'must be a list');
} else {
  instruments.forEach((row, i) => {
    for (const key of instrumentRequired) {
      if (row?.[key] === undefined || row[key] === null || row[key] === '') fail(instrumentsFile, `row ${i + 1} is missing "${key}"`);
    }
    if (row?.issued !== undefined && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(row.issued))) {
      fail(instrumentsFile, `row ${i + 1} "issued" must be YYYY, YYYY-MM or YYYY-MM-DD`);
    }
    if (row?.binding !== undefined && typeof row.binding !== 'boolean') fail(instrumentsFile, `row ${i + 1} "binding" must be true or false`);
    if (row?.source_url && !/^https?:\/\/\S+$/.test(row.source_url)) fail(instrumentsFile, `row ${i + 1} has an invalid source_url`);
    if (row?.id) {
      if (instrumentIds.has(row.id)) fail(instrumentsFile, `duplicate id "${row.id}"`);
      instrumentIds.add(row.id);
    }
  });
}

// Deadlines
const deadlinesFile = path.join(DATA, 'deadlines.yml');
const deadlines = load(deadlinesFile) ?? [];
const deadlineRequired = ['date_said', 'who', 'promised_en', 'promised_id', 'outcome_en', 'outcome_id', 'outcome_status', 'source_url'];
if (!Array.isArray(deadlines)) {
  fail(deadlinesFile, 'must be a list');
} else {
  deadlines.forEach((row, i) => {
    for (const key of deadlineRequired) {
      if (row?.[key] === undefined || row[key] === null || String(row[key]).trim() === '') fail(deadlinesFile, `row ${i + 1} is missing "${key}"`);
    }
    if (row?.date_said && !isRealDate(row.date_said)) fail(deadlinesFile, `row ${i + 1} "date_said" must be a real YYYY-MM-DD date`);
    if (row?.outcome_status && !['missed', 'open', 'met'].includes(row.outcome_status)) {
      fail(deadlinesFile, `row ${i + 1} "outcome_status" must be missed, open or met`);
    }
    if (row?.source_url && !/^https?:\/\/\S+$/.test(row.source_url)) fail(deadlinesFile, `row ${i + 1} has an invalid source_url`);
    if (i > 0 && row?.date_said && deadlines[i - 1]?.date_said && row.date_said > deadlines[i - 1].date_said) {
      fail(deadlinesFile, `row ${i + 1} is out of order, keep the list newest first`);
    }
  });
}

// Entries
const schema = JSON.parse(fs.readFileSync(path.join(DATA, 'schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateEntry = ajv.compile(schema);
const quotedSources = new Map();
const files = entryFiles();
if (files.length === 0) errors.push('data/entries: no entries found');

for (const name of files) {
  const file = path.join(ENTRIES, name);
  if (!name.endsWith('.yml')) {
    fail(file, 'use the .yml extension');
    continue;
  }
  const entry = load(file);
  if (entry === undefined) continue;

  if (!validateEntry(entry)) {
    for (const e of validateEntry.errors) {
      const where = e.instancePath || '(root)';
      const extra = e.params?.additionalProperty ? ` "${e.params.additionalProperty}"` : '';
      const allowed = e.params?.allowedValues ? ` (${e.params.allowedValues.join(', ')})` : '';
      fail(file, `${where} ${e.message}${extra}${allowed}`);
    }
  }
  if (typeof entry !== 'object' || entry === null) continue;

  const expectedId = name.replace(/\.yml$/, '');
  if (entry.id !== expectedId) fail(file, `id "${entry.id}" must equal the file name "${expectedId}"`);
  if (entry.date && !isRealDate(entry.date)) fail(file, `date "${entry.date}" is not a real date`);
  if (entry.last_checked && !isRealDate(entry.last_checked)) fail(file, `last_checked "${entry.last_checked}" is not a real date`);
  if (entry.id && entry.date && !entry.id.startsWith(`${entry.date}-`)) fail(file, 'id must start with the entry date');
  if (entry.instrument && !instrumentIds.has(entry.instrument)) {
    fail(file, `instrument "${entry.instrument}" does not exist in data/instruments.yml`);
  }

  const urls = (entry.sources ?? []).map((s) => s?.url);
  const dupes = urls.filter((u, i) => u && urls.indexOf(u) !== i);
  if (dupes.length) fail(file, `duplicate source url: ${dupes[0]}`);

  if (entry.quote) {
    const words = String(entry.quote.original ?? '').trim().split(/\s+/).filter(Boolean).length;
    if (words >= 15) fail(file, `quote.original has ${words} words, it must be under 15`);
    if (entry.quote.source_url && !urls.includes(entry.quote.source_url)) {
      fail(file, 'quote.source_url must be one of the entry sources');
    }
    if (entry.quote.source_url) {
      const other = quotedSources.get(entry.quote.source_url);
      if (other) fail(file, `this source is already quoted in ${other}, use at most one quote per source`);
      quotedSources.set(entry.quote.source_url, name);
    }
  }
}

// No em dashes or en dashes anywhere in the project text.
const BANNED = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.astro', '.vercel']);
const SKIP_FILES = new Set(['package-lock.json']);
const TEXT_EXT = /\.(ya?ml|json|md|mjs|js|ts|astro|css|html|xml|txt|svg)$|^\.gitkeep$|^LICENSE$/;

function scan(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.isDirectory()) {
      if (!SKIP_DIRS.has(item.name)) scan(path.join(dir, item.name));
      continue;
    }
    if (SKIP_FILES.has(item.name) || !TEXT_EXT.test(item.name)) continue;
    const file = path.join(dir, item.name);
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (BANNED.test(line)) fail(file, `line ${i + 1} contains an em dash or en dash, use a comma or a full stop`);
      });
  }
}
scan(ROOT);

if (errors.length) {
  console.error(`Validation failed with ${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  x ${e}`);
  process.exit(1);
}
console.log(
  `Validation passed: ${files.length} entries, ${instruments.length} instruments, ${deadlines.length} deadlines, no em or en dashes.`,
);
