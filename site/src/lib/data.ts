// Reads the YAML files in ../data at build time. Validation has already run
// (see the build script), so this module trusts the shape of the data.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const DATA = path.resolve(process.cwd(), '..', 'data');

export type Status = 'announced' | 'draft' | 'signed' | 'in-force' | 'withdrawn';
export type Evidence = 'legal-text' | 'official-statement' | 'press-report';
export type YesNo = 'yes' | 'no' | 'unclear';
export type Enforcement = 'binding' | 'soft' | 'none' | 'unclear';
export type Outcome = 'missed' | 'open' | 'met';
export type Topic = 'incident_reporting' | 'unacceptable_uses' | 'general_purpose_models' | 'enforcement';

export const TOPICS: Topic[] = ['incident_reporting', 'unacceptable_uses', 'general_purpose_models', 'enforcement'];
export const STATUSES: Status[] = ['announced', 'draft', 'signed', 'in-force', 'withdrawn'];
export const OUTCOMES: Outcome[] = ['missed', 'open', 'met'];

export interface Source {
  title: string;
  url: string;
  outlet: string;
  language: 'id' | 'en';
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
  };
  safety_note_en?: string;
  safety_note_id?: string;
  last_checked: string;
  eu_comparison: string;
  perbandingan_eu_id?: string;
  my_take: string;
  pendapat_id?: string;
  sources: Source[];
}

export interface Deadline {
  date_said: string;
  who: string;
  promised_en: string;
  promised_id: string;
  outcome_en: string;
  outcome_id: string;
  outcome_status: Outcome;
  source_url: string;
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

export function outcomeCounts(deadlines: Deadline[]): Record<Outcome, number> {
  const counts: Record<Outcome, number> = { missed: 0, open: 0, met: 0 };
  for (const d of deadlines) counts[d.outcome_status] += 1;
  return counts;
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
export function lensTone(value: YesNo | Enforcement): LensTone {
  if (value === 'yes' || value === 'binding') return 'full';
  if (value === 'soft') return 'soft';
  if (value === 'unclear') return 'unclear';
  return 'empty';
}

export function latestCheck(entries: Entry[]): string {
  return entries.reduce((max, e) => (e.last_checked > max ? e.last_checked : max), '');
}
