// Build-time inputs for the ontology console: lane placement (semantic layer), dated events
// (kinetic layer) and attention signals (dynamic layer). Everything here is read from the
// ontology graph and the data files as they stand on the build day. Nothing is forecast, and
// promise states come only from getPromises(), the one place outcomes are computed.
import { getPromises, getScanLog, getRadar, TODAY, LENS_FIELDS, type PromiseRow } from './data';
import type { OntologyNode, OntologyLink, ObjectType } from './ontology';

export type LaneKey = 'radar' | 'actors' | 'promises' | 'instruments' | 'records' | 'sources';
export const LANES: LaneKey[] = ['radar', 'actors', 'promises', 'instruments', 'records', 'sources'];

/** Which lane, and which group inside it, an object sits in. Analysis papers are records, not evidence. */
export function placeOf(n: OntologyNode): { lane: LaneKey; group: string } {
  const map: Record<ObjectType, [LaneKey, string]> = {
    lead: ['radar', 'lead'],
    institution: ['actors', 'institution'],
    person: ['actors', 'person'],
    promise: ['promises', 'promise'],
    instrument: ['instruments', 'instrument'],
    entry: ['records', 'entry'],
    document: ['sources', 'document'],
    outlet: ['sources', 'outlet'],
    reference: ['sources', 'reference'],
  };
  if (n.type === 'document' && n.props.kind === 'analysis') return { lane: 'records', group: 'analysis' };
  const [lane, group] = map[n.type];
  return { lane, group };
}

const STAGE = ['announced', 'draft', 'signed', 'in-force', 'withdrawn'];
const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));

/** A stable order inside each group, so new data slots in without reshuffling the rest. */
export function sortKey(n: OntologyNode): string {
  const p = n.props;
  switch (n.type) {
    case 'instrument':
      return `${STAGE.indexOf(str(p.status))}|${str(p.issued) || '9999'}|${n.id}`;
    case 'promise':
      return `${invert(str(p.date_said))}|${n.id}`;
    case 'entry':
      return `${invert(str(p.date))}|${n.id}`;
    case 'lead':
      return `${invert(str(p.found))}|${n.id}`;
    case 'document':
      return n.props.kind === 'analysis' ? `${invert(str(p.published))}|${n.id}` : `${String(999 - n.degree).padStart(3, '0')}|${n.label.en}`;
    default:
      return `${String(999 - n.degree).padStart(3, '0')}|${n.label.en.toLowerCase()}`;
  }
}
// Newest first by sorting on the complement of each digit.
const invert = (date: string) => date.replace(/\d/g, (d) => String(9 - Number(d)));

/* Kinetic layer: dated events. */

export type EventKind = 'said' | 'deadline' | 'outcome' | 'issued' | 'entry' | 'analysis' | 'scan';
export type EventRow = 'promises' | 'deadlines' | 'instruments' | 'records' | 'radar';
export interface ConsoleEvent {
  kind: EventKind;
  row: EventRow;
  date: string; // as the source gives it: YYYY, YYYY-MM or YYYY-MM-DD
  start: string; // first day it covers
  end: string; // last day it covers
  node?: string;
  tone: 'missed' | 'open' | 'met' | 'neutral' | 'machine';
  count?: number;
}

const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
function span(date: string): { start: string; end: string } | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return { start: date, end: date };
  if (/^\d{4}-\d{2}$/.test(date)) {
    const [y, m] = date.split('-').map(Number);
    return { start: `${date}-01`, end: `${date}-${String(lastDay(y, m)).padStart(2, '0')}` };
  }
  if (/^\d{4}$/.test(date)) return { start: `${date}-01-01`, end: `${date}-12-31` };
  return null;
}

