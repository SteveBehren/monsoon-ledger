// Reads the YAML files in ../data at build time. Validation has already run
// (see the build script), so this module trusts the shape of the data.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import yaml from 'js-yaml';
// @ts-ignore: plain JavaScript module shared with the validator and the share cards.
import { computePromise, summarise, oldestMissed, todayWIB, promiseKey, splitWho } from '../../../scripts/promises.mjs';
// @ts-ignore: plain JavaScript module shared with the validator and the quote checker.
import { collectQuotes, summary as quoteSummary } from '../../../scripts/quotes.mjs';
// @ts-ignore: plain JavaScript module shared with the validator.
import { loadIncidents } from '../../../scripts/frontier.mjs';

const DATA = path.resolve(process.cwd(), '..', 'data');

export type Status = 'announced' | 'draft' | 'signed' | 'in-force' | 'withdrawn';
export type Evidence = 'legal-text' | 'official-statement' | 'press-report';
export type YesNo = 'yes' | 'no' | 'unclear';
export type Enforcement = 'binding' | 'soft' | 'none' | 'unclear';
/** Computed by scripts/promises.mjs. no-deadline is for conditional and status claims. */
export type Outcome = 'missed' | 'open' | 'met' | 'no-deadline';
export type ClaimType = 'dated' | 'conditional' | 'status_claim';
export type Topic = 'incident_reporting' | 'unacceptable_uses' | 'general_purpose_models' | 'enforcement';
/** Lens v2 adds three questions. They are optional in the data and read as unclear when missing. */
export type TopicV2 = 'recipient' | 'cross_border' | 'frontier_scope';
export type LensField = Topic | TopicV2;
export type Recipient = 'named_and_operating' | 'named_not_established' | 'not_named' | 'unclear';

export const TOPICS: Topic[] = ['incident_reporting', 'unacceptable_uses', 'general_purpose_models', 'enforcement'];
export const LENS_FIELDS: LensField[] = [...TOPICS, 'recipient', 'cross_border', 'frontier_scope'];
export const STATUSES: Status[] = ['announced', 'draft', 'signed', 'in-force', 'withdrawn'];
/** The outcomes a dated promise can have, in the order the balance bar draws them. */
export const OUTCOMES: Outcome[] = ['missed', 'open', 'met'];

export interface Source {
  title: string;
  url: string;
  outlet: string;
  language: 'id' | 'en';
  archive_url?: string;
  archived_at?: string;
}

export interface Entry {
  id: string;
  date: string;
  country: string;
  instrument: string;
  status: Status;
  evidence: Evidence;
  title_en: string;
  title_id: string;
  summary_en: string;
  ringkasan_id: string;
  quote?: { original: string; en: string; source_url: string; attribution_en?: string; attribution_id?: string };
  safety_lens: {
    incident_reporting: YesNo;
    unacceptable_uses: YesNo;
    general_purpose_models: YesNo;
    enforcement: Enforcement;
    recipient?: Recipient;
    cross_border?: YesNo;
    frontier_scope?: YesNo;
  };
  safety_note_en?: string;
  safety_note_id?: string;
  /** Which cited source supports each coded lens value. Required when any value is not unclear. */
  lens_basis_en?: string;
  lens_basis_id?: string;
  lens_checked?: string;
  last_checked: string;
  eu_comparison: string;
  perbandingan_eu_id?: string;
  /** The author's own words. Optional: entries without it show no "My take" section. */
  my_take?: string;
  pendapat_id?: string;
  sources: Source[];
}

/** One row of data/deadlines.yml, in the promise format (docs/standard/v0.1/). */
export interface Deadline {
  date_said: string;
  country: string;
  who: string;
  role_en?: string;
  role_id?: string;
  instrument?: string;
  claim_type: ClaimType;
  deadline_rule?: string;
  deadline?: string;
  deadline_precision?: 'day' | 'month' | 'quarter' | 'half' | 'year';
  deadline_basis_en: string;
  deadline_basis_id: string;
  promised_en: string;
  promised_id: string;
  outcome_en: string;
  outcome_id: string;
  outcome_date?: string;
  outcome_source_url?: string;
  evidence: Evidence;
  source_url: string;
  archive_url?: string;
  archived_at?: string;
}

/** A promise with its computed state on the build day. */
export interface PromiseRow extends Deadline {
  key: string;
  outcome: Outcome;
  days_past: number | null;
  days_remaining: number | null;
  days_early_late: number | null;
}

export interface Instrument {
  id: string;
  name_en: string;
  name_id: string;
  issued?: string;
  type: string;
  status: Status;
  binding: boolean;
  note_en: string;
  note_id: string;
  source_url: string;
  archive_url?: string;
  archived_at?: string;
  issuer_en?: string;
  issuer_id?: string;
  level_en?: string;
  level_id?: string;
  /** True only when the author has read the full text of the instrument. */
  read_in_full?: boolean;
  points_en?: string[];
  points_id?: string[];
  eu_en?: string;
  eu_id?: string;
  /** Keys into REFERENCES in src/lib/references.ts. */
  refs?: string[];
}

