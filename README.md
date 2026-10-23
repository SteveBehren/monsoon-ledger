# Monsoon Ledger

**AI governance from the archipelago, promises checked against the record.**

*Catatan janji dan kenyataan tata kelola AI di Nusantara.*

Live site: https://monsoonledger.vercel.app

## What this is

Monsoon Ledger is a public, bilingual (English and Bahasa Indonesia) tracker of how Indonesia governs artificial intelligence. Every entry is tied to primary or official sources, labelled with how strong the evidence is, and compared with the EU AI Act and frontier AI safety practice. ASEAN neighbours come later, once there are twelve Indonesian entries. The scanner already watches them.

The monsoon is forecast and announced long before it arrives. Indonesia's AI rules have worked the same way. The ledger records what was promised and what actually showed up.

It is an independent project by Stephen Behren Tanjung. It is not legal advice.

## Why it exists

Indonesia's AI policy is announced, debated and missed in Bahasa Indonesia. Ministers give deadlines in interviews, drafts are described in official statements, and consultations are reported by Indonesian outlets. Very little of that detail reaches readers who do not read Indonesian. I read Bahasa Indonesia natively and I live under EU rules, so I read the original and set it beside the European rules for comparison.

From outside, an announced rule, a drafted rule, a signed rule and a rule in force can look like the same thing. The ledger dates every promise and links every source, so the difference stays visible. The [About](https://monsoonledger.vercel.app/en/about/) page sets this out as a short research abstract: background, problem, objectives, scope, contribution.

## What is on the site

| Page | What it does |
| --- | --- |
| [Home](https://monsoonledger.vercel.app/en/) | A live weather map whose markers are the public deadlines (red missed, amber open), a running clock since the first promise, the Safety lens matrix, the latest entries and the Radar. |
| [Entries](https://monsoonledger.vercel.app/en/entries/) | Every entry, newest first, with filters for status, evidence level and safety topic, and an overview of dates, evidence strength and source languages that follows the filters. |
| [Promise vs Reality](https://monsoonledger.vercel.app/en/ledger/) | Janji vs Kenyataan: every public deadline officials have given, what happened next, and a replay slider that rebuilds the ledger date by date. |
| [Instruments](https://monsoonledger.vercel.app/en/instruments/) | An interactive map of every law, draft and guide, where each sits in Indonesia's legal hierarchy, and a dossier for each with an EU comparison and numbered references. |
| [Ontology](https://monsoonledger.vercel.app/en/ontology/) | The whole ledger as one graph of typed objects and named links, with a live explorer, an inspector, search, filters and a full link register. |
| [Radar](https://monsoonledger.vercel.app/en/radar/) | Unreviewed leads found by the twice-weekly scanner, scan history, and a countdown to the next scan. |
| [Method](https://monsoonledger.vercel.app/en/method/) | The research protocol: design, research questions, sources, coding, evidence levels, verification and limits. |
| [Technical system](https://monsoonledger.vercel.app/en/method/system/) | How the site is built, how data is collected and checked, how Claude is used, and the build log of every change. |
| [Silencing by automation](https://monsoonledger.vercel.app/en/silencing/) | A working-draft legal brief on AI-run fake citizen voices against critics. |
| [About](https://monsoonledger.vercel.app/en/about/) | Why the project exists, its limits and its author. |

Every page exists in English (`/en/`) and Bahasa Indonesia (`/id/`).

## Recurring features

1. **Janji vs Kenyataan (Promise vs Reality).** Every public deadline officials have given, set against what happened next, with a missed, open or met stamp.
2. **A Safety lens on every entry.** The same four questions each time: does it require incident reporting, does it name unacceptable uses, does it address general-purpose models, and how strongly is it enforced.
3. **Indonesian first.** Key quotes stay in the original Indonesian with an English line under them, and Indonesian-language sources come first.

## How to read an entry

Each entry shows, at the top, its **status** (announced, draft, signed, in force, withdrawn), its **evidence level** and the **last checked** date, which is the last day I re-opened the sources. Then come a summary, an optional quote, the Safety lens panel, a comparison with the EU, my own take, and the full list of sources.

## Evidence levels

| Level | Meaning |
| --- | --- |
| Legal text | I have read the signed or published text of the instrument itself. The strongest level. |
| Official statement | A minister, official or government body said it on the record, as reported by a named outlet or an official channel. It tells you what the government says it intends, not what the law says. |
| Press report | The claim rests on journalism or secondary analysis, such as a law firm summary, without the primary text. Provisional until the primary text is read. |

When the legal text becomes available, I read it and upgrade the evidence level.

## The ontology layer

The ontology turns the ledger into one connected model. It has nine object types: instrument, entry, promise, official, institution, document, outlet, reference and radar lead. They are joined by sixteen named link types, such as *concerns*, *cites*, *made*, *passed by*, *drafted by* and *implements*.

- **Most links are derived, not written.** They are read straight from the data files at build time. An entry and a promise that cite the same report meet at one document object. That shared document is where the ledger fuses.
- **Curated links live in `data/ontology.yml`.** Each one names its source and an evidence level. The validator rejects a curated link that points at something missing, joins the wrong object types, or cites a source the ledger does not already cite.
- **Nothing is inferred.** Officials are listed exactly as the ledger lists them. Promises are never tied to an instrument by guesswork. Radar leads appear only as machine hints.
- **Standards.** Where a public standard defines the same relation, it is named, for example `schema:legislationPassedBy` and `eli:passed_by`. The Instruments page publishes schema.org `Legislation` records built from the same data.
- **Open data.** The full graph is published at [/ontology.json](https://monsoonledger.vercel.app/ontology.json).

The fusion logic is one pure module, `scripts/ontology.mjs`. The validator and the site both use it, so they always see the same graph.

## Automatic monitoring (the Radar)

Every Monday and Thursday at 06:17 WIB a GitHub Actions workflow runs `npm run scan`. It reads Indonesian and ASEAN news searches and official legal databases, and keeps headlines that score above a keyword threshold. It drops anything already seen or already in the ledger, and writes new leads to `data/radar.yml`. The site shows them on the Radar as unreviewed leads.

The scanner only ever writes `data/radar.yml`, `data/scan-log.yml` and `data/watch/seen.json`. It never creates or edits entries, instruments, deadlines or ontology links. A lead becomes an entry only after the author reads the source.

If the repository has an `ANTHROPIC_API_KEY` secret, the scanner also asks Claude for a second opinion on each new headline. The answer comes back as structured output and is checked before use. Without the key it runs on keyword rules alone. Claude's summaries restate headlines and are labelled as machine summaries on the site.

## Visual layer and motion

The site is a static Astro build with small vanilla scripts. There is no client framework, no tracker and no external font. The interactive pieces are:

- the home weather map, where each marker is a deadline linked to its ledger row;
- the live clock, the replay slider and the entries overview;
- the ontology explorer, the scan history chart and the next-scan countdown;
- a right-hand rail on long pages, with reading progress, the current section and a page visual;
- counting figures and slowly drifting isobars behind every page header.

Every figure comes from the data files. Animations pause when off screen or in a background tab, and stop entirely for readers who ask their system for reduced motion.

## Links, icons and previews

The site ships an ICO and SVG favicon, an Apple touch icon, a web manifest and 1200 by 630 preview cards in English and Bahasa Indonesia. Large-image Open Graph and Twitter tags are on every page, including the root address people usually paste into chat apps, so a shared link shows the card and not a blank box. Tab titles are the page name followed by "Monsoon Ledger". `scripts/make-share-images.mjs` regenerates the images.

## Quality gates

Every push and pull request runs, in this order:

1. `npm test`: scanner tests on synthetic fixtures and ontology tests.
2. `npm run validate`: the entry schema plus the rules a schema cannot express. These cover ids and file names, instruments that exist, quote rules, deadline fields, the radar and scan log, ontology links and their sources, the build log, and a ban on em and en dashes anywhere in the project.
3. `npm run build`: the site build, which runs the validator again first and fails if it fails.

## Build log

Every change the author asks for gets a row in `data/build-log.yml`, including fixes, reverts and rollbacks. The rows appear under "Build so far" on the [Technical system](https://monsoonledger.vercel.app/en/method/system/#build) page, each with its pull request and commits. The validator checks that rows are dated, in order, of a known kind and linked to real commit hashes.

## Working on the ledger

One-time setup, with Node 22.23.4 or newer:

```sh
npm run setup
```

Adding an entry (weekly):

```sh
npm run new-entry -- --slug id-example-topic   # creates data/entries/<today>-id-example-topic.yml
# fill in every field in the new file
npm run validate                               # must pass
git add data && git commit -m "Add entry: example topic" && git push
```

Other routine work:

- **A deadline changes outcome.** Edit `data/deadlines.yml`, keep it newest first, and add a dated line to `CHANGELOG.md`.
- **Reviewing a radar lead.** Set its `status` to `reviewed`, `dismissed` or `promoted`. For `promoted`, also set `promoted_to: <entry id>`, and only after writing a full entry from the source.
- **Adding an ontology link.** Add a row to `data/ontology.yml` with `from`, `rel`, `to`, `evidence` and a `source_url` the ledger already cites.
- **Any change to the site.** Add a row to `data/build-log.yml`.

Useful commands:

```sh
npm run dev                               # local preview
npm test                                  # scanner and ontology tests
npm run scan -- --dry-run --no-claude     # live scan, writes nothing
npm run links                             # reports sources that stopped responding (informational)
```

Pushing to `main` rebuilds the site on Vercel.

## Project layout

```
data/
  entries/            one YAML file per entry (the ledger itself)
  schema.json         entry schema (JSON Schema 2020-12)
  instruments.yml     laws, drafts and guidance, with dossier fields
  deadlines.yml       the Janji vs Kenyataan ledger, newest first
  ontology.yml        institutions and curated, sourced links
  build-log.yml       every change asked for, newest first
  radar.yml           unreviewed leads written by the scanner
  scan-log.yml        one row per scan
  watch/              what the scanner reads (sources.yml), how it scores (keywords.yml), what it has seen
scripts/
  validate.mjs        schema and project rules, run before every build
  ontology.mjs        the fusion layer shared by the validator and the site
  scan.mjs, scan/     the monitoring layer and its tests
  new-entry.mjs       creates a dated entry from a template
  check-links.mjs     reports dead source links
  make-share-images.mjs  icons and link preview cards
site/                 the Astro static site (pages, components, styles, public assets)
writing/              longer analysis (analysis/ in English, analisis/ in Bahasa Indonesia)
.github/workflows/    ci.yml (tests, validation, build) and scan.yml (the scheduled scan)
```

## Corrections

Anyone can [open an issue](https://github.com/SteveBehren/monsoon-ledger/issues) with a source. Errors are fixed in the open and logged with a date in [CHANGELOG.md](CHANGELOG.md).

## How AI is used here

I research the sources, write and edit every entry and every My take myself, and set every evidence level. Claude Code, Anthropic's coding agent, writes the code and configuration and drafts text and translations for me to review. It also checks URLs and legal citations before they are used, and runs the tests, the validator and the build before every push. The rules it works under are in [CLAUDE.md](CLAUDE.md): never invent facts, quotes, dates or URLs, leave a marked TODO instead, never rewrite the author's words, and pass the validator. Every source is linked so you can check it yourself.

## Licence

Code: MIT, see [LICENSE](LICENSE). Data and writing: CC BY 4.0, see [LICENSE-CONTENT.md](LICENSE-CONTENT.md).

---

**Dalam bahasa Indonesia.** Monsoon Ledger adalah pelacak publik dalam dua bahasa tentang cara Indonesia mengatur kecerdasan artifisial. Setiap catatan bersandar pada sumber primer atau resmi, diberi label seberapa kuat buktinya, lalu dibandingkan dengan EU AI Act dan praktik keselamatan AI terdepan. Bagian Janji vs Kenyataan mencatat setiap tenggat yang pernah diumumkan pejabat dan apa yang benar-benar terjadi. Lapisan ontologi menghubungkan catatan, instrumen, janji, pejabat, lembaga, dan dokumen dalam satu grafik, dan Radar memantau berita dua kali seminggu tanpa pernah menulis catatan sendiri. Setiap perubahan pada situs dicatat di log pembangunan. Kalau Anda menemukan kesalahan, silakan buka issue dengan menyertakan sumbernya.
