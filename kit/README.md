# Start a promise ledger for your country

This kit helps you record what your government has promised about AI rules, by when, and whether it happened, in the [Open Promise Ledger format](../docs/standard/v0.1/README.md). Bahasa Indonesia: [README.id.md](README.id.md).

## What you can reuse today, and what you cannot

- **Reusable now:** the format, its JSON Schema, the deadline rules, the outcome computation (`scripts/promises.mjs`) and the validator. They work on any country's data.
- **Not yet reusable:** the Monsoon Ledger website. It is built for Indonesia, in English and Bahasa Indonesia, and would need real work to serve another country. If you want a site, start with the data. A ledger kept as a clean YAML file and checked by the validator is already useful to researchers and journalists.

## What is in the kit

| File | What it holds |
| --- | --- |
| `data/deadlines.yml` | Your promises, one row each, newest first. It starts with one real Indonesian row as a worked example, with every field explained. |
| `data/instruments.yml` | The laws, drafts and guidance your promises are about. It starts with one Indonesian example. |
| `data/sources.yml` | Where you look for new promises: legal databases, ministry pages, news searches. Same format as the Monsoon Ledger scanner's watch list. |

## Steps

1. Fork or clone [the repository](https://github.com/SteveBehren/monsoon-ledger) and install it with Node 22.23.4 or newer: `npm run setup`.
2. Copy `kit/` to your own folder, for example `ledgers/xx/`, where `xx` is your country code.
3. Collect promises. For each one, find the report, read the exact words, and note who said it and when.
4. Classify each promise as `dated`, `conditional` or `status_claim`, and for dated ones derive the deadline with the rules in section 6 of the format. Write the wording that sets the deadline into `deadline_basis_en` and `deadline_basis_id`.
5. Grade the evidence: `legal-text`, `official-statement` or `press-report`.
6. Check your data: `npm run validate -- --data ledgers/xx/data`. The validator checks every row against the schema and recomputes every deadline from its rule.
7. Preserve your sources. `scripts/archive.mjs` shows how Monsoon Ledger records Internet Archive copies; adapt its file list to your folder.
8. Publish the data, and open an issue on the repository to be listed in `docs/standard/adopters.yml`.

## Ground rules

- Every value comes from the source you cite. Do not infer a deadline, a role or an instrument the source does not state.
- Never write an outcome by hand. Record `outcome_date` and its source when something happens, and let the computation decide met or missed.
- Show the day every count was computed for.
- Correct in the open and keep a dated log of corrections.

## Getting help

Open an issue on [github.com/SteveBehren/monsoon-ledger](https://github.com/SteveBehren/monsoon-ledger/issues) with the row you are unsure about.
