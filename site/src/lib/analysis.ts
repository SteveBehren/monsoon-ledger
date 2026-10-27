// Analysis papers: longer written work, rendered from Markdown at build time.
// The rules for front matter, citations and quotes live in scripts/analysis.mjs, which the
// validator also uses. This module turns a paper into HTML for the pages under /[lang]/analysis/.
import fs from 'node:fs';
import path from 'node:path';
import { markdownToHtml } from 'satteri';
import GithubSlugger from 'github-slugger';
// @ts-ignore: plain JavaScript module shared with the validator.
import { paperIds, loadPaper, loadSources, wordCount } from '../../../scripts/analysis.mjs';
// @ts-ignore: plain JavaScript module shared with the validator and the share cards.
import { computePromise, promiseKey } from '../../../scripts/promises.mjs';
import { getDeadlines, type Deadline, type Outcome } from './data';
// @ts-ignore: plain JavaScript module shared with the validator.
import { loadIncidents, resolveTokens } from '../../../scripts/frontier.mjs';
import type { Lang } from './i18n';

const ROOT = path.resolve(process.cwd(), '..');

export interface PaperSource {
  n: number;
  key: string;
  title: string;
  url: string;
  accessed: string;
  archive_url?: string;
  archived_at?: string;
}

export interface PaperMeta {
  id: string;
  number: number;
  lang: Lang;
  title: string;
  subtitle: string;
  author: string;
  published: string;
  facts_as_of: string;
  version: string;
  sources: string;
  summary: string;
  docx?: string;
  partial?: boolean;
  /** Bahasa Indonesia texts only: heading id here, matching heading id in the English text. */
  en_sections?: Record<string, string>;
  discusses?: { entries?: string[]; instruments?: string[] };
}

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** A paper body is HTML with two generated blocks between its parts. */
export type Segment =
  | { kind: 'html'; html: string }
  | { kind: 'figure'; name: string; caption: string }
  | { kind: 'table'; name: string; caption: string; captionId: string };

export interface Paper {
  meta: PaperMeta;
  segments: Segment[];
  toc: TocItem[];
  sources: PaperSource[];
  /** For each source number, how many times the text cites it, for the back-links. */
  citeCounts: Map<number, number>;
  words: number;
  minutes: number;
  docxBytes: number | null;
  /** Rows of the generated promise table, computed as of the paper's facts_as_of day. */
  promises: PaperPromise[];
}

/** A promise as the paper shows it: its state on the paper's facts day, and its citation. */
export interface PaperPromise {
  key: string;
  row: Deadline;
  outcome: Outcome;
  days_past: number | null;
  days_remaining: number | null;
  /** The paper source with the same url, and the id of this citation, for the back-links. */
  cite: { n: number; id: string } | null;
}

/**
 * Every promise in data/deadlines.yml, newest first, with its outcome computed by
 * scripts/promises.mjs on the paper's facts day, so the figure and table match the text.
 */
function paperPromises(asOf: string, sources: PaperSource[], counts: Map<number, number>): PaperPromise[] {
  return getDeadlines()
    .slice()
    .sort((a, b) => b.date_said.localeCompare(a.date_said))
    .map((row) => {
      const c = computePromise(row, asOf);
      const n = sources.find((s) => s.url === row.source_url)?.n;
      let cite: PaperPromise['cite'] = null;
      if (n) {
        const k = (counts.get(n) ?? 0) + 1;
        counts.set(n, k);
        cite = { n, id: `cite-${n}-${k}` };
      }
      return { key: promiseKey(row), row, outcome: c.outcome, days_past: c.days_past, days_remaining: c.days_remaining, cite };
    });
}

/** Ids of every paper with an English text. */
export function getPaperIds(): string[] {
  return paperIds(ROOT);
}

export function hasPaper(id: string, lang: Lang): boolean {
  return loadPaper(id, lang, ROOT) !== null;
}

const CITE = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const textOf = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();

