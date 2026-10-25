// npm run validate
// Checks every entry against data/schema.json and every promise against the promise format
// (docs/standard/v0.1/promise.schema.json), then runs the checks a schema cannot express.
// Exits with code 1 on any failure. Missing archived copies are warnings, never failures.
//
//   npm run validate                        the whole project
//   npm run validate -- --data kit/data     only a promise ledger's data folder, such as the kit
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, DATA, ENTRIES, siteRequire, readYaml, entryFiles, isRealDate } from './lib.mjs';
import { buildOntology } from './ontology.mjs';
import { deriveDeadline, promiseKey, todayWIB } from './promises.mjs';

const Ajv2020 = siteRequire('ajv/dist/2020').default;
const ajv = new Ajv2020({ allErrors: true, strict: true });

const args = process.argv.slice(2);
const dataArg = args.includes('--data') ? args[args.indexOf('--data') + 1] : null;
const KIT = Boolean(dataArg);
const DATA_DIR = KIT ? path.resolve(dataArg) : DATA;
const TODAY = todayWIB();

const errors = [];
const warnings = [];
const fail = (file, message) => errors.push(`${path.relative(ROOT, file)}: ${message}`);
const warn = (file, message) => warnings.push(`${path.relative(ROOT, file)}: ${message}`);

function schemaErrors(validate, value) {
  if (validate(value)) return [];
  return validate.errors.map((e) => {
    const where = e.instancePath || '(root)';
    const extra = e.params?.additionalProperty ? ` "${e.params.additionalProperty}"` : '';
    const allowed = e.params?.allowedValues ? ` (${e.params.allowedValues.join(', ')})` : '';
    return `${where} ${e.message}${extra}${allowed}`;
  });
}

function load(file) {
  try {
    return readYaml(file);
  } catch (err) {
    fail(file, `YAML error: ${err.message.split('\n')[0]}`);
    return undefined;
  }
}

// Instruments
const instrumentsFile = path.join(DATA_DIR, 'instruments.yml');
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
    checkArchive(instrumentsFile, `row ${i + 1}`, row);
    if (row?.id) {
      if (instrumentIds.has(row.id)) fail(instrumentsFile, `duplicate id "${row.id}"`);
      instrumentIds.add(row.id);
    }
  });
}

// Archived copies of sources: optional pairs, warned about when missing (scripts/archive.mjs fills them).
function checkArchive(file, where, row) {
  if (!row || typeof row !== 'object') return;
  if (row.archive_url && !/^https:\/\/\S+$/.test(row.archive_url)) fail(file, `${where} has an invalid archive_url`);
  if (row.archived_at && !isRealDate(row.archived_at)) fail(file, `${where} "archived_at" must be a real date`);
  if (Boolean(row.archive_url) !== Boolean(row.archived_at)) fail(file, `${where} needs both archive_url and archived_at, or neither`);
  if (!row.archive_url) warn(file, `${where} has no archived copy yet (npm run archive)`);
}

