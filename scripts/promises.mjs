// Promises: deadline derivation and outcome computation for data/deadlines.yml.
//
// This is the one place where a promise's outcome is decided. The validator, the ontology, the
// site (counts, stamps, charts, receipts, feeds) and the share cards all call these functions,
// so a number on one page can never disagree with another. The rules are written out in
// docs/standard/v0.1/README.md. Pure functions only, no file or network access.

export const CLAIM_TYPES = ['dated', 'conditional', 'status_claim'];
export const PRECISIONS = ['day', 'month', 'quarter', 'half', 'year'];
/** Computed outcomes. "no-deadline" is for conditional and status claims that have no outcome yet. */
export const OUTCOMES = ['missed', 'open', 'met', 'no-deadline'];
/** Deadlines are counted in Western Indonesian Time, where the promises are made. */
export const TIME_ZONE = 'Asia/Jakarta';

const DAY = 86_400_000;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export const slug = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

/** "Edwin Hidayat Abdullah, Komdigi" becomes { name, affiliation }. */
export function splitWho(who) {
  const i = String(who).indexOf(',');
  return i < 0 ? { name: who.trim(), affiliation: '' } : { name: who.slice(0, i).trim(), affiliation: who.slice(i + 1).trim() };
}

/** The stable key of a promise: the date it was said and the speaker. Used in urls and ids. */
export const promiseKey = (d) => `${d.date_said}-${slug(splitWho(d.who).name)}`;
/** The ontology object id, for example promise:2025-01-13-meutya-hafid. */
export const promiseId = (d) => `promise:${promiseKey(d)}`;
/** The anchor of a promise's row on the Promise vs Reality page. */
export const promiseAnchor = (d) => `d-${promiseKey(d)}`;

const utc = (y, m, d) => Date.UTC(y, m - 1, d);

function parts(date) {
  const m = ISO.exec(String(date));
  if (!m) throw new Error(`not a YYYY-MM-DD date: ${date}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export const toTime = (date) => utc(...parts(date));
export const fromTime = (time) => new Date(time).toISOString().slice(0, 10);
export const isRealDate = (date) => ISO.test(String(date)) && fromTime(toTime(date)) === String(date);
/** Whole days from a to b. Positive when b is later. */
export const daysBetween = (a, b) => Math.round((toTime(b) - toTime(a)) / DAY);

export const lastDayOfMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * Calendar months from a date. The day is kept, and clamped to the last day of a shorter
 * month: one month from 31 January is 28 February, or 29 February in a leap year.
 */
export function addMonths(date, months) {
  const [y, m, d] = parts(date);
  const index = y * 12 + (m - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return fromTime(utc(year, month, Math.min(d, lastDayOfMonth(year, month))));
}

/**
 * Turns a deadline rule into a date and a precision. Rules, as written in deadlines.yml:
 *   within 3 months   N calendar months after date_said (precision day)
 *   within 10 days    N days after date_said (precision day)
 *   end 2025-06       last day of that month (precision month)
 *   end 2026-Q2       last day of that quarter (precision quarter)
 *   end 2026-H1       last day of that half year (precision half)
 *   end 2026          last day of that year (precision year)
 *   on 2025-04-13     that exact day (precision day)
 */
export function deriveDeadline(rule, dateSaid) {
  const r = String(rule).trim();
  let m;
  if ((m = /^within (\d+) months?$/.exec(r))) return { deadline: addMonths(dateSaid, Number(m[1])), precision: 'day' };
  if ((m = /^within (\d+) days?$/.exec(r))) return { deadline: fromTime(toTime(dateSaid) + Number(m[1]) * DAY), precision: 'day' };
  if ((m = /^on (\d{4}-\d{2}-\d{2})$/.exec(r)) && isRealDate(m[1])) return { deadline: m[1], precision: 'day' };
  if ((m = /^end (\d{4})-(\d{2})$/.exec(r))) {
    const [y, mo] = [Number(m[1]), Number(m[2])];
    if (mo >= 1 && mo <= 12) return { deadline: fromTime(utc(y, mo, lastDayOfMonth(y, mo))), precision: 'month' };
  }
  if ((m = /^end (\d{4})-Q([1-4])$/.exec(r))) {
    const [y, q] = [Number(m[1]), Number(m[2])];
    return { deadline: fromTime(utc(y, q * 3, lastDayOfMonth(y, q * 3))), precision: 'quarter' };
  }
  if ((m = /^end (\d{4})-H([12])$/.exec(r))) {
    const [y, h] = [Number(m[1]), Number(m[2])];
    return { deadline: fromTime(utc(y, h * 6, lastDayOfMonth(y, h * 6))), precision: 'half' };
  }
  if ((m = /^end (\d{4})$/.exec(r))) return { deadline: `${m[1]}-12-31`, precision: 'year' };
  throw new Error(`unknown deadline rule "${rule}"`);
}

/** Today's date in Western Indonesian Time, as YYYY-MM-DD. */
export function todayWIB(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/**
 * The computed state of one promise on a given day (YYYY-MM-DD, WIB).
 *   met      outcome_date on or before the deadline (or, with no deadline, an outcome_date at all)
 *   missed   the deadline has passed with no outcome_date, or the outcome came after the deadline
 *   open     a dated promise whose deadline is today or later, with no outcome yet
 *   no-deadline  a conditional or status claim with no outcome yet; never counted as missed
 * The deadline day itself still counts as open.
 */
export function computePromise(row, today) {
  const type = row.claim_type;
  const deadline = type === 'dated' ? row.deadline : null;
  const done = row.outcome_date ?? null;
  const out = { claim_type: type, deadline, outcome: 'no-deadline', days_past: null, days_remaining: null, days_early_late: null };

  if (!deadline) {
    if (done && type === 'conditional') out.outcome = 'met';
    return out;
  }
  if (done) {
    // Negative: kept early. Zero: kept on the day. Positive: kept late, which is a miss.
    out.days_early_late = daysBetween(deadline, done);
    out.outcome = out.days_early_late <= 0 ? 'met' : 'missed';
    return out;
  }
  const delta = daysBetween(deadline, today);
  if (delta > 0) {
    out.outcome = 'missed';
    out.days_past = delta;
  } else {
    out.outcome = 'open';
    out.days_remaining = Math.abs(delta);
  }
  return out;
}

/** Headline counts. Missed, open and met are counted among dated promises only. */
export function summarise(rows, today) {
  const s = { total: rows.length, dated: 0, missed: 0, open: 0, met: 0, conditional: 0, status_claim: 0 };
  for (const row of rows) {
    const c = computePromise(row, today);
    if (row.claim_type === 'dated') {
      s.dated += 1;
      s[c.outcome] += 1;
    } else {
      s[row.claim_type] += 1;
    }
  }
  return s;
}

/** The dated promise that has been missed for longest, or undefined. */
export function oldestMissed(rows, today) {
  return rows
    .map((row) => ({ row, c: computePromise(row, today) }))
    .filter(({ c }) => c.outcome === 'missed' && c.days_past !== null)
    .sort((a, b) => b.c.days_past - a.c.days_past)[0];
}
