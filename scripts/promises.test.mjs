// npm test: deadline derivation and outcome computation (scripts/promises.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, deriveDeadline, computePromise, summarise, oldestMissed, daysBetween, todayWIB, promiseKey, promiseId, promiseAnchor } from './promises.mjs';

const dated = (deadline, extra = {}) => ({ claim_type: 'dated', deadline, ...extra });

test('calendar months keep the day and clamp to shorter months', () => {
  assert.equal(addMonths('2025-01-13', 3), '2025-04-13');
  assert.equal(addMonths('2025-01-31', 1), '2025-02-28');
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
  assert.equal(addMonths('2025-08-31', 1), '2025-09-30');
  assert.equal(addMonths('2025-11-30', 3), '2026-02-28');
  assert.equal(addMonths('2025-12-15', 1), '2026-01-15');
  assert.equal(addMonths('2024-02-29', 12), '2025-02-28');
});

test('deadline rules give the last day of the period said', () => {
  assert.deepEqual(deriveDeadline('within 3 months', '2025-01-13'), { deadline: '2025-04-13', precision: 'day' });
  assert.deepEqual(deriveDeadline('within 1 month', '2028-01-31'), { deadline: '2028-02-29', precision: 'day' });
  assert.deepEqual(deriveDeadline('within 10 days', '2025-12-25'), { deadline: '2026-01-04', precision: 'day' });
  assert.deepEqual(deriveDeadline('end 2025-06', '2025-06-17'), { deadline: '2025-06-30', precision: 'month' });
  assert.deepEqual(deriveDeadline('end 2024-02', '2024-02-01'), { deadline: '2024-02-29', precision: 'month' });
  assert.deepEqual(deriveDeadline('end 2026-Q1', '2026-01-02'), { deadline: '2026-03-31', precision: 'quarter' });
  assert.deepEqual(deriveDeadline('end 2026-H1', '2025-12-16'), { deadline: '2026-06-30', precision: 'half' });
  assert.deepEqual(deriveDeadline('end 2026-H2', '2026-01-01'), { deadline: '2026-12-31', precision: 'half' });
  assert.deepEqual(deriveDeadline('end 2026', '2026-01-26'), { deadline: '2026-12-31', precision: 'year' });
  assert.deepEqual(deriveDeadline('on 2025-04-13', '2025-01-13'), { deadline: '2025-04-13', precision: 'day' });
  assert.throws(() => deriveDeadline('soon', '2025-01-13'), /unknown deadline rule/);
  assert.throws(() => deriveDeadline('end 2025-13', '2025-01-13'), /unknown deadline rule/);
  assert.throws(() => deriveDeadline('on 2025-02-30', '2025-01-13'), /unknown deadline rule/);
});

test('a dated promise is open through its deadline day and missed the day after', () => {
  assert.deepEqual(computePromise(dated('2025-04-30'), '2025-04-29'), {
    claim_type: 'dated', deadline: '2025-04-30', outcome: 'open', days_past: null, days_remaining: 1, days_early_late: null,
  });
  const onTheDay = computePromise(dated('2025-04-30'), '2025-04-30');
  assert.equal(onTheDay.outcome, 'open');
  assert.equal(onTheDay.days_remaining, 0);
  const dayAfter = computePromise(dated('2025-04-30'), '2025-05-01');
  assert.equal(dayAfter.outcome, 'missed');
  assert.equal(dayAfter.days_past, 1);
});

test('met on the deadline day counts as met; met late counts as missed, with days late', () => {
  const onDay = computePromise(dated('2026-06-30', { outcome_date: '2026-06-30' }), '2026-10-25');
  assert.equal(onDay.outcome, 'met');
  assert.equal(onDay.days_early_late, 0);
  const early = computePromise(dated('2026-06-30', { outcome_date: '2026-06-20' }), '2026-10-25');
  assert.equal(early.outcome, 'met');
  assert.equal(early.days_early_late, -10);
  const late = computePromise(dated('2026-06-30', { outcome_date: '2026-07-02' }), '2026-10-25');
  assert.equal(late.outcome, 'missed');
  assert.equal(late.days_early_late, 2);
  assert.equal(late.days_past, null);
});

test('conditional and status claims never get a deadline and are never missed', () => {
  for (const claim_type of ['conditional', 'status_claim']) {
    const c = computePromise({ claim_type }, '2030-01-01');
    assert.equal(c.outcome, 'no-deadline');
    assert.equal(c.deadline, null);
    assert.equal(c.days_past, null);
  }
  assert.equal(computePromise({ claim_type: 'conditional', outcome_date: '2026-11-01' }, '2026-12-01').outcome, 'met');
  assert.equal(computePromise({ claim_type: 'status_claim', outcome_date: '2026-11-01' }, '2026-12-01').outcome, 'no-deadline');
});

test('day counts cross leap days and year ends', () => {
  assert.equal(daysBetween('2024-02-28', '2024-03-01'), 2);
  assert.equal(daysBetween('2025-02-28', '2025-03-01'), 1);
  assert.equal(daysBetween('2025-04-30', '2026-10-25'), 543);
  assert.equal(daysBetween('2025-12-31', '2026-01-01'), 1);
});

test('counts are taken among dated promises, with other claims counted apart', () => {
  const rows = [
    { claim_type: 'conditional' },
    { claim_type: 'status_claim' },
    dated('2026-12-31'),
    dated('2026-06-30'),
    dated('2025-09-30'),
    dated('2025-06-30'),
    dated('2025-04-30'),
  ];
  assert.deepEqual(summarise(rows, '2026-10-25'), { total: 7, dated: 5, missed: 4, open: 1, met: 0, conditional: 1, status_claim: 1 });
  const oldest = oldestMissed(rows, '2026-10-25');
  assert.equal(oldest.row.deadline, '2025-04-30');
  assert.equal(oldest.c.days_past, 543);
});

test('today is taken in Western Indonesian Time', () => {
  // 17:30 UTC on 30 April is already 1 May in Jakarta (UTC+7).
  assert.equal(todayWIB(new Date('2025-04-30T17:30:00Z')), '2025-05-01');
  assert.equal(todayWIB(new Date('2025-04-30T16:59:00Z')), '2025-04-30');
});

test('one key per promise, shared by the receipt url, the ledger anchor and the ontology', () => {
  const row = { date_said: '2025-01-13', who: 'Meutya Hafid, Minister' };
  assert.equal(promiseKey(row), '2025-01-13-meutya-hafid');
  assert.equal(promiseId(row), 'promise:2025-01-13-meutya-hafid');
  assert.equal(promiseAnchor(row), 'd-2025-01-13-meutya-hafid');
});
