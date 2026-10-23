// Parsers for the two formats the scanner reads: RSS or Atom feeds, and plain HTML pages.
// Deliberately small and dependency free. Feeds and pages are untrusted input, so the
// parsers only ever extract text and absolute http(s) links, never markup.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

export function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

/** Collapses whitespace, decodes entities and removes any markup. */
export function cleanText(raw) {
  if (!raw) return '';
  const unwrapped = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  // Decode first so that escaped markup inside a feed field is stripped too.
  return stripTags(decodeEntities(stripTags(unwrapped)))
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
}

function attr(block, tagName, attrName) {
  const m = block.match(new RegExp(`<${tagName}\\b[^>]*\\b${attrName}=["']([^"']+)["']`, 'i'));
  return m ? decodeEntities(m[1]) : '';
}

export function isoDate(value) {
  if (!value) return undefined;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

function absolute(href, base) {
  try {
    const url = new URL(href, base);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Reads RSS 2.0 <item> or Atom <entry> elements.
 * Returns [{ title, link, published, outlet, summary }].
 */
export function parseFeed(xml, base) {
  const items = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  for (const block of blocks) {
    let title = cleanText(tag(block, 'title'));
    const rawLink = cleanText(tag(block, 'link')) || attr(block, 'link', 'href');
    const link = absolute(rawLink, base);
    const outlet = cleanText(tag(block, 'source'));
    // Google News appends " - Outlet" to every headline. Keep the headline only.
    if (outlet && title.endsWith(` - ${outlet}`)) title = title.slice(0, -(outlet.length + 3)).trim();
    const published = isoDate(cleanText(tag(block, 'pubDate')) || cleanText(tag(block, 'published')) || cleanText(tag(block, 'updated')));
    const summary = cleanText(tag(block, 'description') || tag(block, 'summary'));
    if (title && link) items.push({ title, link, published, outlet: outlet || undefined, summary: summary || undefined });
  }
  return items;
}

/** Collects every <a href> with visible text from an HTML page. Returns [{ title, link }]. */
export function parseLinks(html, base) {
  const items = [];
  const seen = new Set();
  for (const m of html.matchAll(/<a\b[^>]*\bhref=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const link = absolute(decodeEntities(m[1]), base);
    const title = cleanText(m[2]);
    if (!link || title.length < 12 || seen.has(link)) continue;
    seen.add(link);
    items.push({ title, link });
  }
  return items;
}
