# Monsoon Ledger: rules for working in this repo

A public, bilingual (English and Bahasa Indonesia) tracker of how Indonesia governs AI. It is a credibility project. Accuracy matters more than speed or polish.

## Non-negotiable

- Never invent facts, quotes, dates, URLs, statistics, names or source titles. If something is missing, leave a clearly marked `TODO` comment and tell the author.
- Every claim needs a source url. Every entry needs at least one source.
- Do not rewrite `my_take` or `pendapat_id` unless the author asks. They are the author's own words.
- Every change must pass `npm run validate`. The site build runs it first and fails if it fails.
- Keep the scope: the ledger, its entries and its promises stay Indonesia only until there are 12 Indonesian entries. Data protection only where it shapes AI governance (breach reporting, regulators).
- The repo also holds (a) an Analysis section of longer written work (`writing/`, shown at `/[lang]/analysis/`) and (b) a Frontier incident reference dataset (`data/frontier-incidents.yml`). Both are context for the ledger. Never mix them into the ledger's counts.
- Every new page ships in English and Bahasa Indonesia. `scripts/check-parity.mjs` checks the routes and the `_en`/`_id` field twins and fails the build, except for pages marked partial.

## Writing rules (all text, including code comments and commit messages)

- No em dashes and no en dashes anywhere. Use commas or full stops. The validator rejects them.
- Plain, natural English. Natural, conversational Bahasa Indonesia, not stiff or bureaucratic.
- Do not mix languages inside one sentence, except original quotes and proper names.
- Tone: plain and careful, never mocking. The evidence level is always visible.
- Quotes: original language, under 15 words, at most one quote per source across all entries and analysis papers, with an English line under it. The only exemption: statute text on Analysis pages may be longer when shown in the original language with an English line beneath. Nothing else is exempt.
- Never claim the project, or anything in it, is the first, the only, unique or complete.

## Evidence levels

- `legal-text`: the author has read the signed or published text of the instrument itself.
- `official-statement`: a minister, official or government body said it on the record, reported by a named outlet or official channel. It shows intent, not law.
- `press-report`: journalism or secondary analysis (for example a law firm summary) without the primary text. Provisional.

Upgrade the evidence level only when the author has read the stronger source.

## Weekly workflow

```sh
npm run new-entry -- --slug id-example-topic   # creates data/entries/<today>-<slug>.yml
# fill every field
npm run validate
git add data && git commit -m "Add entry: ..." && git push
```

When something happens to a promise, set `outcome_date` and `outcome_source_url` in `data/deadlines.yml`, update the one-line outcome text, and add a dated line to `CHANGELOG.md`. Update `last_checked` on an entry only when its sources were actually re-opened.

## Promises (Janji vs Kenyataan)

- `data/deadlines.yml` follows the Open Promise Ledger format in `docs/standard/v0.1/`. The validator checks it against `docs/standard/v0.1/promise.schema.json`. Change the format only by changing the spec, the schema and the examples together.
- Every row has a `claim_type`: `dated` (a deadline that can pass), `conditional` (depends on an event, no date) or `status_claim` (progress, no deadline). When one statement holds a status claim and a dated target, they are two rows.
- Derive deadlines only from the words in the source, with the rules in the spec: the latest plausible reading, the last day of a named period, calendar months from `date_said` clamped to month ends, and the deadline day counted in WIB. Record `deadline_rule`, `deadline`, `deadline_precision`, and the wording in `deadline_basis_en` and `deadline_basis_id`. The validator recomputes every deadline from its rule.
- Never write or hand-set an outcome. `scripts/promises.mjs` computes met, missed, open or no deadline on the build day, for every page, the feeds, the cards and the validator. Do not add a second way to compute or count outcomes anywhere.
- Headline counts are among dated promises only and always show the day they are as of.
- Record a speaker's role only as the row's own source states it. List every new derivation for the author to confirm.
- Each promise has a receipt at `/[lang]/promises/<key>/`, keyed by `promiseKey` (date said and speaker), shared with the ontology and the ledger anchor. Receipts never show a quote unless the source gives one and the quote rules allow it. Share cards come only from `scripts/make-share-images.mjs` at build time and always show their as-of day.

## Evidence preservation

- `scripts/archive.mjs` adds `archive_url` and `archived_at` beside sources in `data/deadlines.yml`, `data/instruments.yml` and the entries, and nothing else. It runs after each scheduled scan and must never block a scan or a build.
- Missing archives are validator warnings, not failures. Never fake or guess an archive url; only record one the archive returned.
- Wherever a source is shown, show its archived copy next to it.

## Build log

