import type { APIRoute } from 'astro';
import { getOntology, OBJECT_TYPES, RELATIONS } from '../lib/ontology';
import { SITE } from '../lib/i18n';

// The whole graph as open data, the same objects and links the explorer draws.
export const GET: APIRoute = () => {
  const { nodes, links } = getOntology();
  const body = {
    name: `${SITE.name} ontology`,
    url: `${SITE.url}/en/ontology/`,
    licence: 'Data CC BY 4.0, see the repository',
    repository: SITE.repo,
    object_types: OBJECT_TYPES,
    relation_types: RELATIONS,
    objects: nodes.map(({ degree, ...n }) => ({ ...n, href: n.href ? `${SITE.url}/en/${n.href}` : undefined })),
    links,
  };
  return new Response(JSON.stringify(body, null, 1), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
