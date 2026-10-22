# Monsoon Ledger

**AI governance from the archipelago, read in the original Bahasa.**

*Catatan janji dan kenyataan tata kelola AI di Nusantara.*

Live site: https://monsoonledger.vercel.app

## What this is

Monsoon Ledger is a public, bilingual (English and Bahasa Indonesia) tracker of how Indonesia governs artificial intelligence. Every entry is tied to primary or official sources and compared with the EU AI Act and frontier AI safety practice. ASEAN neighbours come later, once there are twelve Indonesian entries.

The monsoon is forecast and announced long before it arrives. Indonesia's AI rules have worked the same way. The ledger records what was promised and what actually showed up.

## Why it exists

Indonesia's AI policy is announced, debated and missed in Bahasa Indonesia. Ministers give deadlines in interviews, drafts are described in official statements, and consultations with foreign business groups are reported by Indonesian outlets. Very little of that detail reaches readers who do not read Indonesian. I read Bahasa natively and I live under EU rules, so I read the original and set it beside the European rules for comparison.

## Three recurring features

1. **Janji vs Kenyataan (Promise vs reality).** Every public deadline officials have given, set against what happened next, with a missed, open or met stamp.
2. **A Safety lens on every entry.** The same four questions each time: does it require incident reporting, does it name unacceptable uses, does it address general-purpose models, and how strongly is it enforced.
3. **Bahasa first.** Key quotes stay in the original Indonesian with an English line under them, and Indonesian-language sources come first.

## How to read an entry

Each entry shows, at the top, its **status** (announced, draft, signed, in force, withdrawn), its **evidence level** and the **last checked** date, which is the last day I re-opened the sources. Then come a summary, an optional quote, the Safety lens panel, a comparison with the EU, my own take, and the full list of sources.

## Evidence levels

| Level | Meaning |
| --- | --- |
| Legal text | I have read the signed or published text of the instrument itself. The strongest level. |
| Official statement | A minister, official or government body said it on the record, as reported by a named outlet or an official channel. It tells you what the government says it intends, not what the law says. |
| Press report | The claim rests on journalism or secondary analysis, such as a law firm summary, without the primary text. Provisional until the primary text is read. |

When the legal text becomes available, I read it and upgrade the evidence level.

## Adding an entry (the weekly workflow)

One-time setup, with Node 22.23.4 or newer:

```sh
npm run setup
```

Every week:

```sh
npm run new-entry -- --slug id-example-topic   # creates data/entries/<today>-id-example-topic.yml
# fill in every field in the new file
npm run validate                               # must pass
git add data && git commit -m "Add entry: example topic" && git push
```

Pushing to `main` rebuilds the site. To preview locally, run `npm run dev`. To check that source links still work, run `npm run links` (informational only).

If a deadline in the ledger changes outcome, edit `data/deadlines.yml` and add a dated line to `CHANGELOG.md`.

## Project layout

```
data/schema.json        entry schema (JSON Schema 2020-12)
data/entries/           one YAML file per entry
data/deadlines.yml      the Janji vs Kenyataan ledger, newest first
data/instruments.yml    laws, drafts and guidance referenced by entries
writing/                longer analysis (analysis/ in English, analisis/ in Bahasa)
scripts/                validate, new-entry, check-links
site/                   the Astro static site
```

## Corrections

Anyone can [open an issue](https://github.com/SteveBehren/monsoon-ledger/issues) with a source. Errors are fixed in the open and logged with a date in [CHANGELOG.md](CHANGELOG.md).

## How AI is used here

I research the sources, write and edit every entry and every My take myself, and use Claude to help draft, translate and build the site. Translated text is reviewed by me, and every source is linked so you can check it yourself.

## Licence

Code: MIT, see [LICENSE](LICENSE). Data and writing: CC BY 4.0, see [LICENSE-CONTENT.md](LICENSE-CONTENT.md).

---

**Dalam Bahasa Indonesia.** Monsoon Ledger adalah pelacak publik dalam dua bahasa tentang cara Indonesia mengatur kecerdasan artifisial. Setiap catatan bersandar pada sumber primer atau resmi, diberi label seberapa kuat buktinya, lalu dibandingkan dengan EU AI Act dan praktik keselamatan AI terdepan. Bagian Janji vs Kenyataan mencatat setiap tenggat yang pernah diumumkan pejabat dan apa yang benar-benar terjadi. Kalau Anda menemukan kesalahan, silakan buka issue dengan menyertakan sumbernya.
