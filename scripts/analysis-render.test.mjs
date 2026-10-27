// npm test: the analysis page renderer (scripts/analysis-render.mjs), used by the site loader.
import test from 'node:test';
import assert from 'node:assert/strict';
import { linkCitations, addHeadingIds, wrapTables, splitSegments } from './analysis-render.mjs';

test('citations become numbered links, each with its own back-link id', () => {
  const counts = new Map();
  const html = linkCitations('<p>One [1]. Both [1, 2].</p>', counts);
  assert.equal(html, '<p>One <sup class="cite">[<a href="#ref-1" id="cite-1-1">1</a>]</sup>. Both <sup class="cite">[<a href="#ref-1" id="cite-1-2">1</a>, <a href="#ref-2" id="cite-2-1">2</a>]</sup>.</p>');
  assert.deepEqual([...counts], [[1, 2], [2, 1]]);
});

test('brackets inside links, code and tags are left alone', () => {
  const counts = new Map();
  const html = '<p><a href="/x">[3]</a> <code>[4]</code> <span data-x="[5]">t</span></p>';
  assert.equal(linkCitations(html, counts), html);
  assert.equal(counts.size, 0);
});

test('headings get stable ids and fill the contents list', () => {
  const toc = [];
  const html = addHeadingIds('<h2>Key findings</h2><h3>7.1 What <em>is</em> here</h3><h2>Key findings</h2>', toc);
  assert.match(html, /<h2 id="key-findings">/);
  assert.match(html, /<h3 id="71-what-is-here">/);
  assert.deepEqual(toc.map((t) => t.id), ['key-findings', '71-what-is-here', 'key-findings-1']);
});

test('a bold Table paragraph becomes the caption of a scrolling, labelled table', () => {
  const html = wrapTables('<p><strong>Table 1. Dates</strong></p>\n<table><thead><tr><th>A</th></tr></thead></table><table><tr><td>x</td></tr></table>');
  assert.match(html, /<div class="table-scroll" role="region" aria-labelledby="table-1" tabindex="0"><table><caption id="table-1">Table 1. Dates<\/caption><thead><tr><th scope="col">A<\/th>/);
  assert.match(html, /aria-label="Table 2"/);
});

test('the body splits at generated figures and tables, keeping their captions', () => {
  const html = '<p>a</p><div data-figure="promise-days"></div>\n<p><em>Figure 1. Days.</em></p><p>b</p><p><strong>Table A1. Promises</strong></p>\n<div data-table="promises"></div>\n<p><em>Source: ledger.</em></p>';
  const s = splitSegments(html);
  assert.deepEqual(s.map((x) => x.kind), ['html', 'figure', 'html', 'table', 'html']);
  assert.equal(s[1].caption, 'Figure 1. Days.');
  assert.equal(s[3].caption, 'Table A1. Promises');
  assert.equal(s[3].captionId, 'gen-table-1');
  assert.equal(s[4].html.trim(), '<p><em>Source: ledger.</em></p>');
});
