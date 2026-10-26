import type { APIRoute, GetStaticPaths } from 'astro';
import { getEntries, getPromises, TODAY } from '../../lib/data';
// @ts-ignore: plain JavaScript module shared with the validator.
import { toTime, fromTime } from '../../../../scripts/promises.mjs';
import { ui, pick, fmtDate, SITE, LANGS, type Lang } from '../../lib/i18n';
import { getPaperIds, getPaperMeta } from '../../lib/analysis';

export const getStaticPaths: GetStaticPaths = () => LANGS.map((lang) => ({ params: { lang } }));

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = ({ params }) => {
  const lang = params.lang as Lang;
  const t = ui[lang];
  const home = `${SITE.url}/${lang}/`;
  const entryItems = getEntries().map((e) => {
    const link = `${SITE.url}/${lang}/entries/${e.id}/`;
    return {
      date: e.date,
      xml: `    <item>
      <title>${esc(pick(lang, e.title_en, e.title_id))}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(`${e.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(pick(lang, e.summary_en, e.ringkasan_id))}</description>
    </item>`,
    };
  });

  // One item when a promise changes outcome: missed on the day after its deadline (or on the
  // day it was kept late), met on the day it was kept. Computed by scripts/promises.mjs.
  const outcomeItems = getPromises().flatMap((p) => {
    const changed =
      p.outcome === 'met' || (p.outcome === 'missed' && p.outcome_date)
        ? p.outcome_date!
        : p.outcome === 'missed' && p.deadline
          ? fromTime(toTime(p.deadline) + 86_400_000)
          : null;
    if (!changed || changed > TODAY) return [];
    const link = `${SITE.url}/${lang}/promises/${p.key}/`;
    const label = t.outcome[p.outcome];
    const promised = pick(lang, p.promised_en, p.promised_id);
    const body =
      lang === 'en'
        ? `${p.who} promised this on ${fmtDate(lang, p.date_said)}.${p.deadline ? ` The deadline was ${fmtDate(lang, p.deadline)}.` : ''} Outcome: ${label}.`
        : `${p.who} menjanjikan ini pada ${fmtDate(lang, p.date_said)}.${p.deadline ? ` Tenggatnya ${fmtDate(lang, p.deadline)}.` : ''} Hasil: ${label}.`;
    return [
      {
        date: changed,
        xml: `    <item>
      <title>${esc(`${label}: ${promised}`)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${link}#${p.outcome}</guid>
      <pubDate>${new Date(`${changed}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(body)}</description>
    </item>`,
      },
    ];
  });

  // One item per analysis paper, in the reader's language where that text exists.
  const paperItems = getPaperIds().map((id) => {
    const m = getPaperMeta(id, lang) ?? getPaperMeta(id, 'en')!;
    const link = `${SITE.url}/${getPaperMeta(id, lang) ? lang : 'en'}/analysis/${id}/`;
    const asOf = lang === 'en' ? `Facts as of ${fmtDate(lang, String(m.facts_as_of))}.` : `Fakta per ${fmtDate(lang, String(m.facts_as_of))}.`;
    return {
      date: String(m.published),
      xml: `    <item>
      <title>${esc(`${m.title}: ${m.subtitle}`)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(`${m.published}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(`${m.summary} ${asOf}`)}</description>
    </item>`,
    };
  });

  const items = [...entryItems, ...outcomeItems, ...paperItems]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((i) => i.xml)
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
