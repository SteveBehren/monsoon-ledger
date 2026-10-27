// npm test: the safety lens rules (scripts/lens.mjs) and the schema additions of lens v2.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkLens, LENS_FIELDS, LENS_VALUES } from './lens.mjs';
import { readYaml, siteRequire, ROOT } from './lib.mjs';
import path from 'node:path';

const base = {
  evidence: 'official-statement',
  safety_lens: {
    incident_reporting: 'unclear',
    unacceptable_uses: 'unclear',
    general_purpose_models: 'unclear',
    enforcement: 'unclear',
    recipient: 'unclear',
    cross_border: 'unclear',
    frontier_scope: 'unclear',
  },
  lens_checked: '2026-10-26',
};
const withLens = (lens, over = {}) => ({ ...base, ...over, safety_lens: { ...base.safety_lens, ...lens } });

test('an all-unclear lens needs no basis and raises nothing', () => {
  assert.deepEqual(checkLens(base, {}), { problems: [], warnings: [] });
});

test('a coded value needs a basis sentence in both languages', () => {
  const { problems } = checkLens(withLens({ incident_reporting: 'yes', recipient: 'named_not_established' }), {});
  assert.match(problems.join('\n'), /required because incident_reporting, recipient are not unclear/);
  const ok = checkLens(withLens({ incident_reporting: 'yes' }, { lens_basis_en: 'Because.', lens_basis_id: 'Karena.' }), {});
  assert.deepEqual(ok.problems, []);
  assert.match(checkLens(withLens({}, { lens_basis_en: 'Only English.' }), {}).problems.join('\n'), /go together/);
});

test('no, none and not_named cannot come from a press report unless the text was read in full', () => {
  const entry = withLens({ incident_reporting: 'no', recipient: 'not_named' }, { evidence: 'press-report', lens_basis_en: 'x', lens_basis_id: 'y' });
  assert.match(checkLens(entry, { read_in_full: false }).problems.join('\n'), /absence in a summary is unclear, not no/);
  assert.deepEqual(checkLens(entry, { read_in_full: true }).problems, []);
  assert.deepEqual(checkLens({ ...entry, evidence: 'legal-text' }, {}).problems, []);
});

test('missing lens v2 fields and lens_checked are warnings, not failures', () => {
  const old = { evidence: 'official-statement', safety_lens: { incident_reporting: 'unclear', unacceptable_uses: 'unclear', general_purpose_models: 'unclear', enforcement: 'unclear' } };
  const { problems, warnings } = checkLens(old, {});
  assert.deepEqual(problems, []);
  assert.equal(warnings.length, 4);
});

test('the entry schema accepts lens v2 values and rejects others', () => {
  const Ajv = siteRequire('ajv/dist/2020').default;
  const schema = readYaml(path.join(ROOT, 'data', 'schema.json'));
  const lens = schema.properties.safety_lens.properties;
  for (const f of LENS_FIELDS) {
    const allowed = lens[f].enum ?? schema.$defs.yesNoUnclear.enum;
    assert.deepEqual(allowed, LENS_VALUES[f], `${f} values match scripts/lens.mjs`);
  }
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  const entry = readYaml(path.join(ROOT, 'data', 'entries', '2026-07-16-id-gr-33-2026-breach-clock.yml'));
  assert.equal(validate(entry), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...entry, safety_lens: { ...entry.safety_lens, recipient: 'maybe' } }), false);
  const noTake = { ...entry };
  delete noTake.my_take;
  assert.equal(validate(noTake), true, 'my_take is optional');
});
