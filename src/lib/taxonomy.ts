/** The ways bottles can be browsed and filtered in each world. */
import { slugify } from './slug.ts';
import { tagLabel } from './labels.ts';
import type { World } from './validate.ts';

export type Facet = {
  /** The name used in shelf addresses, such as ?region=Islay. */
  param: string;
  label: string;
  /** Set when each value also gets its own page, such as /whiskey/regions/islay/. */
  page?: string;
  /** True when values are tag slugs that need turning into plain words. */
  isTag?: boolean;
};

export const FACETS: Record<World, Facet[]> = {
  whiskey: [
    { param: 'region', label: 'Region', page: 'regions' },
    { param: 'type', label: 'Type' },
    { param: 'style', label: 'Style', page: 'styles', isTag: true },
  ],
  fragrance: [
    { param: 'house', label: 'House', page: 'houses' },
    { param: 'family', label: 'Family', page: 'families' },
    { param: 'tag', label: 'Tag', isTag: true },
  ],
};

export type Group = { slug: string; label: string; ids: string[] };

/** Every value of one facet with the bottles that have it, biggest group first. */
export function groupBy(
  items: { id: string; facets: Record<string, string[]> }[],
  param: string,
): Group[] {
  const groups = new Map<string, Group>();
  for (const item of items) {
    for (const value of item.facets[param] ?? []) {
      if (!value) continue;
      const group = groups.get(value) ?? { slug: slugify(value), label: value, ids: [] };
      group.ids.push(item.id);
      groups.set(value, group);
    }
  }
  return [...groups.values()].sort(
    (a, b) => b.ids.length - a.ids.length || a.label.localeCompare(b.label),
  );
}

/** How a facet value is shown to readers: tags become plain words. */
export function facetLabel(facet: Facet, value: string): string {
  return facet.isTag ? tagLabel(value) : value;
}

/** The plural heading for a browse page, such as "Regions". */
export function pageTitle(page: string): string {
  return page[0].toUpperCase() + page.slice(1);
}