function read<T>(file: string): T {
  return yaml.load(fs.readFileSync(file, 'utf8'), { schema: yaml.CORE_SCHEMA }) as T;
}

// Folded YAML text ends with a newline, and a few values are numbers (issued: 2022).
function tidy<T>(value: T): T {
  if (typeof value === 'string') return value.trim() as T;
  if (Array.isArray(value)) return value.map(tidy) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, tidy(v)])) as T;
  }
  return value;
}

export function getEntries(): Entry[] {
  const dir = path.join(DATA, 'entries');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yml'))
    .map((f) => tidy(read<Entry>(path.join(dir, f))))
    .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));
}

export function getDeadlines(): Deadline[] {
  return tidy(read<Deadline[]>(path.join(DATA, 'deadlines.yml')));
}

export function getInstruments(): Instrument[] {
  return read<Instrument[]>(path.join(DATA, 'instruments.yml')).map((i) => ({
    ...tidy(i),
    issued: i.issued === undefined ? undefined : String(i.issued),
  }));
}

export type BuildKind = 'feature' | 'fix' | 'content' | 'revert' | 'rollback';
export const BUILD_KINDS: BuildKind[] = ['feature', 'fix', 'content', 'revert', 'rollback'];

export interface BuildRow {
  date: string;
  kind: BuildKind;
  title_en: string;
  title_id: string;
  detail_en: string;
  detail_id: string;
  pr?: number;
  commits: string[];
}

/** data/build-log.yml, newest first: every change the author asked for. */
export function getBuildLog(): BuildRow[] {
  return tidy(read<BuildRow[]>(path.join(DATA, 'build-log.yml')));
}

/** The day the site is built, in Western Indonesian Time. Every computed outcome is as of this day. */
export const TODAY: string = todayWIB();

/**
 * The data version cited on receipts: the short hash of the last commit that changed data/.
 * Falls back to the deployed commit, which on Vercel can be a shallow clone without history.
 */