// Promises: data/deadlines.yml, checked against the published promise format.
const promiseSchema = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'standard', 'v0.1', 'promise.schema.json'), 'utf8'));
// strictRequired is an Ajv lint, not part of JSON Schema: the format requires fields inside if/then branches.
const validatePromise = new Ajv2020({ allErrors: true, strict: true, strictRequired: false }).compile(promiseSchema);
const deadlinesFile = path.join(DATA_DIR, 'deadlines.yml');
const deadlines = load(deadlinesFile) ?? [];
if (!Array.isArray(deadlines)) {
  fail(deadlinesFile, 'must be a list');
} else {
  const keys = new Set();
  deadlines.forEach((row, i) => {
    const where = `row ${i + 1}`;
    for (const problem of schemaErrors(validatePromise, row)) fail(deadlinesFile, `${where} ${problem}`);
    if (!row || typeof row !== 'object') return;
    for (const key of ['date_said', 'deadline', 'outcome_date']) {
      if (row[key] && !isRealDate(row[key])) fail(deadlinesFile, `${where} "${key}" must be a real YYYY-MM-DD date`);
    }
    // The deadline must follow from its rule, so every derivation can be checked by machine.
    if (row.claim_type === 'dated' && row.deadline_rule && isRealDate(row.date_said)) {
      try {
        const derived = deriveDeadline(row.deadline_rule, row.date_said);
        if (derived.deadline !== row.deadline) fail(deadlinesFile, `${where} deadline ${row.deadline} does not follow from "${row.deadline_rule}", expected ${derived.deadline}`);
        if (derived.precision !== row.deadline_precision) fail(deadlinesFile, `${where} deadline_precision should be "${derived.precision}" for "${row.deadline_rule}"`);
      } catch (error) {
        fail(deadlinesFile, `${where} ${error.message}`);
      }
      if (row.deadline && row.deadline < row.date_said) fail(deadlinesFile, `${where} deadline is before date_said`);
    }
    if (row.outcome_date) {
      if (row.outcome_date < row.date_said) fail(deadlinesFile, `${where} outcome_date is before date_said`);
      if (row.outcome_date > TODAY) fail(deadlinesFile, `${where} outcome_date is in the future`);
    }
    if (row.instrument && !instrumentIds.has(row.instrument)) fail(deadlinesFile, `${where} instrument "${row.instrument}" does not exist`);
    if (row.date_said && row.who) {
      const key = promiseKey(row);
      if (keys.has(key)) fail(deadlinesFile, `${where} repeats ${key}; one speaker can have one promise per day`);
      keys.add(key);
    }
    if (i > 0 && row.date_said && deadlines[i - 1]?.date_said && row.date_said > deadlines[i - 1].date_said) {
      fail(deadlinesFile, `${where} is out of order, keep the list newest first`);
    }
    checkArchive(deadlinesFile, where, row);
  });
}

// Monitoring layer: watched sources, the Radar and the scan log
const COUNTRIES = new Set(['ID', 'MY', 'SG', 'TH', 'VN', 'PH', 'BN', 'KH', 'LA', 'MM', 'TL', 'ASEAN']);
const sourcesFile = KIT ? path.join(DATA_DIR, 'sources.yml') : path.join(DATA, 'watch', 'sources.yml');
const watchSources = load(sourcesFile) ?? [];
const sourceIds = new Set();
if (!Array.isArray(watchSources)) {
  fail(sourcesFile, 'must be a list');
} else {
  watchSources.forEach((row, i) => {
    for (const key of ['id', 'name', 'kind', 'country', 'language']) {
      if (!row?.[key]) fail(sourcesFile, `row ${i + 1} is missing "${key}"`);
    }
    if (row?.id && sourceIds.has(row.id)) fail(sourcesFile, `duplicate id "${row.id}"`);
    if (row?.id) sourceIds.add(row.id);
    if (row?.country && !COUNTRIES.has(row.country)) fail(sourcesFile, `row ${i + 1} has an unknown country "${row.country}"`);
    if (row?.kind === 'news-search' && (!row.query || !/^[a-z]{2}-[A-Z]{2}$/.test(row.edition ?? ''))) {
      fail(sourcesFile, `row ${i + 1} news-search needs "query" and an "edition" like id-ID`);
    } else if (['page-links', 'rss'].includes(row?.kind) && !/^https:\/\/\S+$/.test(row.url ?? '')) {
      fail(sourcesFile, `row ${i + 1} ${row.kind} needs an https "url"`);
    } else if (row?.kind && !['news-search', 'page-links', 'rss'].includes(row.kind)) {
      fail(sourcesFile, `row ${i + 1} has an unknown kind "${row.kind}"`);
    }
  });
}

