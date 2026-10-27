// Direct quotes and the check that each one appears in its source.
// Pure functions, shared by scripts/check-quotes.mjs (which fetches the sources) and the
// validator (which reads data/quote-check.yml). Tests: scripts/quotes.test.mjs.
import crypto from 'node:crypto';
import path from 'node:path';
import { extractQuotes, loadPaper, loadSources, paperIds } from './analysis.mjs';

export const STATUSES = ['found', 'not_found', 'unreachable'];

/** Text from HTML or Markdown: tags, scripts, styles, entities and link targets removed. */
export function pageText(raw) {
  return String(raw)
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\]\([^)]*\)/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;|&#8217;|&#8216;/g, "'")
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

/**
 * Normalised text for matching: Unicode NFKC, lower case, typographic quotes and apostrophes
 * unified, every run of characters that is not a letter or a digit turned into one space.
 * Apostrophes are dropped, so "anyone's" and "anyone’s" match.
 */
export function normalize(text) {
  return pageText(text)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘ʼ`']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** A quote may skip words with "..."; each part must appear in the source on its own. */
export function quoteParts(quote) {
  return String(quote)
    .split(/\.\.\.|…/)
    .map(normalize)
    .filter((p) => p.split(' ').length >= 2 || p.length >= 6);
}

export function isFound(quote, sourceText) {
  const page = ` ${normalize(sourceText)} `;
  const parts = quoteParts(quote);
  return parts.length > 0 && parts.every((p) => page.includes(` ${p} `));
}

/** A short, stable id for a quote's words, so a changed quote needs a new check. */
export const quoteHash = (text) => crypto.createHash('sha1').update(normalize(text)).digest('hex').slice(0, 12);

/**
 * Every direct quote in the project: entry quotes and the marked quotes of each analysis paper.
 * Returns { where, url, archive_url, text, kind, hash }, one row per quote and source.
 */
export function collectQuotes({ root, entries }) {
  const out = [];
  for (const { file, data } of entries) {
    if (!data?.quote?.original || !data.quote.source_url) continue;
    const src = (data.sources ?? []).find((s) => s.url === data.quote.source_url);
    out.push({ where: file, url: data.quote.source_url, archive_url: src?.archive_url, text: data.quote.original, kind: 'entry' });
  }
  for (const id of paperIds(root)) {
    for (const lang of ['en', 'id']) {
      const paper = loadPaper(id, lang, root);
      if (!paper) continue;
      const sources = loadSources(paper.meta.sources, root);
      for (const q of extractQuotes(paper.body)) {
        const s = sources.find((x) => x.n === q.src);
        if (!s) continue;
        out.push({ where: path.relative(root, paper.file), url: s.url, archive_url: s.archive_url, text: q.text, kind: q.kind });
      }
    }
  }
  // The same words from the same source, quoted in two places, are checked once.
  const seen = new Map();
  for (const q of out) {
    const hash = quoteHash(q.text);
    const key = `${hash} ${q.url}`;
    if (seen.has(key)) seen.get(key).where = [...new Set([seen.get(key).where, q.where].flat())];
    else seen.set(key, { ...q, hash });
  }
  return [...seen.values()];
}

/**
 * The check result for one quote, given the text of its source (or null when the source and
 * its archived copy could not be read). `via` says which copy was read.
 */
export function checkQuote(q, page, via, today) {
  const status = page === null ? 'unreachable' : isFound(q.text, page) ? 'found' : 'not_found';
  return {
    quote: q.text.length > 90 ? `${q.text.slice(0, 87)}...` : q.text,
    hash: q.hash,
    where: q.where,
    url: q.url,
    ...(via && page !== null ? { via } : {}),
    status,
    checked_at: today,
  };
}

/**
 * Compares the current quotes with data/quote-check.yml.
 * not_found: a quote that is in the content now was not found in its source. This fails.
 * unchecked: no result for these exact words and this source yet, or the source was unreachable.
 */
export function compareWithChecks(quotes, rows) {
  const byKey = new Map((rows ?? []).map((r) => [`${r.hash} ${r.url}`, r]));
  const notFound = [];
  const unchecked = [];
  for (const q of quotes) {
    const row = byKey.get(`${q.hash} ${q.url}`);
    if (!row || row.status === 'unreachable') unchecked.push(q);
    else if (row.status === 'not_found') notFound.push(q);
  }
  return { notFound, unchecked };
}

/** "N of M found", counted over the current quotes. */
export function summary(quotes, rows) {
  const byKey = new Map((rows ?? []).map((r) => [`${r.hash} ${r.url}`, r]));
  const found = quotes.filter((q) => byKey.get(`${q.hash} ${q.url}`)?.status === 'found').length;
  const dates = quotes.map((q) => byKey.get(`${q.hash} ${q.url}`)?.checked_at).filter(Boolean).sort();
  return { found, total: quotes.length, checked_at: dates.at(-1) ?? null };
}
