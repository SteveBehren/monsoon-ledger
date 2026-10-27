// Analysis papers: front matter, numbered citations and direct quotes.
// Shared by the validator, the quote checker and the site loader (site/src/lib/analysis.ts),
// so the rules for citations and quotes live in one place.
//
// A paper is a Markdown file with YAML front matter:
//   writing/analysis/<id>.en.md    the full English text
//   writing/analisis/<id>.id.md    the Bahasa Indonesia text, which may be partial
// Its sources are a numbered list in data/analysis/<id>.sources.yml, cited in the text as [n] or [n, m].
// Direct quotes are marked, so they can be counted and checked against their source:
//   <q data-src="n">...</q>                                   an inline quote, under 15 words
//   <blockquote data-src="n"><p lang="id">...</p>...</blockquote>   a block quote, under 15 words
//   <blockquote class="statute" data-src="n">...</blockquote>  statute text, exempt from the length limit
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, siteRequire, isRealDate } from './lib.mjs';

// The site passes its own root, because a bundled copy of this module cannot locate itself.
export const paperDirs = (root = ROOT) => ({ en: path.join(root, 'writing', 'analysis'), id: path.join(root, 'writing', 'analisis') });
export const PAPER_DIRS = paperDirs();
export const QUOTE_WORD_LIMIT = 15;
const REQUIRED = ['id', 'lang', 'title', 'subtitle', 'author', 'published', 'facts_as_of', 'version', 'sources', 'summary'];

/** Splits `---` YAML front matter from a Markdown body. */
export function splitFrontMatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) return { data: {}, body: text };
  const yaml = siteRequire('js-yaml');
  return { data: yaml.load(m[1], { schema: yaml.CORE_SCHEMA }) ?? {}, body: text.slice(m[0].length) };
}

/** Paper ids that have an English text. */
export function paperIds(root = ROOT) {
  const dir = paperDirs(root).en;
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.en.md'))
    .map((f) => f.replace(/\.en\.md$/, ''))
    .sort();
}

export function paperFile(id, lang, root = ROOT) {
  return path.join(paperDirs(root)[lang], `${id}.${lang}.md`);
}

export function loadPaper(id, lang, root = ROOT) {
  const file = paperFile(id, lang, root);
  if (!fs.existsSync(file)) return null;
  const { data, body } = splitFrontMatter(fs.readFileSync(file, 'utf8'));
  return { file, meta: data, body };
}

export function loadSources(file, root = ROOT) {
  const yaml = siteRequire('js-yaml');
  return yaml.load(fs.readFileSync(path.resolve(root, file), 'utf8'), { schema: yaml.CORE_SCHEMA }) ?? [];
}

const CITE = /\[(\d+(?:\s*,\s*\d+)*)\](?!\()/g;

/** Every citation group in a body, such as [1, 11, 2], with its numbers. */
export function citationGroups(body) {
  const clean = body.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));
  return [...clean.matchAll(CITE)].map((m) => ({ raw: m[0], index: m.index, nums: m[1].split(',').map((n) => Number(n.trim())) }));
}

const attr = (attrs, name) => new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1];
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Words in a quote. Ellipses and punctuation do not count. */
export function wordCount(text) {
  return stripTags(text)
    .replace(/\.\.\.|…/g, ' ')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Every marked quote: { kind: 'inline' | 'block' | 'statute', src, text, lang }. */
export function extractQuotes(body) {
  const out = [];
  for (const m of body.matchAll(/<q\b([^>]*)>([\s\S]*?)<\/q>/g)) {
    out.push({ kind: 'inline', src: Number(attr(m[1], 'data-src')), text: stripTags(m[2]), lang: attr(m[1], 'lang') ?? null });
  }
  for (const m of body.matchAll(/<blockquote\b([^>]*)>([\s\S]*?)<\/blockquote>/g)) {
    const p = /<p\b([^>]*)>([\s\S]*?)<\/p>/.exec(m[2]);
    out.push({
      kind: /class="[^"]*\bstatute\b/.test(m[1]) ? 'statute' : 'block',
      src: Number(attr(m[1], 'data-src')),
      text: stripTags(p ? p[2] : m[2]),
      lang: p ? attr(p[1], 'lang') ?? null : null,
    });
  }
  return out;
}