/**
 * Replaces [n] and [n, m] in text (never inside tags, code or links) with linked superscripts.
 * Each link gets an id cite-n-k, the k-th citation of source n, so References can link back.
 */
function linkCitations(html: string, counts: Map<number, number>): string {
  let skip = 0;
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith('<')) {
        if (/^<(code|pre|a)\b/i.test(part)) skip++;
        else if (/^<\/(code|pre|a)>/i.test(part)) skip = Math.max(0, skip - 1);
        return part;
      }
      if (skip) return part;
      return part.replace(CITE, (_, nums: string) => {
        const links = nums.split(',').map((raw) => {
          const n = Number(raw.trim());
          const k = (counts.get(n) ?? 0) + 1;
          counts.set(n, k);
          return `<a href="#ref-${n}" id="cite-${n}-${k}">${n}</a>`;
        });
        return `<sup class="cite">[${links.join(', ')}]</sup>`;
      });
    })
    .join('');
}

/** Adds ids to h2 and h3 and collects them for the table of contents. */
function addHeadingIds(html: string, toc: TocItem[]): string {
  const slugger = new GithubSlugger();
  return html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level: string, inner: string) => {
    const text = textOf(inner);
    const id = slugger.slug(text);
    toc.push({ id, text, level: Number(level) as 2 | 3 });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
}

/**
 * A bold "Table N. ..." paragraph right before a table becomes its caption, and every table
 * scrolls sideways inside a labelled, focusable region. Header cells get scope="col".
 */
function wrapTables(html: string): string {
  let n = 0;
  return html.replace(/(?:<p><strong>(Table [^<]+)<\/strong><\/p>\s*)?<table>([\s\S]*?)<\/table>/g, (_, caption: string | undefined, inner: string) => {
    n++;
    const id = `table-${n}`;
    const cap = caption ?? `Table ${n}`;
    const body = inner.replace(/<th>/g, '<th scope="col">');
    const captionEl = caption ? `<caption id="${id}">${caption}</caption>` : '';
    const label = caption ? `aria-labelledby="${id}"` : `aria-label="${escapeAttr(cap)}"`;
    return `<div class="table-scroll" role="region" ${label} tabindex="0"><table>${captionEl}${body}</table></div>`;
  });
}

/** Splits the body at <div data-figure> and <div data-table> markers, taking their captions along. */
function splitSegments(html: string): Segment[] {
  const out: Segment[] = [];
  const marker =
    /(?:<p><strong>([^<]+)<\/strong><\/p>\s*)?<div data-(figure|table)="([a-z-]+)"><\/div>(?:\s*<p><em>((?:Figure|Gambar)[\s\S]*?)<\/em><\/p>)?/g;
  let last = 0;
  let t = 0;
  for (const m of html.matchAll(marker)) {
    out.push({ kind: 'html', html: html.slice(last, m.index) });
    const [, before, kind, name, after] = m;
    if (kind === 'figure') out.push({ kind: 'figure', name, caption: after ?? '' });
    else {
      t++;
      out.push({ kind: 'table', name, caption: before ?? '', captionId: `gen-table-${t}` });
      if (after) out.push({ kind: 'html', html: `<p><em>${after}</em></p>` });
    }
    last = m.index! + m[0].length;
  }
  out.push({ kind: 'html', html: html.slice(last) });
  return out.filter((s) => s.kind !== 'html' || s.html.trim());
}

/**
 * In a Bahasa Indonesia text that is a partial draft translation, each section opens with the
 * draft note and a link to the matching English section.
 */
function markDraftSections(html: string, meta: PaperMeta, enHref: string): string {
  if (meta.lang !== 'id' || !meta.partial) return html;
  return html.replace(/(<h2 id="([^"]+)">[\s\S]*?<\/h2>)/g, (_, heading: string, id: string) => {
    const target = meta.en_sections?.[id];
    if (!target) throw new Error(`${meta.id}.id.md: section "${id}" has no en_sections entry`);
    return `${heading}\n<p class="draft-note">Terjemahan draf, menunggu tinjauan penulis. <a href="${enHref}#${target}" hreflang="en">Baca bagian ini dalam bahasa Inggris</a>.</p>`;
  });
}