// Everything below this point belongs to the Monsoon Ledger project itself, not to the format.
function projectChecks() {
  const radarFile = path.join(DATA, 'radar.yml');
  const radar = load(radarFile) ?? {};
  const radarLeads = Array.isArray(radar.leads) ? radar.leads : [];
  if (!Array.isArray(radar.leads)) fail(radarFile, 'must have a "leads" list');
  const leadIds = new Set();
  radarLeads.forEach((lead, i) => {
    const where = `lead ${i + 1}`;
    for (const key of ['id', 'found', 'title', 'url', 'country', 'source', 'status']) {
      if (lead?.[key] === undefined || lead[key] === null || lead[key] === '') fail(radarFile, `${where} is missing "${key}"`);
    }
    if (lead?.id && !/^[0-9a-f]{10}$/.test(lead.id)) fail(radarFile, `${where} has a malformed id`);
    if (lead?.id && leadIds.has(lead.id)) fail(radarFile, `duplicate lead id "${lead.id}"`);
    if (lead?.id) leadIds.add(lead.id);
    if (lead?.found && !isRealDate(lead.found)) fail(radarFile, `${where} "found" must be a real date`);
    if (lead?.url && !/^https?:\/\/\S+$/.test(lead.url)) fail(radarFile, `${where} has an invalid url`);
    if (lead?.status && !['new', 'reviewed', 'promoted', 'dismissed'].includes(lead.status)) {
      fail(radarFile, `${where} "status" must be new, reviewed, promoted or dismissed`);
    }
    if (lead?.country && !COUNTRIES.has(lead.country)) fail(radarFile, `${where} has an unknown country`);
    if (lead?.instrument && !instrumentIds.has(lead.instrument)) fail(radarFile, `${where} instrument "${lead.instrument}" does not exist`);
    if (lead?.promoted_to && !fs.existsSync(path.join(ENTRIES, `${lead.promoted_to}.yml`))) {
      fail(radarFile, `${where} promoted_to "${lead.promoted_to}" is not an entry`);
    }
  });

  const scanLogFile = path.join(DATA, 'scan-log.yml');
  const scanLog = load(scanLogFile) ?? [];
  if (!Array.isArray(scanLog)) fail(scanLogFile, 'must be a list');

  // Entries
  const schema = JSON.parse(fs.readFileSync(path.join(DATA, 'schema.json'), 'utf8'));
  const validateEntry = ajv.compile(schema);
  const quotedSources = new Map();
  const files = entryFiles();
  const loadedEntries = [];
  if (files.length === 0) errors.push('data/entries: no entries found');

  for (const name of files) {
    const file = path.join(ENTRIES, name);
    if (!name.endsWith('.yml')) {
      fail(file, 'use the .yml extension');
      continue;
    }
    const entry = load(file);
    if (entry === undefined) continue;

    for (const problem of schemaErrors(validateEntry, entry)) fail(file, problem);
    if (typeof entry !== 'object' || entry === null) continue;
    loadedEntries.push(entry);
    (entry.sources ?? []).forEach((src, j) => checkArchive(file, `source ${j + 1}`, src));

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

  // Build log: one row per change the author asked for, newest first.
  const buildLogFile = path.join(DATA, 'build-log.yml');
  const buildLog = load(buildLogFile) ?? [];
  const BUILD_KINDS = ['feature', 'fix', 'content', 'revert', 'rollback'];
  if (!Array.isArray(buildLog) || buildLog.length === 0) {
    fail(buildLogFile, 'must be a non-empty list');
  } else {
    buildLog.forEach((row, i) => {
      const where = `row ${i + 1}`;
      for (const key of ['date', 'kind', 'title_en', 'title_id', 'detail_en', 'detail_id']) {
        if (!row?.[key] || String(row[key]).trim() === '') fail(buildLogFile, `${where} is missing "${key}"`);
      }
      if (row?.date && !isRealDate(row.date)) fail(buildLogFile, `${where} "date" must be a real YYYY-MM-DD date`);
      if (row?.kind && !BUILD_KINDS.includes(row.kind)) fail(buildLogFile, `${where} "kind" must be ${BUILD_KINDS.join(', ')}`);
      if (row?.pr !== undefined && !(Number.isInteger(row.pr) && row.pr > 0)) fail(buildLogFile, `${where} "pr" must be a pull request number`);
      if (!Array.isArray(row?.commits) || row.commits.length === 0) fail(buildLogFile, `${where} needs at least one commit`);
      for (const c of row?.commits ?? []) {
        if (typeof c !== 'string' || !/^[0-9a-f]{7,40}$/.test(c)) fail(buildLogFile, `${where} has a malformed commit "${c}", write hashes in quotes`);
      }
      if (i > 0 && row?.date && buildLog[i - 1]?.date && row.date > buildLog[i - 1].date) fail(buildLogFile, `${where} is out of order, keep the list newest first`);
    });
  }

  // Ontology layer: institutions, curated relations, and the fused graph built from all of the above.
  const ontologyFile = path.join(DATA, 'ontology.yml');
  const ontology = load(ontologyFile) ?? {};
  const institutionIds = new Set();
  const aliases = new Set();
  (Array.isArray(ontology.institutions) ? ontology.institutions : []).forEach((row, i) => {
    for (const key of ['id', 'name_en', 'name_id', 'country']) if (!row?.[key]) fail(ontologyFile, `institution ${i + 1} is missing "${key}"`);
    if (row?.id && institutionIds.has(row.id)) fail(ontologyFile, `duplicate institution id "${row.id}"`);
    if (row?.id) institutionIds.add(row.id);
    if (row?.country && !COUNTRIES.has(row.country)) fail(ontologyFile, `institution ${i + 1} has an unknown country`);
    for (const a of row?.aliases ?? []) {
      if (aliases.has(a.toLowerCase())) fail(ontologyFile, `alias "${a}" is used by two institutions`);
      aliases.add(a.toLowerCase());
    }
  });
  if (!Array.isArray(ontology.institutions)) fail(ontologyFile, 'must have an "institutions" list');
  if (!Array.isArray(ontology.relations)) fail(ontologyFile, 'must have a "relations" list');

  // The bibliography lives in TypeScript, so its keys and urls are read from the source text.
  const referencesText = fs.readFileSync(path.join(ROOT, 'site', 'src', 'lib', 'references.ts'), 'utf8');
  const referenceKeys = new Set([...referencesText.matchAll(/^  '?([a-z0-9-]+)'?: \{/gm)].map((m) => m[1]));
  const referenceUrls = new Set([...referencesText.matchAll(/url: '([^']+)'/g)].map((m) => m[1]));
  for (const group of ['compared_with', 'ranked_under']) {
    for (const key of ontology.references?.[group] ?? []) {
      if (!referenceKeys.has(key)) fail(ontologyFile, `references.${group} "${key}" is not in site/src/lib/references.ts`);
    }
  }

  // A curated link may only rest on a source the ledger already cites.
  const citedUrls = new Set([
    ...loadedEntries.flatMap((e) => (e.sources ?? []).map((s) => s?.url)),
    ...deadlines.map((d) => d?.source_url),
    ...instruments.map((i) => i?.source_url),
    ...referenceUrls,
  ]);
  (ontology.relations ?? []).forEach((r, i) => {
    if (r?.source_url && !citedUrls.has(r.source_url)) {
      fail(ontologyFile, `relation ${i + 1} source_url is not cited anywhere in the ledger: ${r.source_url}`);
    }
  });

  const references = Object.fromEntries([...referenceKeys].map((k) => [k, { text: k }]));
  const graph = buildOntology({ entries: loadedEntries, instruments, deadlines, ontology, leads: radarLeads, references, today: TODAY });
  for (const problem of graph.problems) fail(ontologyFile, problem);

  return `${files.length} entries, ${radarLeads.length} radar leads, ontology ${graph.nodes.length} objects and ${graph.links.length} links, ${buildLog.length} build log rows`;
}
const projectSummary = KIT ? null : projectChecks();

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
scan(KIT ? DATA_DIR : ROOT);

if (warnings.length) {
  console.warn(`${warnings.length} warning(s), not failures:`);
  for (const w of warnings.slice(0, 12)) console.warn(`  ! ${w}`);
  if (warnings.length > 12) console.warn(`  ! and ${warnings.length - 12} more`);
}
if (errors.length) {
  console.error(`Validation failed with ${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  x ${e}`);
  process.exit(1);
}
const parts = [`${instruments.length} instruments`, `${deadlines.length} promises`, `${watchSources.length} watched sources`];
if (projectSummary) parts.unshift(projectSummary);
console.log(`Validation passed${KIT ? ` for ${path.relative(ROOT, DATA_DIR)}` : ''}: ${parts.join(', ')}, no em or en dashes.`);