/** Straight-quoted runs of six or more words outside marked quotes: likely unmarked direct quotes. */
export function unmarkedQuotes(body) {
  const prose = body
    .replace(/^---[\s\S]*?\n---\n/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<blockquote\b[\s\S]*?<\/blockquote>/g, '')
    .replace(/<q\b[\s\S]*?<\/q>/g, '')
    .replace(/<[^>]+>/g, '');
  return [...prose.matchAll(/(?<!\()"([^"\n]+)"/g)].map((m) => m[1]).filter((s) => wordCount(s) >= 6);
}

/**
 * Problems with one paper text, and the set of source numbers it cites, so the validator can
 * check that the English text cites every source.
 */
/**
 * Sources cited by a generated block rather than by [n] in the text. The promise table
 * (<div data-table="promises">) cites the source of each promise, so a paper source whose
 * url is a promise source counts as cited where the table appears.
 */
export function generatedCitations(body, sources, promiseUrls = []) {
  const cited = new Set();
  if (!/data-table="promises"/.test(body)) return cited;
  const urls = new Set(promiseUrls);
  for (const s of sources) if (s?.url && urls.has(s.url)) cited.add(s.n);
  return cited;
}

export function checkPaper({ meta, body }, sources, { lang, id, promiseUrls = [] }) {
  const problems = [];
  for (const key of REQUIRED) if (meta[key] === undefined || meta[key] === '') problems.push(`front matter is missing "${key}"`);
  if (meta.id && meta.id !== id) problems.push(`front matter id "${meta.id}" must equal the file name "${id}"`);
  if (meta.lang && meta.lang !== lang) problems.push(`front matter lang "${meta.lang}" must be "${lang}"`);
  for (const key of ['published', 'facts_as_of']) if (meta[key] && !isRealDate(meta[key])) problems.push(`"${key}" must be a real YYYY-MM-DD date`);
  if (meta.partial !== undefined && typeof meta.partial !== 'boolean') problems.push('"partial" must be true or false');

  const numbers = new Set(sources.map((s) => s?.n));
  const cited = new Set();
  for (const g of citationGroups(body)) {
    for (const n of g.nums) {
      if (!numbers.has(n)) problems.push(`citation ${g.raw} points to source ${n}, which is not in ${meta.sources}`);
      cited.add(n);
    }
  }

  for (const n of generatedCitations(body, sources, promiseUrls)) cited.add(n);

  const perSource = new Map();
  for (const q of extractQuotes(body)) {
    if (!numbers.has(q.src)) {
      problems.push(`quote "${q.text.slice(0, 40)}" has data-src="${Number.isNaN(q.src) ? '' : q.src}", which is not a source`);
      continue;
    }
    if (q.kind !== 'statute') {
      const words = wordCount(q.text);
      if (words >= QUOTE_WORD_LIMIT) problems.push(`quote from source ${q.src} has ${words} words, it must be under ${QUOTE_WORD_LIMIT}: "${q.text.slice(0, 60)}"`);
      perSource.set(q.src, [...(perSource.get(q.src) ?? []), q.text]);
    }
  }
  for (const [n, texts] of perSource) {
    if (new Set(texts.map((t) => t.toLowerCase())).size > 1) problems.push(`source ${n} is quoted ${texts.length} times, use at most one quote per source`);
  }
  for (const s of unmarkedQuotes(body)) problems.push(`unmarked direct quote "${s.slice(0, 60)}": mark it with <q data-src="n"> or paraphrase it`);
  return { problems, cited };
}

/** Problems with a numbered sources list. */
export function checkSources(sources) {
  const problems = [];
  if (!Array.isArray(sources) || sources.length === 0) return ['must be a non-empty list'];
  const urls = new Map();
  const keys = new Set();
  sources.forEach((s, i) => {
    const where = `source ${i + 1}`;
    if (s?.n !== i + 1) problems.push(`${where} has n: ${s?.n}, expected ${i + 1} (number sources in order)`);
    for (const k of ['key', 'title', 'url', 'accessed']) if (!s?.[k]) problems.push(`${where} is missing "${k}"`);
    if (s?.key && keys.has(s.key)) problems.push(`${where} repeats key "${s.key}"`);
    if (s?.key) keys.add(s.key);
    if (s?.url && !/^https:\/\/\S+$/.test(s.url)) problems.push(`${where} url must be https`);
    if (s?.url && urls.has(s.url)) problems.push(`${where} repeats the url of source ${urls.get(s.url)}`);
    if (s?.url) urls.set(s.url, s.n);
    if (s?.accessed && !isRealDate(s.accessed)) problems.push(`${where} "accessed" must be a real date`);
  });
  return problems;
}

/** The papers as the ontology sees them: id, titles, dates, the instruments named, and the sources. */
export function ontologyPapers(root = ROOT) {
  return paperIds(root).map((id) => {
    const en = loadPaper(id, 'en', root);
    const idText = loadPaper(id, 'id', root);
    const sources = loadSources(en.meta.sources, root);
    return {
      id,
      title_en: en.meta.title,
      title_id: idText?.meta.title,
      published: String(en.meta.published),
      facts_as_of: String(en.meta.facts_as_of),
      version: String(en.meta.version),
      instruments: en.meta.discusses?.instruments ?? [],
      sources: (Array.isArray(sources) ? sources : []).map((s) => ({ url: s.url, title: s.title })),
    };
  });
}
