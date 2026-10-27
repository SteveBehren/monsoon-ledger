// Turns a paper's rendered Markdown into the page's HTML: linked citations with back-link ids,
// heading ids for the contents list, captioned tables in scrolling regions, and the split at
// generated figures and tables. Plain JavaScript so it can be unit tested
// (scripts/analysis-render.test.mjs). Used by site/src/lib/analysis.ts.
import GithubSlugger from '../site/node_modules/github-slugger/index.js';

const CITE = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const textOf = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();

/**
 * Replaces [n] and [n, m] in text (never inside tags, code or links) with linked superscripts.
 * Each link gets an id cite-n-k, the k-th citation of source n, so References can link back.
 */
export function linkCitations(html, counts) {
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
      return part.replace(CITE, (_, nums) => {
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
export function addHeadingIds(html, toc) {
  const slugger = new GithubSlugger();
  return html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, inner) => {
    const text = textOf(inner);
    const id = slugger.slug(text);
    toc.push({ id, text, level: Number(level) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
}

/**
 * A bold "Table N. ..." paragraph right before a table becomes its caption, and every table
 * scrolls sideways inside a labelled, focusable region. Header cells get scope="col".
 */
export function wrapTables(html) {
  let n = 0;
  return html.replace(/(?:<p><strong>(Table [^<]+)<\/strong><\/p>\s*)?<table>([\s\S]*?)<\/table>/g, (_, caption, inner) => {
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
export function splitSegments(html) {
  const out = [];
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
    last = m.index + m[0].length;
  }
  out.push({ kind: 'html', html: html.slice(last) });
  return out.filter((s) => s.kind !== 'html' || s.html.trim());
}