export const DATA_VERSION: string = (() => {
  try {
    const hash = execSync('git log -1 --format=%h -- data', { cwd: path.resolve(process.cwd(), '..'), stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (hash) return hash;
  } catch {
    // no git history available
  }
  return (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || 'unversioned';
})();

export interface PromiseCounts {
  total: number;
  dated: number;
  missed: number;
  open: number;
  met: number;
  conditional: number;
  status_claim: number;
}

/** Headline counts, computed by scripts/promises.mjs. Missed, open and met count dated promises only. */
export function outcomeCounts(deadlines: Deadline[]): PromiseCounts {
  return summarise(deadlines, TODAY);
}

export function withState(d: Deadline): PromiseRow {
  const c = computePromise(d, TODAY);
  return { ...d, key: promiseKey(d), outcome: c.outcome, days_past: c.days_past, days_remaining: c.days_remaining, days_early_late: c.days_early_late };
}

/** "Meutya Hafid, Minister of Communication and Digital Affairs": the name, then the role if recorded. */
export function speaker(d: Deadline, lang: 'en' | 'id'): string {
  const { name, affiliation } = splitWho(d.who);
  const role = lang === 'en' ? d.role_en : d.role_id;
  return [name, role ?? affiliation].filter(Boolean).join(', ');
}

/** Every promise with its computed state, newest first. */
export function getPromises(): PromiseRow[] {
  return getDeadlines().map(withState);
}

/** The dated promise missed for longest, for the receipt headline. */
export function getOldestMissed(): PromiseRow | undefined {
  const found = oldestMissed(getDeadlines(), TODAY);
  return found ? withState(found.row) : undefined;
}

// An entry "covers" a topic when the answer is yes, or when enforcement is binding or soft.
export function coveredTopics(entry: Entry): Topic[] {
  return TOPICS.filter((t) => {
    const v = entry.safety_lens[t];
    return t === 'enforcement' ? v === 'binding' || v === 'soft' : v === 'yes';
  });
}

// Evidence strength drives the three-bar meter shown next to every evidence label.
export const EVIDENCE_STRENGTH: Record<Evidence, number> = { 'legal-text': 3, 'official-statement': 2, 'press-report': 1 };

// How a safety lens answer is drawn: solid for yes or binding, half for soft,
// hatched for unclear (unknown is not no), empty for no or none.
export type LensTone = 'full' | 'soft' | 'unclear' | 'empty';
export function lensTone(value: YesNo | Enforcement | Recipient): LensTone {
  if (value === 'yes' || value === 'binding' || value === 'named_and_operating') return 'full';
  if (value === 'soft' || value === 'named_not_established') return 'soft';
  if (value === 'unclear') return 'unclear';
  return 'empty';
}

export function latestCheck(entries: Entry[]): string {
  return entries.reduce((max, e) => (e.last_checked > max ? e.last_checked : max), '');
}

// Monitoring layer: written by npm run scan (scripts/scan.mjs), never by hand except "status".

export type LeadStatus = 'new' | 'reviewed' | 'promoted' | 'dismissed';

export interface Lead {
  id: string;
  found: string;
  published?: string;
  title: string;
  url: string;
  outlet?: string;
  country: string;
  language: string;
  source: string;
  score: number;
  terms: string[];
  instrument?: string;
  status: LeadStatus;
  promoted_to?: string;
  triage?: {
    by: string;
    relevant: boolean;
    event: string;
    confidence: 'low' | 'medium' | 'high';
    summary_en: string;
  };
}

export interface ScanRun {
  at: string;
  mode: 'rules' | 'rules+claude';
  model?: string;
  sources_total: number;
  sources_ok: number;
  sources_failed?: string[];
  items_read: number;
  items_relevant: number;
  new_leads: number;
  triaged: number;
}

export interface WatchSource {
  id: string;
  name: string;
  kind: 'news-search' | 'page-links' | 'rss';
  country: string;
  language: string;
  edition?: string;
  query?: string;
  url?: string;
}

export function getRadar(): { updated: string | null; leads: Lead[] } {
  const radar = read<{ updated: string | null; leads: Lead[] } | null>(path.join(DATA, 'radar.yml'));
  return { updated: radar?.updated ?? null, leads: (radar?.leads ?? []).map((l) => tidy(l)) };
}

export function getScanLog(): ScanRun[] {
  return read<ScanRun[] | null>(path.join(DATA, 'scan-log.yml')) ?? [];
}

export function getWatchSources(): WatchSource[] {
  return read<WatchSource[]>(path.join(DATA, 'watch', 'sources.yml')).map((s) => tidy(s));
}

/**
 * The quote check (npm run check-quotes, data/quote-check.yml), counted over the quotes in the
 * content now: how many were found in their sources, and the day of the latest check.
 */
export function getQuoteCheck(): { found: number; total: number; checked_at: string | null } {
  const root = path.resolve(process.cwd(), '..');
  const file = path.join(DATA, 'quote-check.yml');
  const rows = fs.existsSync(file) ? read<unknown[]>(file) ?? [] : [];
  const entries = fs
    .readdirSync(path.join(DATA, 'entries'))
    .filter((f) => f.endsWith('.yml'))
    .map((f) => ({ file: `data/entries/${f}`, data: read(path.join(DATA, 'entries', f)) }));
  return quoteSummary(collectQuotes({ root, entries }), rows);
}

/** A lens value, with the v2 fields read as unclear when an entry does not have them yet. */
export function lensOf(entry: Entry, field: LensField): YesNo | Enforcement | Recipient {
  return (entry.safety_lens[field] ?? 'unclear') as YesNo | Enforcement | Recipient;
}

// Frontier incident reference: context for the ledger, never counted in it.
export interface FrontierIncident {
  id: string;
  name_en: string;
  name_id: string;
  developer: string;
  kind: 'misuse' | 'misaligned_agent_action';
  activity_start: string | null;
  activity_end: string | null;
  developer_aware: string | null;
  first_public_disclosure: string | null;
  first_seen_by: 'developer' | 'third_party' | 'outside_researcher' | 'unknown';
  notified_authority: string | null;
  notified_at: string | null;
  notice_channel_en: string;
  notice_channel_id: string;
  affected_countries: string[] | null;
  summary_en: string;
  summary_id: string;
  sources: Source[];
  evidence: Evidence;
  last_checked: string;
  /** Computed by scripts/frontier.mjs. */
  days_access_to_notice: number | null;
  days_awareness_to_notice: number | null;
  days_notice_to_public: number | null;
}

/** Every incident with its computed day counts, newest first by public disclosure. */
export function getIncidents(): FrontierIncident[] {
  return tidy(loadIncidents(path.resolve(process.cwd(), '..')) as FrontierIncident[]);
}

export interface ReadingItem {
  id: string;
  title: string;
  authors: string;
  year: number;
  kind: 'report' | 'paper' | 'preprint' | 'guidance' | 'law';
  url: string;
  status: 'planned' | 'reading' | 'read';
  date_finished?: string;
  my_notes_en?: string;
  my_notes_id?: string;
  used_in?: string[];
}

/** data/reading.yml: the author's reading list, in file order. */
export function getReading(): ReadingItem[] {
  return tidy(read<ReadingItem[]>(path.join(DATA, 'reading.yml')) ?? []);
}
