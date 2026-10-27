import type { APIRoute } from 'astro';
import { getEntries, getPromises } from '../lib/data';
import { getPaperIds, getPaperMeta, changesTagged } from '../lib/analysis';
import { SITE, LANGS } from '../lib/i18n';

export const GET: APIRoute = () => {
  const entries = getEntries();
  const newest = entries[0]?.last_checked;
  const paths: { path: string; lastmod?: string }[] = [
    { path: '' },
    { path: 'entries/', lastmod: newest },
    { path: 'ledger/' },
    { path: 'instruments/' },
    { path: 'analysis/' },
    ...getPaperIds().map((id) => {
      const m = getPaperMeta(id, 'en')!;
      const tag = `analysis-${String(m.number).padStart(2, '0')}`;
      const lastmod = changesTagged(tag).reduce((max, c) => (c.date > max ? c.date : max), String(m.published));
      return { path: `analysis/${id}/`, lastmod };
    }),
    { path: 'safety/' },
    { path: 'incidents/' },
    { path: 'reading/' },
    { path: 'ontology/' },
    { path: 'radar/' },
    { path: 'method/' },
    { path: 'method/system/' },
    { path: 'about/' },
    { path: 'method/standard/' },
    ...entries.map((e) => ({ path: `entries/${e.id}/`, lastmod: e.last_checked })),
    ...getPromises().map((p) => ({ path: `promises/${p.key}/` })),
  ];

  const urls = paths
    .flatMap(({ path, lastmod }) =>
      LANGS.map((lang) => {
        const alternates = LANGS.map(
          (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE.url}/${l}/${path}" />`,
        ).join('\n');
        return `  <url>
    <loc>${SITE.url}/${lang}/${path}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
${alternates}
  </url>`;
      }),
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
