# Security

Monsoon Ledger is a static website built from files in this repository. It has no user accounts, no database and no server code at run time.

## What to report

- A way to change what the site shows without a commit to this repository.
- A secret, token or credential committed to the repository.
- A problem in the scheduled workflows (`.github/workflows/`) that could let someone else push to the repository or run code with its permissions.
- A dependency with a known vulnerability that affects the build.

## How to report

Please do not open a public issue for a security problem. Use GitHub's private vulnerability reporting on this repository (the "Report a vulnerability" button under the Security tab), once it is switched on. Until then, contact the maintainer, [@SteveBehren](https://github.com/SteveBehren), through GitHub and ask for a private channel.

You will get a reply when the report has been read. Fixes are logged in `CHANGELOG.md` and `data/build-log.yml` once they are public.

## Not security problems

Factual errors, wrong sources and outdated pages are corrections. Please use the [correction form](https://github.com/SteveBehren/monsoon-ledger/issues/new?template=correction.yml).
