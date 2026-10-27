# Releasing and archiving

Monsoon Ledger has no DOI yet. This page explains how to get one through Zenodo, so that a
fixed version of the data, the code and the analysis papers can be cited and stays available
even if the site or the repository moves.

## What is already in place

- `CITATION.cff` in the repository root. GitHub reads it and shows a "Cite this repository"
  button on the repository page.
- `.zenodo.json` in the repository root. Zenodo reads it when it archives a GitHub release, and
  uses it for the title, the creator, the licence and the keywords of the record.
- Each analysis paper has its own "Cite this" box on the site, with plain text, APA and BibTeX.

## Steps to get a DOI (done by the repository owner)

1. Sign in to Zenodo (https://zenodo.org) with the GitHub account that owns the repository.
2. In Zenodo, open the GitHub settings page and switch the toggle on for
   `SteveBehren/monsoon-ledger`. Nothing is archived until a release is published.
3. Check `CITATION.cff` and `.zenodo.json`. If you have an ORCID, add it to both:
   in `CITATION.cff` as `orcid:` under the author, and in `.zenodo.json` as `"orcid"` in the
   creator object. Update `date-released` in `CITATION.cff` to the release day.
4. On GitHub, create a release with a version tag, for example `v1.0.0`, and a short note on
   what the release contains (for example "Analysis 01, version 1.0, facts as of 26 October 2026").
5. Zenodo archives the release within a few minutes and mints two DOIs: one for this version and
   one "concept" DOI that always resolves to the latest version.
6. Only after Zenodo shows the record, add the DOI:
   - to `CITATION.cff` as `doi:` (use the concept DOI),
   - to the README, as a badge or a plain line,
   - to the "Cite this" text of the analysis papers, if you want the papers to cite the archive.
   Log the change in `data/build-log.yml` and `CHANGELOG.md`.

## Rules

- Never write a DOI anywhere before Zenodo has issued it. A DOI that does not resolve is worse
  than none.
- A release archives a fixed copy. Corrections after a release go into the next release, and the
  changelog says which version they apply to.
- Keep the licences as they are: code under MIT (`LICENSE`), data and writing under CC BY 4.0
  (`LICENSE-CONTENT.md`).
