// The safety lens: what each entry's instrument says about seven questions, and the rules for
// coding an answer. Shared by the validator, the site and the tests (scripts/lens.test.mjs).
//
// Definitions, the same for every field:
//   yes      a cited source states it.
//   no       a cited source states the opposite, or the full text has been read and it is absent.
//            Absence in a press summary is not "no".
//   unclear  the default, until a source settles it.
// enforcement uses binding, soft, none and unclear; recipient uses the four values below.

/** The original four questions, then the three added in lens v2. */
export const LENS_FIELDS = ['incident_reporting', 'unacceptable_uses', 'general_purpose_models', 'enforcement', 'recipient', 'cross_border', 'frontier_scope'];
export const LENS_V2_FIELDS = ['recipient', 'cross_border', 'frontier_scope'];

export const LENS_VALUES = {
  incident_reporting: ['yes', 'no', 'unclear'],
  unacceptable_uses: ['yes', 'no', 'unclear'],
  general_purpose_models: ['yes', 'no', 'unclear'],
  enforcement: ['binding', 'soft', 'none', 'unclear'],
  // Who receives incident reports: a named body that exists and works, a named body that has not
  // been set up, no body named, or not known.
  recipient: ['named_and_operating', 'named_not_established', 'not_named', 'unclear'],
  cross_border: ['yes', 'no', 'unclear'],
  frontier_scope: ['yes', 'no', 'unclear'],
};

/** Values that claim something is absent. They need a source that says so, or a full reading. */
export const ABSENCE_VALUES = new Set(['no', 'none', 'not_named']);

/**
 * Checks one entry's lens. `instrument` is its row in data/instruments.yml.
 * Returns { problems, warnings } as plain messages.
 */
export function checkLens(entry, instrument) {
  const problems = [];
  const warnings = [];
  const lens = entry?.safety_lens ?? {};
  for (const f of LENS_V2_FIELDS) if (lens[f] === undefined) warnings.push(`safety_lens.${f} is missing (lens v2); set it, or "unclear"`);
  if (!entry?.lens_checked) warnings.push('lens_checked is missing: the day the lens values were last checked against the sources');

  const coded = LENS_FIELDS.filter((f) => lens[f] !== undefined && lens[f] !== 'unclear');
  const hasEn = Boolean(entry?.lens_basis_en);
  const hasId = Boolean(entry?.lens_basis_id);
  if (coded.length && (!hasEn || !hasId)) {
    problems.push(`lens_basis_en and lens_basis_id are required because ${coded.join(', ')} ${coded.length === 1 ? 'is' : 'are'} not unclear`);
  }
  if (hasEn !== hasId) problems.push('lens_basis_en and lens_basis_id go together');

  // "No" from a press report is absence in a summary, which the definitions do not allow.
  const absent = LENS_FIELDS.filter((f) => ABSENCE_VALUES.has(lens[f]));
  if (absent.length && entry?.evidence === 'press-report' && !instrument?.read_in_full) {
    problems.push(`${absent.join(', ')} cannot be "${absent.map((f) => lens[f]).join('", "')}" from a press report: absence in a summary is unclear, not no`);
  }
  return { problems, warnings };
}
