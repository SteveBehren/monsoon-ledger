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
import { paperIds, loadPaper, loadSources, checkPaper, checkSources, extractQuotes, ontologyPapers } from './analysis.mjs';
import { collectQuotes, compareWithChecks, STATUSES as QUOTE_STATUSES } from './quotes.mjs';
import { checkLens } from './lens.mjs';
import { computeAll, checkIncidents, resolveTokens } from './frontier.mjs';

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
function checkPromises(file, rows, { order = true } = {}) {
  if (!Array.isArray(rows)) return fail(file, 'must be a list');
  const keys = new Set();
  rows.forEach((row, i) => {
    const where = `row ${i + 1}`;
    for (const problem of schemaErrors(validatePromise, row)) fail(file, `${where} ${problem}`);
    if (!row || typeof row !== 'object') return;
    for (const key of ['date_said', 'deadline', 'outcome_date']) {
      if (row[key] && !isRealDate(row[key])) fail(file, `${where} "${key}" must be a real YYYY-MM-DD date`);
    }
    // The deadline must follow from its rule, so every derivation can be checked by machine.
    if (row.claim_type === 'dated' && row.deadline_rule && isRealDate(row.date_said)) {
      try {
        const derived = deriveDeadline(row.deadline_rule, row.date_said);
        if (derived.deadline !== row.deadline) fail(file, `${where} deadline ${row.deadline} does not follow from "${row.deadline_rule}", expected ${derived.deadline}`);
        if (derived.precision !== row.deadline_precision) fail(file, `${where} deadline_precision should be "${derived.precision}" for "${row.deadline_rule}"`);
      } catch (error) {
        fail(file, `${where} ${error.message}`);
      }
      if (row.deadline && row.deadline < row.date_said) fail(file, `${where} deadline is before date_said`);
    }
    if (row.outcome_date) {
      if (row.outcome_date < row.date_said) fail(file, `${where} outcome_date is before date_said`);
      if (row.outcome_date > TODAY) fail(file, `${where} outcome_date is in the future`);
    }
    if (row.instrument && !instrumentIds.has(row.instrument)) fail(file, `${where} instrument "${row.instrument}" does not exist`);
    if (row.date_said && row.who) {
      const key = promiseKey(row);
      if (keys.has(key)) fail(file, `${where} repeats ${key}; one speaker can have one promise per day`);
      keys.add(key);
    }
    if (order && i > 0 && row.date_said && rows[i - 1]?.date_said && row.date_said > rows[i - 1].date_said) {
      fail(file, `${where} is out of order, keep the list newest first`);
    }
    checkArchive(file, where, row);
  });
}

const deadlinesFile = path.join(DATA_DIR, 'deadlines.yml');
const deadlines = load(deadlinesFile) ?? [];
checkPromises(deadlinesFile, deadlines);

