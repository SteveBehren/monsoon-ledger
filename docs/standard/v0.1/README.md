# Open Promise Ledger, version 0.1

A format for recording what governments promise about AI rules, by when, on what evidence, and whether it happened. In a ledger that follows it, "missed" is a calculation anyone can repeat, not a judgement.

Status: draft, version 0.1, October 2026. Published with [Monsoon Ledger](https://monsoonledger.vercel.app), which uses it for Indonesia. Machine-readable schema: [promise.schema.json](https://monsoonledger.vercel.app/standard/v0.1/promise.schema.json).

## 1. Purpose

Officials often announce a rule and give a date for it long before the rule exists. Readers then have to work out which announcements turned into law, which slipped, and by how much. This format records each public promise as one row with:

- the date and the speaker;
- the exact claim, in the original language and in English;
- a deadline derived from the wording by published rules, with the wording that sets it;
- the source, a preserved copy of it, and how strong the evidence is.

The outcome is not written by hand. It is computed from the row and the current date. That way every count can be rechecked, and a promise turns from open to missed on its own when its deadline passes.

## 2. Scope

In scope: public commitments by government actors (ministers, officials, agencies, legislatures) about AI law, regulation, strategy and guidance, and about closely related digital rules where they shape AI governance, such as data protection authorities and breach reporting.

Out of scope: election pledges, commitments by companies, forecasts by analysts, and anything said off the record.

## 3. Object types

A ledger holds five kinds of thing. In version 0.1 they are stored together, one row per promise, in a YAML or JSON list.

| Object | What it is | Fields |
| --- | --- | --- |
| Promise | One statement committing to an action | `date_said`, `country`, `claim_type`, `promised_en`, `promised_id`, the deadline fields |
| Outcome | What happened afterwards | `outcome_en`, `outcome_id`, `outcome_date`, `outcome_source_url`, and the computed outcome |
| Source | The report or record the promise rests on | `source_url`, `archive_url`, `archived_at`, `evidence` |
| Actor | Who made the promise | `who`, `role_en`, `role_id` |
| Instrument | The law or draft the promise is about | `instrument`, an id in the ledger's list of instruments |

## 4. Fields

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `date_said` | date, YYYY-MM-DD | yes | The day the promise was made, in the speaker's time zone. |
| `country` | ISO 3166-1 alpha-2 | yes | The government that made the promise. |
| `who` | text | yes | The speaker as the source names them, then a comma and their body or title, for example `Meutya Hafid, Minister`. |
| `role_en`, `role_id` | text | no | The speaker's role at the time, as the source states it. |
| `instrument` | id | no | The instrument the promise is about, only when the source names it. |
| `claim_type` | `dated`, `conditional` or `status_claim` | yes | See section 5. |
| `deadline_rule` | rule | dated only | How the deadline follows from the wording. See section 6. |
| `deadline` | date | dated only | The last day the promise could still be kept. |
| `deadline_precision` | `day`, `month`, `quarter`, `half` or `year` | dated only | How precise the wording was. |
| `deadline_basis_en`, `deadline_basis_id` | text | yes | The wording that sets the deadline, or explains why there is none, and how the date was derived. |
| `promised_en`, `promised_id` | text | yes | The promise in one line, in English and in the language it was made in. |
| `outcome_en`, `outcome_id` | text | yes | What has happened since, in one line. Narrative only, it never sets the outcome. |
| `outcome_date` | date | no | The day the promise was kept or the outcome confirmed. |
| `outcome_source_url` | url | with `outcome_date` | The source that shows it. |
| `evidence` | `legal-text`, `official-statement` or `press-report` | yes | See section 8. |
| `source_url` | url | yes | The report or record of the promise. |
| `archive_url`, `archived_at` | url, date | together, when available | A preserved copy of the source and the day it was made. See section 9. |

A note on names: the second-language fields end in `_id` because the first ledger is Indonesian (Bahasa Indonesia has the code `id`). A ledger in another country puts the original-language text in those fields. A later version may rename them.

## 5. Claim types

- **dated**: the promise has a deadline that can pass. Example: "a binding rule within three months".
- **conditional**: the promise depends on an event and gives no date. Example: "the task force starts once the President signs". It is never counted as missed. If the event happens and the promise is kept, `outcome_date` records it.
- **status_claim**: a claim about progress, with no deadline of its own. Example: "only the President's signature is left". It is never counted as missed.

When one statement contains both a status claim and a dated target, they are two promises and get two rows.

## 6. Deriving the deadline

The deadline is the last day the promise could still be kept. It is derived from the words in the source by these rules, in this order:

1. **Use the latest plausible reading.** When the wording allows more than one date, take the latest, so that every "missed" can be defended. Say in `deadline_basis_en` which readings were possible.
2. **A named period ends on its last day.** "In June 2025" is 2025-06-30. "In the first half of 2026" is 2026-06-30. "In 2026" is 2026-12-31. "This month" is the last day of the month in which it was said. "In the first or second quarter" is the last day of the second quarter.
3. **"Within N months" counts calendar months from `date_said`.** The day of the month is kept and clamped to the last day of a shorter month: one month from 31 January is 28 February, or 29 February in a leap year.
4. **"Within N days" counts N days from `date_said`.**
5. **The deadline day counts in the speaker's time zone.** For Indonesia that is Western Indonesian Time (WIB, UTC+7). The promise is still open on the deadline day itself.
6. **No wording, no deadline.** If the source gives no date or period, the promise is conditional or a status claim, not dated.

`deadline_rule` records the derivation so a validator can recompute it:

| Rule | Deadline | Precision |
| --- | --- | --- |
| `within 3 months` | three calendar months after `date_said`, clamped | day |
| `within 10 days` | ten days after `date_said` | day |
| `end 2025-06` | 2025-06-30 | month |
| `end 2026-Q2` | 2026-06-30 | quarter |
| `end 2026-H1` | 2026-06-30 | half |
| `end 2026` | 2026-12-31 | year |
| `on 2025-04-13` | 2025-04-13 | day |

Worked examples from the Indonesian ledger:

| Said | Wording in the source | Rule | Deadline |
| --- | --- | --- | --- |
| 2025-01-13 | finished within three months, or in April 2025 | `end 2025-04` (the later of 13 April and the end of April) | 2025-04-30 |
| 2025-06-17 | released this month | `end 2025-06` | 2025-06-30 |
| 2025-09-16 | to launch this month | `end 2025-09` | 2025-09-30 |
| 2025-12-16 | on the President's desk early in 2026, out in the first half | `end 2026-H1` | 2026-06-30 |
| 2026-01-26 | a priority to sign in 2026 | `end 2026` | 2026-12-31 |

Edge cases: `within 1 month` said on 2025-01-31 gives 2025-02-28. Said on 2024-01-31 it gives 2024-02-29.

## 7. Computing the outcome

The outcome is computed for a given day, `today`, in the ledger's time zone. It is never stored.

For a **dated** promise:

- with `outcome_date` on or before `deadline`: **met**, kept `deadline - outcome_date` days early (zero means on the day);
- with `outcome_date` after `deadline`: **missed**, kept late by `outcome_date - deadline` days;
- with no `outcome_date` and `today` after `deadline`: **missed**, `today - deadline` days past the deadline;
- otherwise: **open**, with `deadline - today` days left.

For a **conditional** promise: **met** if it has an `outcome_date`, otherwise **no deadline**.

For a **status claim**: always **no deadline**.

Headline counts are taken among dated promises only, for example "4 of 5 dated promises missed". Conditional promises and status claims are reported next to them, not inside them. Every count shows the day it was computed for.

## 8. Evidence levels

These are the definitions Monsoon Ledger uses, word for word:

- `legal-text`: the author has read the signed or published text of the instrument itself.
- `official-statement`: a minister, official or government body said it on the record, reported by a named outlet or official channel. It shows intent, not law.
- `press-report`: journalism or secondary analysis (for example a law firm summary) without the primary text. Provisional.

Upgrade the evidence level only when the author has read the stronger source.

## 9. Preserving sources

Every `source_url` should have a preserved copy in a public web archive, recorded as `archive_url` and `archived_at`:

1. use an existing snapshot if one exists, and otherwise request a new one;
2. keep the original `source_url` as the citation, and show the copy next to it;
3. a source without a copy is flagged for attention, never rejected;
4. if the original disappears or changes, the copy is the record of what was said.

Monsoon Ledger does this with the Internet Archive, twice a week, through `scripts/archive.mjs`.

## 10. What the format deliberately does not do

- **No scoring of individuals.** It records promises and outcomes. It does not rank officials or turn rows into a score for a person.
- **No prediction.** It does not estimate whether an open promise will be kept.
- **No inference.** A deadline comes only from the words in the source. A promise is tied to an instrument only when the source names it. A speaker's role is recorded only as the source states it.

## 11. Mapping to other vocabularies

Only where the match is honest:

| Field | Mapping |
| --- | --- |
| `source_url` | the source a receipt is based on, `schema:isBasedOn` |
| `archive_url` | a preserved copy of that source, `schema:archivedAt` |
| `instrument` | the instrument's own record, published as `schema:Legislation` where it is legislation, with `legislationPassedBy` and `legislationEnsuresImplementationOf` (ELI `passed_by` and `ensures_implementation_of`) where the source states them |

There is no honest match for `date_said`, `deadline` or the claim types, so none is given.

## 12. Related work

Promise trackers exist in civic technology. Code for Africa's [PromiseTracker](https://promisetracker.cite.org.zw/about/) follows election promises. Policy trackers and law firm guides list AI instruments by country. This format is narrower: dated commitments about AI rules, each with a deadline derived from published rules, graded evidence and a preserved source.

## 13. Versioning

The version is part of the schema's address (`/standard/v0.1/`). Versions before 1.0 may change fields. Each change is listed in the Monsoon Ledger changelog with its date, and a ledger states which version it follows. Rows written for 0.1 stay valid under 0.1.

## 14. Proposing changes

Open an issue on [github.com/SteveBehren/monsoon-ledger](https://github.com/SteveBehren/monsoon-ledger/issues) with a real row that the format handles badly and what you would change. To list your ledger as following the format, open an issue with a link to its data.

## 15. Files

- [promise.schema.json](https://github.com/SteveBehren/monsoon-ledger/blob/main/docs/standard/v0.1/promise.schema.json): JSON Schema 2020-12 for one promise row.
- [examples/](https://github.com/SteveBehren/monsoon-ledger/tree/main/docs/standard/v0.1/examples): a dated and a conditional row, copied from the Indonesian ledger.
- [kit/](https://github.com/SteveBehren/monsoon-ledger/tree/main/kit): a starting point for a ledger in another country.
- [adopters.yml](https://github.com/SteveBehren/monsoon-ledger/blob/main/docs/standard/adopters.yml): ledgers that follow the format.
