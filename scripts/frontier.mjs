// The frontier incident reference (data/frontier-incidents.yml): computed day counts, and the
// tokens that let analysis papers read their numbers from the data instead of typing them.
// Shared by the validator, the site and the tests (scripts/frontier.test.mjs).
//
// Computed, never typed:
//   days_access_to_notice     activity_start to notified_at
//   days_awareness_to_notice  developer_aware to notified_at
//   days_notice_to_public     notified_at to first_public_disclosure
// Each is null when either date is null.
//
// In a paper, {{frontier:<incident id>:<field>}} is replaced by the computed number at build
// time. An unknown incident, an unknown field or a null value fails the build.
import path from 'node:path';
import { daysBetween } from './promises.mjs';
import { readYaml, ROOT } from './lib.mjs';

export const COMPUTED = ['days_access_to_notice', 'days_awareness_to_notice', 'days_notice_to_public'];
export const TOKEN = /\{\{frontier:([a-z0-9-]+):([a-z_]+)\}\}/g;

const span = (from, to) => (from && to ? daysBetween(String(from), String(to)) : null);

/** One incident with its day counts. */
export function computeIncident(row) {
  return {
    ...row,
    days_access_to_notice: span(row.activity_start, row.notified_at),
    days_awareness_to_notice: span(row.developer_aware, row.notified_at),
    days_notice_to_public: span(row.notified_at, row.first_public_disclosure),
  };
}

/** Every incident with its day counts, newest first by first public disclosure. */
export function computeAll(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map(computeIncident)
    .sort((a, b) => String(b.first_public_disclosure ?? '').localeCompare(String(a.first_public_disclosure ?? '')));
}

export function loadIncidents(root = ROOT) {
  return computeAll(readYaml(path.join(root, 'data', 'frontier-incidents.yml')) ?? []);
}

/** Problems the schema cannot express: order of dates, and no typed day counts. */
export function checkIncidents(rows) {
  const problems = [];
  const ids = new Set();
  (Array.isArray(rows) ? rows : []).forEach((r, i) => {
    const where = `row ${i + 1} (${r?.id})`;
    if (ids.has(r?.id)) problems.push(`${where}: duplicate id`);
    ids.add(r?.id);
    for (const f of COMPUTED) if (r && f in r) problems.push(`${where}: "${f}" is computed by scripts/frontier.mjs, do not type it`);
    const order = [
      ['activity_start', 'activity_end'],
      ['activity_start', 'notified_at'],
      ['developer_aware', 'notified_at'],
      ['activity_start', 'first_public_disclosure'],
    ];
    for (const [a, b] of order) if (r?.[a] && r?.[b] && String(r[a]) > String(r[b])) problems.push(`${where}: ${a} is after ${b}`);
    if (r?.notified_at && !r?.notified_authority) problems.push(`${where}: notified_at needs notified_authority`);
  });
  return problems;
}

/** Replaces frontier tokens with computed numbers. Throws on anything it cannot resolve. */
export function resolveTokens(text, incidents) {
  return String(text).replace(TOKEN, (token, id, field) => {
    const row = incidents.find((r) => r.id === id);
    if (!row) throw new Error(`${token}: no incident "${id}" in data/frontier-incidents.yml`);
    if (!COMPUTED.includes(field)) throw new Error(`${token}: "${field}" is not a computed field`);
    if (row[field] === null || row[field] === undefined) throw new Error(`${token}: ${id} has no value for ${field}`);
    return String(row[field]);
  });
}

/** Every token in a text, for the validator. */
export const tokensIn = (text) => [...String(text).matchAll(TOKEN)].map((m) => ({ token: m[0], id: m[1], field: m[2] }));
