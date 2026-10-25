// Link preview cards, rendered at build time by scripts/make-share-images.mjs:
//   /og/<lang>/site.png         the site card
//   /og/<lang>/<promise>.png    one card per receipt, with its outcome and day count as of the build day
import path from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import { Resvg } from '@resvg/resvg-js';
// @ts-ignore: plain JavaScript module shared with the icon script.
import { siteCard, receiptCard, renderPng } from '../../../../../scripts/make-share-images.mjs';
import { getPromises, speaker, TODAY, type PromiseRow } from '../../../lib/data';
import { ui, pick, fmtDate, LANGS, type Lang } from '../../../lib/i18n';

const fontDir = path.resolve(process.cwd(), '..', 'scripts', 'fonts');

export const getStaticPaths: GetStaticPaths = () =>
  LANGS.flatMap((lang) => [
    { params: { lang, key: 'site' }, props: { p: null } },
    ...getPromises().map((p) => ({ params: { lang, key: p.key }, props: { p } })),
  ]);

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
  const p = (props as { p: PromiseRow | null }).p;
  const svg = p
    ? receiptCard(receiptWords(p, lang))
    : siteCard(
        lang === 'en'
          ? { kicker: 'An independent AI governance tracker', tagline: ui.en.tagline, foot: 'English and Bahasa Indonesia · Sourced · Open data' }
          : { kicker: 'Pelacak independen tata kelola AI', tagline: ui.id.tagline, foot: 'Bahasa Indonesia dan Inggris · Bersumber · Data terbuka' },
      );
  const png = renderPng(svg, { Resvg, fontDir });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
