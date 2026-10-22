import type { APIRoute, GetStaticPaths } from 'astro';
import { getEntries } from '../../lib/data';
import { ui, pick, SITE, LANGS, type Lang } from '../../lib/i18n';

export const getStaticPaths: GetStaticPaths = () => LANGS.map((lang) => ({ params: { lang } }));

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = ({ params }) => {
  const lang = params.lang as Lang;
  const t = ui[lang];
  const home = `${SITE.url}/${lang}/`;
  const items = getEntries()
    .map((e) => {
      const link = `${SITE.url}/${lang}/entries/${e.id}/`;
      return `    <item>
      <title>${esc(pick(lang, e.title_en, e.title_id))}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(`${e.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(pick(lang, e.summary_en, e.ringkasan_id))}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${home}</link>
    <description>${esc(t.tagline)}</description>
    <language>${t.htmlLang}</language>
    <atom:link href="${home}feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
