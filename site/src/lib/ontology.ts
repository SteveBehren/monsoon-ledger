// The ontology graph for the site. The fusion logic lives in scripts/ontology.mjs, shared with
// the validator, so the page and npm run validate always see the same objects and links.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
// @ts-ignore: plain JavaScript module shared with the Node scripts.
import { buildOntology, OBJECT_TYPES, RELATIONS, promiseAnchor as anchor, promiseKey as key } from '../../../scripts/ontology.mjs';
import { getDeadlines, getEntries, getInstruments, TODAY, type Deadline } from './data';
import { REFERENCES } from './references';

const DATA = path.resolve(process.cwd(), '..', 'data');

export type ObjectType = keyof typeof OBJECT_TYPES;
export interface OntologyNode {
  id: string;
  type: ObjectType;
  label: { en: string; id: string };
  href?: string;
  url?: string;
  props: Record<string, string | number | boolean>;
  degree: number;
}
export interface OntologyLink {
  from: string;
  rel: keyof typeof RELATIONS;
  to: string;
  basis: 'data' | 'curated' | 'machine';
  source_url?: string;
  evidence?: string;
}

const load = (file: string) => yaml.load(fs.readFileSync(path.join(DATA, file), 'utf8'), { schema: yaml.CORE_SCHEMA }) as any;

export function getOntology(): { nodes: OntologyNode[]; links: OntologyLink[] } {
  const radar = load('radar.yml') ?? {};
  const { nodes, links } = buildOntology({
    entries: getEntries(),
    instruments: getInstruments(),
    deadlines: getDeadlines(),
    ontology: load('ontology.yml'),
    leads: radar.leads ?? [],
    references: REFERENCES,
    today: TODAY,
  });
  return { nodes, links };
}

export const promiseAnchor = (d: Deadline): string => anchor(d);
/** The receipt path segment, shared with the ontology id: promises/<key>/. */
export const promiseKey = (d: Deadline): string => key(d);
export { OBJECT_TYPES, RELATIONS };