- Every update the author asks for gets a row in `data/build-log.yml` (newest first), in the same pull request as the change. That includes fixes, reverts and rollbacks, and changes that went wrong. The rows are shown under "Build so far" on Method, Technical system.
- Fields: `date`, `kind` (feature, fix, content, revert, rollback), `title_en`, `title_id`, `detail_en`, `detail_id`, `pr` once the pull request exists, and `commits` as quoted short hashes.
- Describe what changed and why, plainly. Never leave a mistake out of the log.

## Ontology layer

- `scripts/ontology.mjs` builds the graph from the data files. The validator and the site share it.
- Curated links go in `data/ontology.yml`. Each needs `from`, `rel`, `to`, `evidence` and a `source_url` the ledger already cites. Never add a link the source does not state, never infer an official's title or role, and never tie a promise to an instrument by guesswork.

## Monitoring layer (the Radar)

- `.github/workflows/scan.yml` runs `npm run scan` every Monday and Thursday at 06:17 WIB and commits `data/radar.yml`, `data/scan-log.yml` and `data/watch/seen.json` to main.
- The scanner only ever writes those three files. It never creates or edits entries, instruments or deadlines. Never change that. The archive step in the same workflow only adds archive fields beside sources (see Evidence preservation).
- Radar leads are unreviewed. To review one, set `status` to `reviewed`, `dismissed` or `promoted` (with `promoted_to: <entry id>`). Promote only after reading the source and writing a full entry.
- Sources and scoring live in `data/watch/sources.yml` and `data/watch/keywords.yml`. Test changes with `npm test` and `npm run scan -- --dry-run --no-claude`.
- Claude triage runs only if the `ANTHROPIC_API_KEY` repository secret exists. Its summaries restate headlines and are labelled as machine summaries on the site.

## Analysis papers

- A paper is Markdown with front matter: the full English text in `writing/analysis/<id>.en.md`, the Bahasa Indonesia text in `writing/analisis/<id>.id.md` (it may be a draft translation of some sections, marked `partial: true`). Its numbered sources are in `data/analysis/<id>.sources.yml` and are cited in the text as [n].
- Mark every direct quote: `<q data-src="n">` inline, `<blockquote data-src="n">` for block quotes, `<blockquote class="statute" data-src="n">` for statute text. `scripts/analysis.mjs` holds the rules and the validator applies them: every [n] resolves, every source is cited, https only, no duplicate urls, quote length and one quote per source.
- Figures and tables built from data are computed as of the paper's `facts_as_of` day, never typed into the text.
- Changes after publication go in `CHANGELOG.md` with the tag `[analysis-NN]`. Corrections anywhere get the tag `[correction]` and appear on the Corrections page.
- Drafts that are not published (cross-posts, summaries, outlines) stay in `writing/` and are never linked from the site.

## Where things live

- `data/schema.json`: the entry schema. `scripts/validate.mjs` adds checks the schema cannot express (id equals file name, instrument exists, quote rules, deadlines fields, no dashes).
- `data/instruments.yml`, `data/deadlines.yml`: shared data.
- `data/ontology.yml`, `scripts/ontology.mjs` (tests in `scripts/ontology.test.mjs`): the ontology layer. `data/build-log.yml`: the build log.
- `scripts/promises.mjs` (tests in `scripts/promises.test.mjs`): deadline rules and computed outcomes. `scripts/archive.mjs` (tests in `scripts/archive.test.mjs`): evidence preservation.
- `scripts/analysis.mjs`, `site/src/lib/analysis.ts`: analysis papers, shared by the validator and the site. `CITATION.cff`, `.zenodo.json`, `docs/releasing.md`: citation and archiving (no DOI exists yet).
- `docs/standard/`: the promise format, its schema, examples and adopters. `kit/`: a data skeleton and guide for other countries, checked with `npm run validate -- --data kit/data`.
- `scripts/make-share-images.mjs` and `scripts/fonts/` (Inter, OFL): every preview card and icon. The fonts are for images only; the site loads no fonts.
- `data/radar.yml`, `data/scan-log.yml`, `data/watch/`: the monitoring layer. `scripts/scan.mjs` and `scripts/scan/` (tests in `scripts/scan/scan.test.mjs`, run with `npm test`).
- `site/`: Astro static site, no runtime server, no client framework. UI strings in `site/src/lib/i18n.ts`, data loading in `site/src/lib/data.ts`.
- Dependencies are installed in `site/node_modules` (`npm run setup`). Scripts resolve them from there.
- Node 22.23.4 or newer (Astro 7).

## Do not

- Add analytics, trackers, external fonts or a client framework.
- Add motion that ignores `prefers-reduced-motion`, or animation that keeps running off screen.
- Publish anything about the author beyond what is already on the About page. The About page may have one section called "Direction" ("Where this is going"); nothing else about the author.
