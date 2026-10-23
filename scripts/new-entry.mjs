// npm run new-entry -- --slug id-example-topic
// Creates data/entries/<today>-<slug>.yml from a commented template.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENTRIES } from './lib.mjs';

const args = process.argv.slice(2);
const slugIndex = args.findIndex((a) => a === '--slug' || a.startsWith('--slug='));
let slug = '';
if (slugIndex !== -1) {
  slug = args[slugIndex].includes('=') ? args[slugIndex].split('=')[1] : args[slugIndex + 1] ?? '';
}

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run new-entry -- --slug id-example-topic');
  console.error('The slug uses lowercase letters, numbers and single hyphens. Start it with the country code, for example id-.');
  process.exit(1);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const id = `${today}-${slug}`;
const file = path.join(ENTRIES, `${id}.yml`);

if (fs.existsSync(file)) {
  console.error(`${path.relative(ROOT, file)} already exists. Pick another slug.`);
  process.exit(1);
}

const template = `# Monsoon Ledger entry. Fill every field, then run: npm run validate
# Rules: every claim needs a source below. No em dashes or en dashes, use commas or full stops.
# Use folded text (>) for anything longer than one line.

# Must equal the file name. If the event happened on another day, change the date
# here, in "date" and in the file name together.
id: ${id}

# Date of the event or statement this entry records (YYYY-MM-DD).
date: ${today}

# ISO country code. Only ID (Indonesia) for now.
country: ID

# Must match an id in data/instruments.yml. Add the instrument there first if it is new.
instrument:

# announced | draft | signed | in-force | withdrawn
status:

# legal-text (I read the instrument itself)
# official-statement (an official said it on the record)
# press-report (journalism or secondary analysis only)
evidence:

title_en: ""
title_id: ""

summary_en: >

ringkasan_id: >

# Optional. One short quote in the original language, under 15 words.
# Each source can be quoted at most once across all entries.
# Delete this whole block if there is no quote.
quote:
  original: ""
  en: ""
  # Must be one of the source urls below.
  source_url: ""
  # Optional: who said it, in each language.
  # attribution_en: ""
  # attribution_id: ""

safety_lens:
  # yes | no | unclear
  incident_reporting:
  unacceptable_uses:
  general_purpose_models:
  # binding | soft | none | unclear
  enforcement:

# Optional note shown under the Safety lens panel. Delete if not needed.
# safety_note_en: >
# safety_note_id: >

# The last date I re-opened and re-checked the sources (YYYY-MM-DD).
last_checked: ${today}

eu_comparison: >

# Optional Bahasa Indonesia version of eu_comparison.
# perbandingan_eu_id: >

# English, first person. My own words.
my_take: >

# Optional Bahasa Indonesia version of my_take.
# pendapat_id: >

# At least one. language is id or en.
sources:
  - title: ""
    url: ""
    outlet: ""
    language: id
`;

fs.writeFileSync(file, template);
console.log(`Created ${path.relative(ROOT, file)}`);
console.log('Next: fill the fields, run "npm run validate", then commit.');
