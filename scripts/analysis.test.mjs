// npm test: analysis papers, citations and the quote rules (scripts/analysis.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  splitFrontMatter,
  citationGroups,
  wordCount,
  extractQuotes,
  unmarkedQuotes,
  checkPaper,
  checkSources,
  generatedCitations,
  paperIds,
  loadPaper,
} from './analysis.mjs';

const meta = {
  id: 'p',
  lang: 'en',
  title: 'T',
  subtitle: 'S',
  author: 'A',
  published: '2026-10-27',
  facts_as_of: '2026-10-26',
  version: '1.0',
  sources: 'data/analysis/p.sources.yml',
  summary: 'Sum',
};
const sources = [
  { n: 1, key: 'a', title: 'A', url: 'https://a.example/1', accessed: '2026-10-26' },
  { n: 2, key: 'b', title: 'B', url: 'https://a.example/2', accessed: '2026-10-26' },
];
const check = (body, over = {}, opts = {}) => checkPaper({ meta: { ...meta, ...over }, body }, sources, { lang: 'en', id: 'p', ...opts });

test('front matter is split from the body and dates stay strings', () => {
  const { data, body } = splitFrontMatter('---\nid: p\npublished: 2026-10-27\n---\n\n## Hi\n');
  assert.equal(data.id, 'p');
  assert.equal(data.published, '2026-10-27');
  assert.equal(body, '\n## Hi\n');
});

test('citation groups are found, but not markdown links or html comments', () => {
  const groups = citationGroups('One [1]. Two [1, 2]. A [link](https://x.example). <!-- [9] -->');
  assert.deepEqual(groups.map((g) => g.nums), [[1], [1, 2]]);
});

test('word counts ignore ellipses and punctuation', () => {
  assert.equal(wordCount('... persoalan terkait keterbatasan anggaran.'), 4);
  assert.equal(wordCount('a, b; c'), 3);
});

test('inline, block and statute quotes are extracted with their source and language', () => {
  const body = `x <q data-src="1">short words</q> y
<blockquote data-src="2">
<p lang="id">Kita kan tidak ada.</p>
<p class="tr">Translation.</p>
</blockquote>
<blockquote class="statute" data-src="1"><p lang="id">Pasal panjang.</p></blockquote>`;
  assert.deepEqual(extractQuotes(body), [
    { kind: 'inline', src: 1, text: 'short words', lang: null },
    { kind: 'block', src: 2, text: 'Kita kan tidak ada.', lang: 'id' },
    { kind: 'statute', src: 1, text: 'Pasal panjang.', lang: 'id' },
  ]);
});

test('a clean paper passes and reports which sources it cites', () => {
  const { problems, cited } = check('Claim [1]. Other [2].');
  assert.deepEqual(problems, []);
  assert.deepEqual([...cited].sort(), [1, 2]);
});

test('a citation to a missing source fails', () => {
  assert.match(check('Claim [3].').problems.join('\n'), /points to source 3/);
});

test('quotes of 15 words or more fail, statute text is exempt', () => {
  const long = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen';
  assert.match(check(`<q data-src="1">${long}</q> [1]`).problems.join('\n'), /has 15 words/);
  assert.deepEqual(check(`<blockquote class="statute" data-src="1"><p>${long}</p></blockquote> [1] [2]`).problems, []);
});

test('two different quotes from one source fail, the same quote twice does not', () => {
  assert.match(check('<q data-src="1">first</q> <q data-src="1">second</q> [1] [2]').problems.join('\n'), /quoted 2 times/);
  assert.deepEqual(check('<q data-src="1">same</q> <q data-src="1">same</q> [1] [2]').problems, []);
});

test('unmarked direct quotes of six words or more are caught', () => {
  assert.deepEqual(unmarkedQuotes('He said "this is a quote of seven words" today.'), ['this is a quote of seven words']);
  assert.deepEqual(unmarkedQuotes('the "public mailbox" problem'), []);
  assert.match(check('He said "this is a quote of seven words" [1] [2].').problems.join('\n'), /unmarked direct quote/);
});

test('front matter must be complete, match the file and use real dates', () => {
  const problems = check('[1] [2]', { title: '', id: 'other', published: '2026-02-30' }).problems.join('\n');
  assert.match(problems, /missing "title"/);
  assert.match(problems, /must equal the file name/);
  assert.match(problems, /"published" must be a real/);
});

test('a generated promise table cites sources whose url is a promise source', () => {
  const cited = generatedCitations('x <div data-table="promises"></div>', sources, ['https://a.example/2']);
  assert.deepEqual([...cited], [2]);
  assert.deepEqual([...generatedCitations('no table', sources, ['https://a.example/2'])], []);
  assert.deepEqual(check('[1] <div data-table="promises"></div>', {}, { promiseUrls: ['https://a.example/2'] }).problems, []);
});

test('sources must be numbered in order, https, unique and complete', () => {
  assert.deepEqual(checkSources(sources), []);
  const bad = [
    { n: 1, key: 'a', title: 'A', url: 'http://a.example/1', accessed: '2026-10-26' },
    { n: 3, key: 'a', title: 'B', url: 'http://a.example/1', accessed: '2026-13-01' },
  ];
  const problems = checkSources(bad).join('\n');
  assert.match(problems, /expected 2/);
  assert.match(problems, /must be https/);
  assert.match(problems, /repeats key "a"/);
  assert.match(problems, /repeats the url of source 1/);
  assert.match(problems, /"accessed" must be a real date/);
});

test('the published paper loads in both languages and the Bahasa text is marked partial', () => {
  assert.ok(paperIds().includes('nobody-to-call'));
  const en = loadPaper('nobody-to-call', 'en');
  const id = loadPaper('nobody-to-call', 'id');
  assert.equal(en.meta.lang, 'en');
  assert.equal(id.meta.lang, 'id');
  assert.equal(id.meta.partial, true);
  assert.equal(en.meta.facts_as_of, id.meta.facts_as_of);
});