export function buildEvents(nodes: OntologyNode[]): ConsoleEvent[] {
  const events: ConsoleEvent[] = [];
  const push = (e: Omit<ConsoleEvent, 'start' | 'end'>) => {
    const s = span(e.date);
    if (s) events.push({ ...e, ...s });
  };
  const promises = new Map(getPromises().map((p) => [`promise:${p.key}`, p]));

  for (const n of nodes) {
    const p = n.props;
    if (n.type === 'promise') {
      const row = promises.get(n.id);
      push({ kind: 'said', row: 'promises', date: str(p.date_said), node: n.id, tone: 'neutral' });
      if (row?.deadline) {
        const tone = row.outcome === 'missed' ? 'missed' : row.outcome === 'met' ? 'met' : 'open';
        push({ kind: 'deadline', row: 'deadlines', date: row.deadline, node: n.id, tone });
      }
      if (row?.outcome_date) push({ kind: 'outcome', row: 'deadlines', date: row.outcome_date, node: n.id, tone: row.outcome === 'met' ? 'met' : 'missed' });
    } else if (n.type === 'instrument' && p.issued) {
      push({ kind: 'issued', row: 'instruments', date: str(p.issued), node: n.id, tone: 'neutral' });
    } else if (n.type === 'entry' && p.date) {
      push({ kind: 'entry', row: 'records', date: str(p.date), node: n.id, tone: 'neutral' });
    } else if (n.type === 'document' && p.kind === 'analysis' && p.published) {
      push({ kind: 'analysis', row: 'records', date: str(p.published), node: n.id, tone: 'neutral' });
    }
  }
  for (const s of getScanLog()) {
    push({ kind: 'scan', row: 'radar', date: s.at.slice(0, 10), tone: 'machine', count: s.new_leads });
  }
  return events.sort((a, b) => (a.start === b.start ? a.kind.localeCompare(b.kind) : b.start.localeCompare(a.start)));
}

/* Dynamic layer: what needs attention, as of the build day. */

export interface Signals {
  today: string;
  overdue: PromiseRow[];
  ahead: PromiseRow[];
  undated: PromiseRow[];
  notInForce: { node: OntologyNode; awaits: string[] }[];
  provisional: OntologyNode[];
  unread: OntologyNode[];
  lensGaps: { node: OntologyNode; unclear: number }[];
  singleSource: OntologyNode[];
  radar: { total: number; fresh: number; linked: number; lastScan: string | null; byInstrument: { node: OntologyNode; count: number }[] };
}

export function buildSignals(nodes: OntologyNode[], links: OntologyLink[]): Signals {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const promises = getPromises();
  const daysLate = (p: PromiseRow) => p.days_past ?? p.days_early_late ?? 0;

  const instruments = nodes.filter((n) => n.type === 'instrument');
  const entries = nodes.filter((n) => n.type === 'entry');

  const lastScan = getScanLog()[0]?.at.slice(0, 10) ?? null;
  const unreviewed = getRadar().leads.filter((l) => l.status === 'new');
  const leadNodes = nodes.filter((n) => n.type === 'lead');
  const perInstrument = new Map<string, number>();
  for (const l of links) if (l.rel === 'may_concern' && byId.get(l.from)?.props.status === 'new') perInstrument.set(l.to, (perInstrument.get(l.to) ?? 0) + 1);

  return {
    today: TODAY,
    overdue: promises.filter((p) => p.claim_type === 'dated' && p.outcome === 'missed').sort((a, b) => daysLate(b) - daysLate(a)),
    ahead: promises.filter((p) => p.outcome === 'open').sort((a, b) => (a.days_remaining ?? 0) - (b.days_remaining ?? 0)),
    undated: promises.filter((p) => p.outcome === 'no-deadline'),
    notInForce: instruments
      .filter((n) => n.props.binding === true && n.props.status !== 'in-force' && n.props.status !== 'withdrawn')
      .map((node) => ({
        node,
        awaits: links.filter((l) => l.from === node.id && l.rel === 'awaits_signature_of').map((l) => l.to),
      })),
    provisional: entries.filter((n) => n.props.evidence === 'press-report'),
    unread: instruments.filter((n) => n.props.read_in_full !== true),
    lensGaps: entries
      .map((node) => ({ node, unclear: LENS_FIELDS.filter((f) => (node.props[`lens_${f}`] ?? 'unclear') === 'unclear').length }))
      .filter((x) => x.unclear > 0)
      .sort((a, b) => b.unclear - a.unclear),
    singleSource: entries.filter((n) => links.filter((l) => l.from === n.id && l.rel === 'cites').length === 1),
    radar: {
      total: unreviewed.length,
      fresh: lastScan ? unreviewed.filter((l) => l.found >= lastScan).length : 0,
      linked: leadNodes.filter((n) => n.props.status === 'new').length,
      lastScan,
      byInstrument: [...perInstrument.entries()]
        .map(([id, count]) => ({ node: byId.get(id)!, count }))
        .filter((x) => x.node)
        .sort((a, b) => b.count - a.count),
    },
  };
}

export const LENS_COUNT = LENS_FIELDS.length;
