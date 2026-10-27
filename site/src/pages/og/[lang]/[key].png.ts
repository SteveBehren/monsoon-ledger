// Link preview cards, rendered at build time by scripts/make-share-images.mjs:
//   /og/<lang>/site.png         the site card
//   /og/<lang>/<promise>.png    one card per receipt, with its outcome and day count as of the build day
//   /og/<lang>/analysis-<id>.png one card per analysis paper, with the day its facts were checked
import path from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import { Resvg } from '@resvg/resvg-js';
// @ts-ignore: plain JavaScript module shared with the icon script.
import { siteCard, receiptCard, paperCard, renderPng } from '../../../../../scripts/make-share-images.mjs';
import { getPromises, speaker, TODAY, type PromiseRow } from '../../../lib/data';
import { getPaperIds, getPaperMeta, type PaperMeta } from '../../../lib/analysis';
import { ui, pick, fmtDate, LANGS, type Lang } from '../../../lib/i18n';

const fontDir = path.resolve(process.cwd(), '..', 'scripts', 'fonts');

export const getStaticPaths: GetStaticPaths = () =>
  LANGS.flatMap((lang) => [
    { params: { lang, key: 'site' }, props: { p: null, paper: null } },
    ...getPromises().map((p) => ({ params: { lang, key: p.key }, props: { p, paper: null } })),
    ...getPaperIds()
      .filter((id) => getPaperMeta(id, lang))
      .map((id) => ({ params: { lang, key: `analysis-${id}` }, props: { p: null, paper: getPaperMeta(id, lang) } })),
  ]);

function paperWords(m: PaperMeta, lang: Lang) {
  const en = lang === 'en';
  return {
    kicker: `${en ? 'Analysis' : 'Analisis'} ${String(m.number).padStart(2, '0')}`,
    title: m.title,
    subtitle: m.subtitle,
    byline: `${m.author} · ${fmtDate(lang, String(m.published))}`,
    asOf: `${en ? 'Facts as of' : 'Fakta per'} ${fmtDate(lang, String(m.facts_as_of))}`,
    site: 'monsoonledger.vercel.app',
  };
}

function receiptWords(p: PromiseRow, lang: Lang) {
  const t = ui[lang];
  const en = lang === 'en';
  const count =
    p.outcome === 'missed' && p.days_past !== null
      ? en ? `${p.days_past} days past the deadline` : `${p.days_past} hari lewat tenggat`
      : p.outcome === 'missed' && p.days_early_late !== null
        ? en ? `Kept ${p.days_early_late} days late` : `Ditepati ${p.days_early_late} hari terlambat`
        : p.outcome === 'open' && p.days_remaining !== null
          ? en ? `${p.days_remaining} days left, due ${fmtDate(lang, p.deadline!)}` : `${p.days_remaining} hari lagi, tenggat ${fmtDate(lang, p.deadline!)}`
          : p.outcome === 'met' && p.outcome_date
            ? en ? `Kept on ${fmtDate(lang, p.outcome_date)}` : `Ditepati ${fmtDate(lang, p.outcome_date)}`
            : en ? 'Never counted as missed' : 'Tidak dihitung terlewat';
  return {
    kicker: en ? 'Promise receipt' : 'Bukti janji',
    promised: `${en ? 'Promised' : 'Dijanjikan'}: ${pick(lang, p.promised_en, p.promised_id)}`,
    said: en ? `Said ${fmtDate(lang, p.date_said)} by ${speaker(p, lang)}.` : `Diucapkan ${fmtDate(lang, p.date_said)} oleh ${speaker(p, lang)}.`,
    outcome: p.outcome,
    stamp: t.outcome[p.outcome],
    count,
    asOf: `${en ? 'As of' : 'Per'} ${fmtDate(lang, TODAY)}`,
    site: 'monsoonledger.vercel.app',
  };
}

export const GET: APIRoute = ({ params, props }) => {
  const lang = params.lang as Lang;
  const { p, paper } = props as { p: PromiseRow | null; paper: PaperMeta | null };
  const svg = paper
    ? paperCard(paperWords(paper, lang))
    : p
    ? receiptCard(receiptWords(p, lang))
    : siteCard(
        lang === 'en'
          ? { kicker: 'An independent AI governance tracker', tagline: ui.en.tagline, foot: 'English and Bahasa Indonesia · Sourced · Open data' }
          : { kicker: 'Pelacak independen tata kelola AI', tagline: ui.id.tagline, foot: 'Bahasa Indonesia dan Inggris · Bersumber · Data terbuka' },
      );
  const png = renderPng(svg, { Resvg, fontDir });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