// The worked examples published with the format must stay valid against it.
if (!KIT) {
  const examplesDir = path.join(ROOT, 'docs', 'standard', 'v0.1', 'examples');
  for (const name of fs.readdirSync(examplesDir).filter((f) => f.endsWith('.yml'))) {
    const file = path.join(examplesDir, name);
    checkPromises(file, load(file) ?? [], { order: false });
  }
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
    if (entry.lens_checked && !isRealDate(entry.lens_checked)) fail(file, `lens_checked "${entry.lens_checked}" is not a real date`);
    const lens = checkLens(entry, instruments.find((i) => i?.id === entry.instrument));
    for (const problem of lens.problems) fail(file, problem);
    for (const warning of lens.warnings) warn(file, warning);
    if (!entry.my_take) warn(file, 'my_take is empty: the author has not written a take yet, so the page shows none');

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
        if (other) fail(file, `this source is already quoted in ${other.where}, use at most one quote per source`);
        quotedSources.set(entry.quote.source_url, { where: name, text: String(entry.quote.original ?? '') });
      }
    }
  }

  // Frontier incident reference: schema, date order, and no typed day counts.
  const incidentsFile = path.join(DATA, 'frontier-incidents.yml');
  const incidentRows = load(incidentsFile) ?? [];
  const validateIncidents = ajv.compile(JSON.parse(fs.readFileSync(path.join(DATA, 'frontier-incidents.schema.json'), 'utf8')));
  for (const problem of schemaErrors(validateIncidents, incidentRows)) fail(incidentsFile, problem);
  for (const problem of checkIncidents(incidentRows)) fail(incidentsFile, problem);
  (Array.isArray(incidentRows) ? incidentRows : []).forEach((r) => {
    for (const k of ['activity_start', 'activity_end', 'developer_aware', 'first_public_disclosure', 'notified_at', 'last_checked']) {
      if (r?.[k] && !isRealDate(r[k])) fail(incidentsFile, `${r.id}: ${k} "${r[k]}" is not a real date`);
    }
    (r?.sources ?? []).forEach((src, j) => checkArchive(incidentsFile, `${r.id} source ${j + 1}`, src));
  });
  const incidents = computeAll(incidentRows);

  // Analysis papers: front matter, numbered sources, citations and the quote rules.
  // A source quoted in an entry may be quoted in a paper only with the same words.
  const papers = KIT ? [] : paperIds();
  const promiseUrls = (Array.isArray(deadlines) ? deadlines : []).map((d) => d?.source_url).filter(Boolean);
  const entryIds = new Set(loadedEntries.map((e) => e.id));
  for (const id of papers) {
    const en = loadPaper(id, 'en');
    const sourcesFile = path.join(ROOT, en.meta.sources ?? `data/analysis/${id}.sources.yml`);
    let sources = [];
    try {
      sources = loadSources(sourcesFile);
    } catch (err) {
      fail(sourcesFile, `cannot read the sources: ${err.message.split('\n')[0]}`);
    }
    for (const problem of checkSources(sources)) fail(sourcesFile, problem);
    (Array.isArray(sources) ? sources : []).forEach((src, i) => checkArchive(sourcesFile, `source ${i + 1}`, src));
    const texts = [['en', en], ['id', loadPaper(id, 'id')]].filter(([, doc]) => doc);
    for (const [lang, doc] of texts) {
      try {
        resolveTokens(doc.body, incidents);
      } catch (err) {
        fail(doc.file, err.message);
      }
      const { problems, cited } = checkPaper(doc, Array.isArray(sources) ? sources : [], { lang, id, promiseUrls });
      for (const problem of problems) fail(doc.file, problem);
      if (lang === 'en') {
        for (const s of sources) if (s?.n && !cited.has(s.n)) fail(sourcesFile, `source ${s.n} is never cited in the English text`);
      }
      for (const q of extractQuotes(doc.body)) {
        const url = sources.find((s) => s.n === q.src)?.url;
        const entryQuote = url && quotedSources.get(url);
        if (q.kind !== 'statute' && entryQuote && entryQuote.text.trim().toLowerCase() !== q.text.trim().toLowerCase()) {
          fail(doc.file, `source ${q.src} is already quoted in ${entryQuote.where} with other words, use at most one quote per source`);
        }
      }
    }
    // Numbers typed where tokens cannot reach (the Word document, the drafts) must still match.
    for (const { token, value } of en.meta.stated_numbers ?? []) {
      try {
        const now = Number(resolveTokens(`{{${token}}}`, incidents));
        if (now !== value) fail(en.file, `stated number ${token} is ${value} in the Word document and drafts, but the data now gives ${now}`);
      } catch (err) {
        fail(en.file, err.message);
      }
    }
    for (const e of en.meta.discusses?.entries ?? []) if (!entryIds.has(e)) fail(en.file, `discusses entry "${e}", which does not exist`);
    for (const i of en.meta.discusses?.instruments ?? []) if (!instrumentIds.has(i)) fail(en.file, `discusses instrument "${i}", which does not exist`);
    if (en.meta.docx && !fs.existsSync(path.join(ROOT, 'site', 'public', en.meta.docx))) fail(en.file, `docx "${en.meta.docx}" is not in site/public`);
  }

  // Quote check (npm run check-quotes): a quote that is in the content now and was not found in
  // its source fails. A quote not yet checked, or whose source could not be read, is a warning.
  const quoteCheckFile = path.join(DATA, 'quote-check.yml');
  const quoteRows = fs.existsSync(quoteCheckFile) ? load(quoteCheckFile) ?? [] : [];
  (Array.isArray(quoteRows) ? quoteRows : []).forEach((r, i) => {
    if (!QUOTE_STATUSES.includes(r?.status)) fail(quoteCheckFile, `row ${i + 1}: status must be ${QUOTE_STATUSES.join(', ')}`);
    if (!isRealDate(r?.checked_at)) fail(quoteCheckFile, `row ${i + 1}: checked_at must be a real date`);
  });
  const currentQuotes = collectQuotes({ root: ROOT, entries: loadedEntries.map((e) => ({ file: `data/entries/${e.id}.yml`, data: e })) });
  const { notFound, unchecked } = compareWithChecks(currentQuotes, quoteRows);
  for (const q of notFound) fail(path.join(ROOT, [q.where].flat()[0]), `quote "${q.text.slice(0, 50)}" was not found in its source (${q.url}). Fix or remove it, then run npm run check-quotes`);
  for (const q of unchecked) warn(path.join(ROOT, [q.where].flat()[0]), `quote "${q.text.slice(0, 50)}" is not yet checked against its source (npm run check-quotes)`);

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
  const graph = buildOntology({ entries: loadedEntries, instruments, deadlines, ontology, leads: radarLeads, references, papers: ontologyPapers(), today: TODAY });
  for (const problem of graph.problems) fail(ontologyFile, problem);

  return `${files.length} entries, ${papers.length} analysis paper(s), ${incidents.length} frontier incidents, ${radarLeads.length} radar leads, ontology ${graph.nodes.length} objects and ${graph.links.length} links, ${buildLog.length} build log rows`;
}
const projectSummary = KIT ? null : projectChecks();

// No em dashes or en dashes anywhere in the project text.
const BANNED = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
// The same dashes written as HTML entities, which render as dashes on the page.
const BANNED_ENTITY = new RegExp(['&', '[nm]dash;|&#82', '1[23];|&#x201', '[34];'].join(''), 'i');
// Scanner fixtures copy real feeds, dash entities included, to test that the scanner removes them.
const ENTITY_EXEMPT = path.join(ROOT, 'scripts', 'scan', 'fixtures');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.astro', '.vercel']);
const SKIP_FILES = new Set(['package-lock.json']);
const TEXT_EXT = /\.(ya?ml|json|md|mjs|js|ts|astro|css|html|xml|txt|svg|cff)$|^\.gitkeep$|^LICENSE$|^CODEOWNERS$/;

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
        if (BANNED.test(line) || (!file.startsWith(ENTITY_EXEMPT) && BANNED_ENTITY.test(line))) fail(file, `line ${i + 1} contains an em dash or en dash, use a comma or a full stop`);
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
