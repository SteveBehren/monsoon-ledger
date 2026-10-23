# Monsoon Ledger: rules for working in this repo

A public, bilingual (English and Bahasa Indonesia) tracker of how Indonesia governs AI. It is a credibility project. Accuracy matters more than speed or polish.

## Non-negotiable

- Never invent facts, quotes, dates, URLs, statistics, names or source titles. If something is missing, leave a clearly marked `TODO` comment and tell the author.
- Every claim needs a source url. Every entry needs at least one source.
- Do not rewrite `my_take` or `pendapat_id` unless the author asks. They are the author's own words.
- Every change must pass `npm run validate`. The site build runs it first and fails if it fails.
- Keep the scope: Indonesia only until there are 12 Indonesian entries. Data protection only where it shapes AI governance (breach reporting, regulators).

## Writing rules (all text, including code comments and commit messages)

- No em dashes and no en dashes anywhere. Use commas or full stops. The validator rejects them.
- Plain, natural English. Natural, conversational Bahasa Indonesia, not stiff or bureaucratic.
- Do not mix languages inside one sentence, except original quotes and proper names.
- Tone: plain and careful, never mocking. The evidence level is always visible.
- Quotes: original language, under 15 words, at most one quote per source across all entries, with an English line under it.

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

When a deadline outcome changes, update `data/deadlines.yml` (newest first) and add a dated line to `CHANGELOG.md`. Update `last_checked` on an entry only when its sources were actually re-opened.

## Build log

- Every update the author asks for gets a row in `data/build-log.yml` (newest first), in the same pull request as the change. That includes fixes, reverts and rollbacks, and changes that went wrong. The rows are shown under "Build so far" on Method, Technical system.
- Fields: `date`, `kind` (feature, fix, content, revert, rollback), `title_en`, `title_id`, `detail_en`, `detail_id`, `pr` once the pull request exists, and `commits` as quoted short hashes.
- Describe what changed and why, plainly. Never leave a mistake out of the log.

## Ontology layer

- `scripts/ontology.mjs` builds the graph from the data files. The validator and the site share it.
- Curated links go in `data/ontology.yml`. Each needs `from`, `rel`, `to`, `evidence` and a `source_url` the ledger already cites. Never add a link the source does not state, never infer an official's title or role, and never tie a promise to an instrument by guesswork.

## Monitoring layer (the Radar)

- `.github/workflows/scan.yml` runs `npm run scan` every Monday and Thursday at 06:17 WIB and commits `data/radar.yml`, `data/scan-log.yml` and `data/watch/seen.json` to main.
- The scanner only ever writes those three files. It never creates or edits entries, instruments or deadlines. Never change that.
- Radar leads are unreviewed. To review one, set `status` to `reviewed`, `dismissed` or `promoted` (with `promoted_to: <entry id>`). Promote only after reading the source and writing a full entry.
- Sources and scoring live in `data/watch/sources.yml` and `data/watch/keywords.yml`. Test changes with `npm test` and `npm run scan -- --dry-run --no-claude`.
- Claude triage runs only if the `ANTHROPIC_API_KEY` repository secret exists. Its summaries restate headlines and are labelled as machine summaries on the site.

## Where things live

- `data/schema.json`: the entry schema. `scripts/validate.mjs` adds checks the schema cannot express (id equals file name, instrument exists, quote rules, deadlines fields, no dashes).
- `data/instruments.yml`, `data/deadlines.yml`: shared data.
- `data/ontology.yml`, `scripts/ontology.mjs` (tests in `scripts/ontology.test.mjs`): the ontology layer. `data/build-log.yml`: the build log.
- `data/radar.yml`, `data/scan-log.yml`, `data/watch/`: the monitoring layer. `scripts/scan.mjs` and `scripts/scan/` (tests in `scripts/scan/scan.test.mjs`, run with `npm test`).
- `site/`: Astro static site, no runtime server, no client framework. UI strings in `site/src/lib/i18n.ts`, data loading in `site/src/lib/data.ts`.
- Dependencies are installed in `site/node_modules` (`npm run setup`). Scripts resolve them from there.
- Node 22.23.4 or newer (Astro 7).

## Do not

- Add analytics, trackers, external fonts or a client framework.
- Add motion that ignores `prefers-reduced-motion`, or animation that keeps running off screen.
- Publish anything about the author beyond what is already on the About page.
