// Relevance scoring, instrument hints, and the normalisation that keeps scanner output
// consistent with the project rules (no em or en dashes, stable ids, comparable urls).
import crypto from 'node:crypto';

const DASHES = new RegExp(`\\s*[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]\\s*`, 'g');

/** Headlines often contain em or en dashes. The project bans them, so they become " - ". */
export function normaliseDashes(text) {
  return text.replace(DASHES, ' - ');
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function compile(term, wholeWord) {
  const body = escapeRe(term.toLowerCase());
  // \b fails next to non-ASCII letters, so word edges are checked explicitly.
  return wholeWord ? new RegExp(`(^|[^\\p{L}\\p{N}])${body}($|[^\\p{L}\\p{N}])`, 'u') : new RegExp(body, 'u');
}

export function makeScorer(keywords) {
  const terms = keywords.terms.map((t) => ({ ...t, re: compile(t.term, t.whole_word) }));
  const excludes = (keywords.exclude ?? []).map((t) => compile(t, true));
  const hints = (keywords.instruments ?? []).map((h) => ({ id: h.id, res: h.any.map((a) => compile(a, false)) }));
  const threshold = keywords.threshold;

  return function score(text) {
    const hay = text.toLowerCase();
    const matched = terms.filter((t) => t.re.test(hay));
    const value = matched.reduce((sum, t) => sum + t.weight, 0);
    const excluded = excludes.some((re) => re.test(hay));
    const hint = hints.find((h) => h.res.some((re) => re.test(hay)));
    return {
      score: value,
      terms: matched.map((t) => t.term),
      keep: !excluded && value >= threshold,
      excluded,
      instrument: hint?.id,
    };
  };
}

const TRACKING = /^(utm_|fbclid$|gclid$|oc$|ref$|ref_src$)/i;

/** Lower-cases the host, drops tracking parameters, fragments and trailing slashes. */
export function normaliseUrl(raw) {
  try {
    const url = new URL(raw);
    url.hash = '';
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) url.pathname = url.pathname.replace(/\/+$/, '');
    return url.href;
  } catch {
    return raw;
  }
}

/** A short, stable id for a lead, from its normalised url. */
export function leadId(url) {
  return crypto.createHash('sha256').update(normaliseUrl(url)).digest('hex').slice(0, 10);
}

/** A second fingerprint so the same story seen through two urls is stored once. */
export function titleKey(title) {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
