# Contributing to Monsoon Ledger

Monsoon Ledger tracks how Indonesia governs AI, and checks what officials promise against what happens. It is a credibility project, so the most useful contributions are corrections and sources.

## The quickest ways to help

- **Report a correction.** Something on the site is wrong, out of date or badly sourced. Use the [correction form](https://github.com/SteveBehren/monsoon-ledger/issues/new?template=correction.yml). Please include the page, what it says now, what it should say, and a source.
- **Suggest a source.** A law, regulation, official statement or report the ledger should read. Use the [source suggestion form](https://github.com/SteveBehren/monsoon-ledger/issues/new?template=source-suggestion.yml).
- **Suggest a promise.** An official said, on the record, that an AI rule or body would be ready by a date or after an event. Use the [promise suggestion form](https://github.com/SteveBehren/monsoon-ledger/issues/new?template=promise-suggestion.yml).
- **Ask or discuss.** For questions that are not a correction, use [Discussions](https://github.com/SteveBehren/monsoon-ledger/discussions) once it is switched on.

Bahasa Indonesia is welcome everywhere: in issues, in discussions and in pull requests.

## What happens to a correction

Every correction is checked against its source. If it holds, the data or text is changed, and a dated line goes in `CHANGELOG.md` with the tag `[correction]`. Those lines are listed on the site's Corrections page. If a correction does not hold, the issue says why.

## Rules the data follows

These come from `CLAUDE.md`, which is the working rulebook for the repository.

- Never invent a fact, quote, date, URL, statistic, name or source title. A missing fact stays missing, marked with a `TODO`.
- Every claim needs a source URL, and the evidence level is always shown: `legal-text` (the published text itself), `official-statement` (said on the record) or `press-report` (journalism or secondary analysis).
- Quotes stay in the original language, under 15 words, at most one per source, with an English line under them.
- Promise outcomes are computed, never written by hand.
- No em dashes or en dashes anywhere. Use commas or full stops.
- Never describe the project or anything in it as the first, the only, unique or complete.
- `my_take` and `pendapat_id` are the author's own words. Do not edit them in a pull request.

## Working on the code

```sh
npm run setup      # installs dependencies into site/node_modules
npm run validate   # checks every data file and every rule above
npm test           # unit tests, no network
npm run build      # validates, then builds the static site
```

Node 22.23.4 or newer. Every pull request must pass `npm run validate`, `npm test` and `npm run build`; CI runs all three.

Every change the author asks for gets a row in `data/build-log.yml` in the same pull request.

## Licences

Code is under MIT (`LICENSE`). Data and writing are under CC BY 4.0 (`LICENSE-CONTENT.md`). By contributing you agree that your contribution is published under the same licences.
