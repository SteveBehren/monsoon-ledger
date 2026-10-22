// Shared helpers for the scripts in this folder.
// Dependencies (ajv, js-yaml) are installed in site/node_modules, so they are
// resolved from there. That keeps one package-lock.json for the whole project.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA = path.join(ROOT, 'data');
export const ENTRIES = path.join(DATA, 'entries');

const requireFromSite = createRequire(path.join(ROOT, 'site', 'package.json'));

export function siteRequire(name) {
  try {
    return requireFromSite(name);
  } catch {
    console.error(`Missing dependency "${name}". Run "npm run setup" in the project root first.`);
    process.exit(1);
  }
}

// CORE_SCHEMA keeps dates such as 2026-10-21 as plain strings instead of
// turning them into Date objects.
export function readYaml(file) {
  const yaml = siteRequire('js-yaml');
  return yaml.load(fs.readFileSync(file, 'utf8'), { schema: yaml.CORE_SCHEMA });
}

export function entryFiles() {
  return fs
    .readdirSync(ENTRIES)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .sort();
}

export function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
