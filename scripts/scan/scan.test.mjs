// node --test scripts/
// Unit tests for the scanner's parsers and scoring, and an end-to-end run on the
// synthetic fixtures in ./fixtures. No network, no API key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseFeed, parseLinks, cleanText } from './parse.mjs';
import { makeScorer, normaliseDashes, normaliseUrl, leadId, urlSlugKey } from './score.mjs';
import { readYaml, ROOT } from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, 'fixtures');
const keywords = readYaml(path.join(ROOT, 'data', 'watch', 'keywords.yml'));
const score = makeScorer(keywords);
const BANNED = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);

test('parseFeed reads Google News items and strips the outlet suffix', () => {
  const items = parseFeed(fs.readFileSync(path.join(FIXTURES, 'gn-id-ai-regulation.xml'), 'utf8'), 'https://news.google.com/');
  assert.equal(items.length, 9);
  assert.equal(items[0].title, '[TEST] Komdigi bahas rancangan Perpres kecerdasan artifisial');
  assert.equal(items[0].outlet, 'Contoh Media');
  assert.equal(items[0].published, '2026-10-21');
  assert.equal(items[0].summary, 'Komdigi bahas rancangan');
});

test('parseLinks keeps absolute http links with real text and drops script links', () => {
  const links = parseLinks(fs.readFileSync(path.join(FIXTURES, 'jdih-komdigi.html'), 'utf8'), 'https://jdih.komdigi.go.id/');
  const urls = links.map((l) => l.link);
  assert.ok(urls.includes('https://jdih.komdigi.go.id/dokumen/rancangan-perpres-etika-kecerdasan-artifisial'));
  assert.ok(!urls.some((u) => u.startsWith('javascript:')));
  assert.ok(!links.some((l) => l.title === 'Beranda'), 'short navigation links are ignored');
});

test('cleanText removes escaped markup and decodes entities', () => {
  assert.equal(cleanText('&lt;b&gt;Etika&lt;/b&gt; &amp; AI'), 'Etika & AI');
  assert.equal(cleanText('<![CDATA[ Perpres <i>AI</i> ]]>'), 'Perpres AI');
});

test('scoring keeps governance headlines and drops excluded ones', () => {
  assert.equal(score('Komdigi bahas rancangan Perpres kecerdasan artifisial').keep, true);
  assert.equal(score('Harga saham naik karena kecerdasan artifisial dan regulasi').keep, false, 'excluded term wins');
  assert.equal(score('Resep rendang enak').keep, false);
  assert.equal(score('Mainan baru untuk anak').score, 0, '"ai" inside a word does not count');
});

test('institution names alone never qualify, a core subject term is required', () => {
  const result = score('Menkomdigi Meutya Hafid tegaskan tata kelola pemerintahan Komdigi');
  assert.ok(result.score >= keywords.threshold, 'scores above the threshold');
  assert.equal(result.keep, false, 'but has no AI or data protection term');
});

test('country comes from the headline, then the outlet, then the source', () => {
  assert.equal(score.country('AI Governance Bill tabled in Dewan Rakyat', 'Contoh Media', 'ID'), 'MY');
  assert.equal(score.country('AI Governance Bill to require safety measures', 'NST Online', 'ID'), 'MY');
  assert.equal(score.country('President Marcos on ASEAN and AI', 'pageone.ph', 'ASEAN'), 'ASEAN', 'two countries named: keep the source');
  assert.equal(score.country('Regulasi AI segera terbit', 'Contoh Media', 'ID'), 'ID');
});

test('url slugs give a readable key for stories the ledger already cites', () => {
  assert.equal(
    urlSlugKey('https://www.antaranews.com/berita/5802305/pemerintah-siapkan-gugus-tugas-kawal-implementasi-regulasi-ai'),
    'pemerintah siapkan gugus tugas kawal implementasi regulasi ai',
  );
  assert.equal(urlSlugKey('https://example.org/'), '');
});

test('scoring suggests an instrument from hint terms', () => {
  assert.equal(score('Komdigi: etika AI berbasis risiko segera terbit').instrument, 'draft-perpres-ai-ethics');
  assert.equal(score('Lembaga PDP belum dibentuk, kata pakar regulasi').instrument, 'uu-pdp-27-2022');
});

test('normalisation removes dashes and tracking parameters', () => {
  assert.equal(normaliseDashes(`Peta jalan AI ${String.fromCharCode(0x2014)} etika`), 'Peta jalan AI - etika');
  assert.equal(normaliseUrl('https://WWW.Example.org/a/?utm_source=x&b=1#top'), 'https://example.org/a?b=1');
  assert.equal(leadId('https://example.org/a?utm_medium=y'), leadId('https://www.example.org/a/'));
});

test('end to end: a fixture scan writes clean, deduplicated, idempotent output', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'monsoon-scan-'));
  const run = () =>
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'scan.mjs'), '--fixtures', FIXTURES, '--out', out, '--today', '2026-10-23', '--no-claude'], {
      encoding: 'utf8',
      env: { ...process.env, ANTHROPIC_API_KEY: '' },
    });

  run();
  const radar = readYaml(path.join(out, 'radar.yml'));
  const titles = radar.leads.map((l) => l.title);

  assert.ok(titles.includes('[TEST] Komdigi bahas rancangan Perpres kecerdasan artifisial'));
  assert.ok(titles.includes('[TEST] Peta jalan AI nasional - tata kelola dan etika'), 'em dash normalised');
  assert.ok(titles.includes('[TEST] Rancangan Peraturan Presiden tentang Etika Kecerdasan Artifisial'), 'page-links source works');
  assert.ok(!titles.some((t) => t.includes('saham')), 'excluded term dropped');
  assert.ok(!titles.some((t) => t.includes('rendang')), 'irrelevant item dropped');
  assert.ok(!titles.some((t) => t.includes('Already in the ledger')), 'urls already in the ledger are skipped');
  assert.ok(!titles.some((t) => t.startsWith('Pemerintah siapkan gugus tugas')), 'a ledger story behind a redirect link is skipped');
  assert.ok(!titles.some((t) => t.includes('kantor baru')), 'no core term, not kept');
  const bill = radar.leads.find((l) => l.title.includes('Dewan Rakyat'));
  assert.equal(bill?.country, 'MY', 'country taken from the headline, not the Indonesian source');
  assert.equal(titles.filter((t) => t.startsWith('[TEST] Komdigi bahas')).length, 1, 'same headline via two urls stored once');
  for (const lead of radar.leads) {
    assert.equal(lead.status, 'new');
    assert.equal(lead.found, '2026-10-23');
    assert.match(lead.id, /^[0-9a-f]{10}$/);
  }
  assert.ok(!BANNED.test(fs.readFileSync(path.join(out, 'radar.yml'), 'utf8')), 'no em or en dashes in output');

  const log = readYaml(path.join(out, 'scan-log.yml'));
  assert.equal(log[0].mode, 'rules');
  assert.equal(log[0].new_leads, radar.leads.length);

  run();
  const again = readYaml(path.join(out, 'radar.yml'));
  assert.equal(again.leads.length, radar.leads.length, 'a second run adds nothing new');
  assert.equal(readYaml(path.join(out, 'scan-log.yml'))[0].new_leads, 0);
  fs.rmSync(out, { recursive: true, force: true });
});
