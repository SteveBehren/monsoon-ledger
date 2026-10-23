// Optional second opinion from Claude on new leads. Runs only when ANTHROPIC_API_KEY is set.
//
// Guard rails, because this output is published on the Radar:
//   - Claude sees only what the scanner already has: headline, outlet, date, country.
//     It is told to judge from the headline alone and not to add facts.
//   - The reply must match a fixed JSON schema. Anything else is discarded.
//   - Ids it returns must be ids it was given, and instrument ids must exist in
//     data/instruments.yml. Unknown values are dropped, not trusted.
//   - Summaries are capped in length and stripped of dashes, and shown on the site as
//     a machine summary of the headline, never as a verified claim.
//   - Any API error or refusal leaves the leads untriaged. The scan itself never fails.
import { siteRequire } from '../lib.mjs';
import { normaliseDashes } from './score.mjs';

const EVENTS = [
  'new-instrument',
  'draft-or-consultation',
  'signature-or-enactment',
  'deadline-statement',
  'enforcement-or-incident',
  'commentary',
  'not-governance',
];

const SYSTEM = `You triage news headlines for Monsoon Ledger, a public tracker of how Indonesia and other ASEAN countries govern artificial intelligence.

For each lead, decide from the headline, outlet and date alone:
- relevant: true only if the headline is about a government, regulator, legislature or regional body making, changing, delaying, announcing, consulting on or enforcing rules, guidance or institutions that govern AI, or data protection rules that shape AI governance. Product launches, company news, stock news and general AI hype are not relevant.
- event: the closest category.
- instrument: one id from the provided list if the headline clearly concerns that instrument, otherwise null.
- summary_en: one plain English sentence of at most 30 words that restates the headline. Do not add any fact, number, name or date that is not in the headline. Do not use em dashes or en dashes.
- confidence: how sure you are about "relevant".

Return every lead you were given, once, with its id unchanged.`;

const MAX_LEADS = 30;
const MAX_SUMMARY_WORDS = 30;

export async function triage(leads, instrumentIds, log = console) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || leads.length === 0) return { used: false, model: undefined, triaged: 0 };

  const Anthropic = siteRequire('@anthropic-ai/sdk').default;
  const { betaZodOutputFormat } = siteRequire('@anthropic-ai/sdk/helpers/beta/zod');
  const { z } = siteRequire('zod');

  const model = process.env.TRIAGE_MODEL || 'claude-opus-5-5';
  const batch = leads.slice(0, MAX_LEADS);
  const Result = z.object({
    leads: z.array(
      z.object({
        id: z.string(),
        relevant: z.boolean(),
        event: z.enum(EVENTS),
        instrument: z.string().nullable(),
        summary_en: z.string(),
        confidence: z.enum(['low', 'medium', 'high']),
      }),
    ),
  });

  const input = {
    instrument_ids: instrumentIds,
    leads: batch.map((l) => ({ id: l.id, headline: l.title, outlet: l.outlet ?? null, published: l.published ?? null, country: l.country })),
  };

  let message;
  try {
    const client = new Anthropic({ apiKey });
    message = await client.beta.messages.parse({
      model,
      max_tokens: 16000,
      // Server-side fallback: if the model declines, the API retries on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(Result) },
      system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(input) }],
    });
  } catch (error) {
    const status = error instanceof Anthropic.APIError ? ` (HTTP ${error.status})` : '';
    log.warn(`Claude triage skipped${status}: ${error.message}`);
    return { used: false, model, triaged: 0, error: error.message };
  }

  if (message.stop_reason === 'refusal' || !message.parsed_output) {
    log.warn(`Claude triage skipped: stop_reason ${message.stop_reason}`);
    return { used: false, model, triaged: 0, error: `stop_reason ${message.stop_reason}` };
  }

  const byId = new Map(batch.map((l) => [l.id, l]));
  const known = new Set(instrumentIds);
  let triaged = 0;
  for (const r of message.parsed_output.leads) {
    const lead = byId.get(r.id);
    if (!lead || lead.triage) continue;
    const words = normaliseDashes(r.summary_en).split(/\s+/).filter(Boolean);
    lead.triage = {
      by: message.model ?? model,
      relevant: r.relevant,
      event: r.event,
      confidence: r.confidence,
      summary_en: words.slice(0, MAX_SUMMARY_WORDS).join(' '),
    };
    if (r.instrument && known.has(r.instrument) && !lead.instrument) lead.instrument = r.instrument;
    triaged += 1;
  }
  return { used: true, model: message.model ?? model, triaged };
}
