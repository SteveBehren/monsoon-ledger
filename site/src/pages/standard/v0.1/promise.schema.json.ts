// Serves the promise format's JSON Schema at the address in its own $id, from the one copy in
// docs/standard/v0.1/, so the published schema and the validator's schema are the same file.
import fs from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';

export const GET: APIRoute = () =>
  new Response(fs.readFileSync(path.resolve(process.cwd(), '..', 'docs', 'standard', 'v0.1', 'promise.schema.json'), 'utf8'), {
    headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
  });
