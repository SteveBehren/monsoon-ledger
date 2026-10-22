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

## Where things live

- `data/schema.json`: the entry schema. `scripts/validate.mjs` adds checks the schema cannot express (id equals file name, instrument exists, quote rules, deadlines fields, no dashes).
- `data/instruments.yml`, `data/deadlines.yml`: shared data.
- `site/`: Astro static site, no runtime server, no client framework. UI strings in `site/src/lib/i18n.ts`, data loading in `site/src/lib/data.ts`.
- Dependencies are installed in `site/node_modules` (`npm run setup`). Scripts resolve them from there.
- Node 22.23.4 or newer (Astro 7).

## Do not

- Add analytics, trackers, external fonts or a client framework.
- Publish anything about the author beyond what is already on the About page.
