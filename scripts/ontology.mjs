// The ontology layer: fuses entries, instruments, promises, people, institutions, documents,
// outlets, bibliography references and radar leads into one graph of typed objects and links.
//
// Pure functions only. scripts/validate.mjs uses this to reject broken links, and the site
// uses the same code to draw /ontology/ and publish /ontology.json, so both always agree.
// Nothing here adds a fact: every object and link comes from a data file, and every curated
// link in data/ontology.yml carries a source the ledger already cites.

import { slug, splitWho, promiseId, promiseKey, computePromise, todayWIB } from './promises.mjs';

/** Object types, in the order the explorer lists them. */
export const OBJECT_TYPES = {
  instrument: { en: 'Instrument', id: 'Instrumen' },
  entry: { en: 'Entry', id: 'Catatan' },
  promise: { en: 'Promise', id: 'Janji' },
  person: { en: 'Official', id: 'Pejabat' },
  institution: { en: 'Institution', id: 'Lembaga' },
  document: { en: 'Document', id: 'Dokumen' },
  outlet: { en: 'Outlet', id: 'Media' },
  reference: { en: 'Reference', id: 'Rujukan' },
  lead: { en: 'Radar lead', id: 'Petunjuk Radar' },
};

// Relation types. "basis" says where a link comes from: "data" (read straight from a data
// file), "curated" (data/ontology.yml, a human reading of a cited source) or "machine" (a
// scanner hint, unreviewed). "standard" names the equivalent schema.org and ELI property where
// one exists.
export const RELATIONS = {
  concerns: { from: ['entry'], to: ['instrument'], basis: 'data', en: 'concerns', id: 'tentang' },
  cites: { from: ['entry'], to: ['document'], basis: 'data', en: 'cites', id: 'mengutip' },
  evidenced_by: { from: ['promise'], to: ['document'], basis: 'data', en: 'is on record in', id: 'tercatat di' },
  made: { from: ['person'], to: ['promise'], basis: 'data', en: 'made', id: 'menyampaikan' },
  published_by: { from: ['document'], to: ['outlet'], basis: 'data', en: 'published by', id: 'diterbitkan oleh' },
  sourced_from: { from: ['instrument'], to: ['document'], basis: 'data', en: 'sourced from', id: 'bersumber dari' },
  compared_with: { from: ['instrument'], to: ['reference'], basis: 'data', en: 'compared with', id: 'dibandingkan dengan' },
  ranked_under: { from: ['instrument'], to: ['reference'], basis: 'data', en: 'ranked under', id: 'berkedudukan menurut' },
  documented_in: { from: ['instrument'], to: ['reference'], basis: 'data', en: 'documented in', id: 'didokumentasikan dalam' },
  member_of: { from: ['person'], to: ['institution'], basis: 'curated', en: 'speaks for', id: 'mewakili' },
  passed_by: {
    from: ['instrument'],
    to: ['institution'],
    basis: 'curated',
    en: 'passed by',
    id: 'ditetapkan oleh',
    standard: 'schema:legislationPassedBy, eli:passed_by',
  },
  responsibility_of: {
    from: ['instrument'],
    to: ['institution'],
    basis: 'curated',
    en: 'drafted by',
    id: 'disusun oleh',
    standard: 'schema:legislationResponsible, eli:responsibility_of',
  },
  awaits_signature_of: { from: ['instrument'], to: ['institution'], basis: 'curated', en: 'awaits signature of', id: 'menunggu tanda tangan' },
  implements: {
    from: ['instrument'],
    to: ['instrument'],
    basis: 'curated',
    en: 'implements',
    id: 'melaksanakan',
    standard: 'schema:legislationEnsuresImplementationOf, eli:ensures_implementation_of',
  },
  led_by: { from: ['instrument'], to: ['institution'], basis: 'curated', en: 'led by', id: 'dipimpin oleh' },
  may_concern: { from: ['lead'], to: ['instrument'], basis: 'machine', en: 'may concern', id: 'mungkin terkait' },
};

