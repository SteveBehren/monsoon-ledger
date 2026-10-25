// npm test: the ontology fusion and the checks the validator relies on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOntology, splitWho, promiseId, promiseAnchor } from './ontology.mjs';

const instruments = [
  { id: 'law-a', name_en: 'Law A', name_id: 'UU A', type: 'law', status: 'in-force', binding: true, source_url: 'https://example.org/law-a', refs: ['eu-x', 'basis'] },
  { id: 'reg-b', name_en: 'Reg B', name_id: 'PP B', type: 'government-regulation', status: 'signed', binding: true, source_url: 'https://example.org/reg-b' },
];
const entries = [
  {
    id: '2026-01-01-id-test',
    date: '2026-01-01',
    instrument: 'reg-b',
    status: 'signed',
    evidence: 'press-report',
    title_en: 'Test entry',
    title_id: 'Catatan uji',
    sources: [{ title: 'Story', url: 'https://news.example/story', outlet: 'Example News', language: 'id' }],
  },
];
const deadlines = [
  { date_said: '2026-02-02', who: 'Ani Example, Komdigi', claim_type: 'dated', deadline: '2026-03-31', promised_en: 'Soon', promised_id: 'Segera', source_url: 'https://news.example/story' },
];
const ontology = {
  institutions: [{ id: 'komdigi', name_en: 'Komdigi', name_id: 'Komdigi', country: 'ID', aliases: ['Komdigi'] }],
  references: { compared_with: ['eu-x'], ranked_under: ['basis'] },
  relations: [{ from: 'instrument:reg-b', rel: 'implements', to: 'instrument:law-a', evidence: 'press-report', source_url: 'https://example.org/reg-b' }],
};
const references = { 'eu-x': { text: 'EU X', url: 'https://eu.example/x' }, basis: { text: 'Basis law', url: 'https://example.org/basis' } };

const build = (over = {}) => buildOntology({ entries, instruments, deadlines, ontology, references, ...over });
const has = (g, from, rel, to) => g.links.some((l) => l.from === from && l.rel === rel && l.to === to);

test('splitWho keeps the name and the affiliation exactly as written', () => {
  assert.deepEqual(splitWho('Meutya Hafid, Minister'), { name: 'Meutya Hafid', affiliation: 'Minister' });
  assert.deepEqual(splitWho('Someone'), { name: 'Someone', affiliation: '' });
  assert.equal(promiseId(deadlines[0]), 'promise:2026-02-02-ani-example');
  assert.equal(promiseAnchor(deadlines[0]), 'd-2026-02-02-ani-example');
});

test('derives objects and links from the data files', () => {
  const g = build();
  assert.deepEqual(g.problems, []);
  assert.ok(has(g, 'entry:2026-01-01-id-test', 'concerns', 'instrument:reg-b'));
  assert.ok(has(g, 'entry:2026-01-01-id-test', 'cites', 'document:https://news.example/story'));
  assert.ok(has(g, 'document:https://news.example/story', 'published_by', 'outlet:example-news'));
  assert.ok(has(g, 'person:ani-example', 'made', 'promise:2026-02-02-ani-example'));
  assert.ok(has(g, 'person:ani-example', 'member_of', 'institution:komdigi'));
  assert.ok(has(g, 'instrument:law-a', 'compared_with', 'reference:eu-x'));
  assert.ok(has(g, 'instrument:law-a', 'ranked_under', 'reference:basis'));
  assert.ok(has(g, 'instrument:reg-b', 'implements', 'instrument:law-a'));
});

test('an entry and a promise citing the same url meet at one document object', () => {
  const g = build();
  const doc = g.nodes.filter((n) => n.id === 'document:https://news.example/story');
  assert.equal(doc.length, 1);
  assert.equal(doc[0].degree, 3);
});

test('rejects curated links that break the rules', () => {
  const bad = (relation) => build({ ontology: { ...ontology, relations: [relation] } }).problems;
  assert.match(bad({ from: 'instrument:reg-b', rel: 'implements', to: 'instrument:nope', evidence: 'press-report', source_url: 'https://x.org' })[0], /does not exist/);
  assert.match(bad({ from: 'instrument:reg-b', rel: 'implements', to: 'institution:komdigi', evidence: 'press-report', source_url: 'https://x.org' })[0], /cannot point to/);
  assert.match(bad({ from: 'instrument:reg-b', rel: 'cites', to: 'instrument:law-a', evidence: 'press-report', source_url: 'https://x.org' })[0], /cannot be curated/);
  assert.match(bad({ from: 'instrument:reg-b', rel: 'passed_by', to: 'institution:komdigi', evidence: 'rumour', source_url: 'https://x.org' })[0], /evidence/);
  assert.match(bad({ from: 'instrument:reg-b', rel: 'passed_by', to: 'institution:komdigi', evidence: 'press-report' })[0], /source_url/);
});

test('radar leads join only as machine hints, and dismissed leads stay out', () => {
  const leads = [
    { id: 'aaaaaaaaaa', title: 'Hint', url: 'https://n.example/1', found: '2026-03-01', status: 'new', country: 'ID', instrument: 'law-a' },
    { id: 'bbbbbbbbbb', title: 'Gone', url: 'https://n.example/2', found: '2026-03-01', status: 'dismissed', country: 'ID', instrument: 'law-a' },
  ];
  const g = build({ leads });
  const link = g.links.find((l) => l.from === 'lead:aaaaaaaaaa');
  assert.equal(link.basis, 'machine');
  assert.ok(!g.nodes.some((n) => n.id === 'lead:bbbbbbbbbb'));
});
