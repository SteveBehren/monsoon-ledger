// The reading list (data/reading.yml): checks the schema cannot express, shared by the
// validator and the tests (scripts/reading.test.mjs).
import { isRealDate } from './lib.mjs';

export const READING_STATUSES = ['planned', 'reading', 'read'];

/**
 * Problems with the reading list. `known` holds the ids that used_in may point to, as
 * "analysis:<id>" and "entry:<id>". `today` is the build day, so no item finishes in the future.
 */
export function checkReading(rows, { known = new Set(), today } = {}) {
  const problems = [];
  const ids = new Set();
  const urls = new Set();
  (Array.isArray(rows) ? rows : []).forEach((r, i) => {
    const where = `row ${i + 1} (${r?.id})`;
    if (ids.has(r?.id)) problems.push(`${where}: duplicate id`);
    ids.add(r?.id);
    if (r?.url && urls.has(r.url)) problems.push(`${where}: duplicate url`);
    urls.add(r?.url);
    if (r?.status === 'read' && !(r.date_finished && r.my_notes_en && r.my_notes_id)) {
      problems.push(`${where}: an item marked read needs date_finished, my_notes_en and my_notes_id`);
    }
    if (r?.status !== 'read' && r?.date_finished) problems.push(`${where}: date_finished is only for items marked read`);
    if (r?.date_finished && !isRealDate(r.date_finished)) problems.push(`${where}: date_finished is not a real date`);
    if (r?.date_finished && today && r.date_finished > today) problems.push(`${where}: date_finished is after today`);
    if (Boolean(r?.my_notes_en) !== Boolean(r?.my_notes_id)) problems.push(`${where}: my_notes_en and my_notes_id go together`);
    for (const u of r?.used_in ?? []) if (!known.has(u)) problems.push(`${where}: used_in "${u}" does not exist`);
  });
  return problems;
}