export const EVIDENCE = ['legal-text', 'official-statement', 'press-report'];

// Promise ids and name handling live in promises.mjs, shared with the validator and the site.
export { slug, splitWho, promiseId, promiseAnchor, promiseKey } from './promises.mjs';

function hostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Builds the graph.
 * @param {object} data { entries, instruments, deadlines, ontology, leads?, references?, today? }
 *   references maps bibliography keys to { text, url }. Without it, reference objects carry
 *   only their key (the validator works that way).
 * @returns {{ nodes: object[], links: object[], problems: string[] }}
 */
export function buildOntology({ entries, instruments, deadlines, ontology, leads = [], references = null, today = todayWIB() }) {
  const nodes = new Map();
  const links = [];
  const problems = [];
  const seenLinks = new Set();

  const addNode = (node) => {
    if (!nodes.has(node.id)) nodes.set(node.id, { ...node, degree: 0 });
    return nodes.get(node.id);
  };
  const addLink = (from, rel, to, extra = {}) => {
    const key = `${from}|${rel}|${to}`;
    if (seenLinks.has(key)) return false;
    seenLinks.add(key);
    links.push({ from, rel, to, basis: RELATIONS[rel].basis, ...extra });
    return true;
  };

  // Documents are keyed by url. Titles and outlets come from entry sources where they exist.
  const docTitles = new Map();
  for (const e of entries) for (const s of e.sources ?? []) if (!docTitles.has(s.url)) docTitles.set(s.url, s);
  const documentId = (url) => `document:${url}`;
  const addDocument = (url) => {
    const s = docTitles.get(url);
    const node = addNode({
      id: documentId(url),
      type: 'document',
      label: { en: s?.title ?? hostLabel(url), id: s?.title ?? hostLabel(url) },
      url,
      props: { host: hostLabel(url), ...(s ? { language: s.language } : {}) },
    });
    if (s?.outlet) {
      const outletId = `outlet:${slug(s.outlet)}`;
      addNode({ id: outletId, type: 'outlet', label: { en: s.outlet, id: s.outlet }, props: {} });
      addLink(node.id, 'published_by', outletId);
    }
    return node.id;
  };

  for (const inst of ontology?.institutions ?? []) {
    addNode({
      id: `institution:${inst.id}`,
      type: 'institution',
      label: { en: inst.name_en, id: inst.name_id },
      props: { country: inst.country },
    });
  }
  const aliasToInstitution = new Map();
  for (const inst of ontology?.institutions ?? []) for (const a of inst.aliases ?? []) aliasToInstitution.set(a.toLowerCase(), inst.id);

  for (const i of instruments) {
    addNode({
      id: `instrument:${i.id}`,
      type: 'instrument',
      label: { en: i.name_en, id: i.name_id },
      href: `instruments/#${i.id}`,
      props: {
        status: i.status,
        binding: i.binding,
        type: i.type,
        ...(i.issued !== undefined ? { issued: String(i.issued) } : {}),
        read_in_full: Boolean(i.read_in_full),
      },
    });
    if (i.source_url) addLink(`instrument:${i.id}`, 'sourced_from', addDocument(i.source_url));
  }

  // Bibliography references, classified by data/ontology.yml.
  const comparedWith = new Set(ontology?.references?.compared_with ?? []);
  const rankedUnder = new Set(ontology?.references?.ranked_under ?? []);
  for (const i of instruments) {
    for (const key of i.refs ?? []) {
      const ref = references?.[key];
      if (references && !ref) problems.push(`instrument "${i.id}" refers to unknown reference "${key}"`);
      const id = `reference:${key}`;
      addNode({ id, type: 'reference', label: { en: ref?.text ?? key, id: ref?.text ?? key }, url: ref?.url, props: { key } });
      const rel = comparedWith.has(key) ? 'compared_with' : rankedUnder.has(key) ? 'ranked_under' : 'documented_in';
      addLink(`instrument:${i.id}`, rel, id, ref?.url ? { source_url: ref.url } : {});
    }
  }

  for (const e of entries) {
    addNode({
      id: `entry:${e.id}`,
      type: 'entry',
      label: { en: e.title_en, id: e.title_id },
      href: `entries/${e.id}/`,
      props: { date: e.date, status: e.status, evidence: e.evidence },
    });
    addLink(`entry:${e.id}`, 'concerns', `instrument:${e.instrument}`);
    for (const s of e.sources ?? []) addLink(`entry:${e.id}`, 'cites', addDocument(s.url));
  }

  for (const d of deadlines) {
    const pid = promiseId(d);
    const { name, affiliation } = splitWho(d.who);
    addNode({
      id: pid,
      type: 'promise',
      label: { en: d.promised_en, id: d.promised_id },
      href: `promises/${promiseKey(d)}/`,
      props: {
        date_said: d.date_said,
        claim_type: d.claim_type,
        ...(d.deadline ? { deadline: d.deadline } : {}),
        outcome: computePromise(d, today).outcome,
        said_by: d.who,
      },
    });
    addLink(pid, 'evidenced_by', addDocument(d.source_url));
    const person = `person:${slug(name)}`;
    addNode({ id: person, type: 'person', label: { en: name, id: name }, props: { as_listed: affiliation } });
    addLink(person, 'made', pid, { source_url: d.source_url });
    const inst = aliasToInstitution.get(affiliation.toLowerCase());
    if (inst) addLink(person, 'member_of', `institution:${inst}`, { basis: 'data', source_url: d.source_url });
  }

  for (const lead of leads) {
    if (!lead.instrument || lead.status === 'dismissed') continue;
    addNode({
      id: `lead:${lead.id}`,
      type: 'lead',
      label: { en: lead.title, id: lead.title },
      url: lead.url,
      href: 'radar/',
      props: { found: lead.found, status: lead.status, country: lead.country },
    });
    addLink(`lead:${lead.id}`, 'may_concern', `instrument:${lead.instrument}`, { source_url: lead.url });
  }

  // Curated relations last, so they can point at anything derived above.
  (ontology?.relations ?? []).forEach((r, n) => {
    const where = `relation ${n + 1} (${r?.from} ${r?.rel} ${r?.to})`;
    const def = RELATIONS[r?.rel];
    if (!def) return problems.push(`${where}: unknown relation type "${r?.rel}"`);
    if (def.basis !== 'curated') return problems.push(`${where}: "${r.rel}" is derived from the data and cannot be curated`);
    const from = nodes.get(r.from);
    const to = nodes.get(r.to);
    if (!from) return problems.push(`${where}: "${r.from}" does not exist`);
    if (!to) return problems.push(`${where}: "${r.to}" does not exist`);
    if (!def.from.includes(from.type)) problems.push(`${where}: "${r.rel}" cannot start from a ${from.type}`);
    if (!def.to.includes(to.type)) problems.push(`${where}: "${r.rel}" cannot point to a ${to.type}`);
    if (!/^https?:\/\/\S+$/.test(r.source_url ?? '')) problems.push(`${where}: needs a source_url`);
    if (!EVIDENCE.includes(r.evidence)) problems.push(`${where}: evidence must be ${EVIDENCE.join(', ')}`);
    if (!addLink(r.from, r.rel, r.to, { source_url: r.source_url, evidence: r.evidence })) problems.push(`${where}: duplicate`);
  });

  for (const l of links) {
    const a = nodes.get(l.from);
    const b = nodes.get(l.to);
    if (!a || !b) {
      problems.push(`link ${l.from} ${l.rel} ${l.to} points at a missing object`);
      continue;
    }
    a.degree += 1;
    b.degree += 1;
  }

  return { nodes: [...nodes.values()], links: links.filter((l) => nodes.has(l.from) && nodes.has(l.to)), problems };
}