/** Loads and renders one paper. Throws if it does not exist, so a broken route fails the build. */
export function getPaper(id: string, lang: Lang, enHref = ''): Paper {
  const doc = loadPaper(id, lang, ROOT);
  if (!doc) throw new Error(`analysis paper ${id} has no ${lang} text`);
  const meta = doc.meta as PaperMeta;
  const sources = (loadSources(meta.sources, ROOT) as PaperSource[]).map((s) => ({ ...s, accessed: String(s.accessed) }));

  // Numbers such as day counts come from data/frontier-incidents.yml, computed by scripts/frontier.mjs.
  const body = resolveTokens(doc.body.replace(/<!--[\s\S]*?-->/g, ''), loadIncidents(ROOT));
  const { html: raw } = markdownToHtml(body);
  const counts = new Map<number, number>();
  const toc: TocItem[] = [];
  let html = linkCitations(raw, counts);
  html = addHeadingIds(html, toc);
  html = wrapTables(html);
  html = markDraftSections(html, meta, enHref);

  const segments = splitSegments(html);
  const promises = segments.some((s) => s.kind === 'table' && s.name === 'promises')
    ? paperPromises(String(meta.facts_as_of), sources, counts)
    : [];

  const words = wordCount(body.replace(/<[^>]+>/g, ' ').replace(/\[[\d,\s]+\]/g, ''));
  const docxPath = meta.docx ? path.join(ROOT, 'site', 'public', meta.docx) : null;
  return {
    meta,
    segments,
    toc,
    sources,
    citeCounts: counts,
    words,
    minutes: Math.max(1, Math.round(words / 230)),
    docxBytes: docxPath && fs.existsSync(docxPath) ? fs.statSync(docxPath).size : null,
    promises,
  };
}

/** Front matter only, for lists, feeds and the sitemap. */
export function getPaperMeta(id: string, lang: Lang): PaperMeta | null {
  return (loadPaper(id, lang, ROOT)?.meta as PaperMeta | undefined) ?? null;
}

/** "155 KB": the docx size for the download button. */
export function fileSize(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

export interface ChangeLine {
  date: string;
  text: string;
  tags: string[];
}

/**
 * Lines of CHANGELOG.md, in the form "- YYYY-MM-DD [tag, tag]: text". Tags are optional.
 * Pages read the lines tagged analysis-01 (changes to the paper) and correction.
 */
export function getChangelog(): ChangeLine[] {
  const text = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
  const out: ChangeLine[] = [];
  for (const m of text.matchAll(/^- (\d{4}-\d{2}-\d{2})(?: \[([a-z0-9, -]+)\])?: (.+)$/gm)) {
    out.push({ date: m[1], tags: (m[2] ?? '').split(',').map((s) => s.trim()).filter(Boolean), text: m[3].trim() });
  }
  return out;
}

export function changesTagged(tag: string): ChangeLine[] {
  return getChangelog().filter((c) => c.tags.includes(tag));
}

/**
 * One h2 section of a paper as HTML, without its heading and without citation links (they point
 * at the paper's own reference list). Used to show the same text on another page.
 */
export function paperSection(id: string, lang: Lang, headingId: string): string {
  const paper = getPaper(id, lang, `/en/analysis/${id}/`);
  const html = paper.segments.map((s) => (s.kind === 'html' ? s.html : '')).join('');
  const start = html.indexOf(`<h2 id="${headingId}">`);
  if (start < 0) throw new Error(`${id}.${lang}: no section "${headingId}"`);
  const bodyStart = html.indexOf('</h2>', start) + 5;
  const next = html.indexOf('<h2 ', bodyStart);
  return html
    .slice(bodyStart, next < 0 ? undefined : next)
    .replace(/\s*<sup class="cite">[\s\S]*?<\/sup>/g, '')
    .replace(/<p class="draft-note">[\s\S]*?<\/p>/g, '')
    .trim();
}
