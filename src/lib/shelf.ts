/**
 * The shelf's filter, sort and search rules. This runs in the browser and is
 * also tested on its own. The page's address holds the state, so a filtered
 * view can be shared and the back button works.
 */
export type ShelfItem = {
  id: string;
  name: string;
  /** Lowercase text to search in: name, maker, notes, tags. */
  search: string;
  score: number;
  price: number;
  date: number;
  facets: Record<string, string[]>;
};

export const SORTS = ['newest', 'score', 'price', 'name'] as const;
export type SortKey = (typeof SORTS)[number];
export const DEFAULT_SORT: SortKey = 'newest';

export type ShelfState = { q: string; sort: SortKey; filters: Record<string, string> };

/** Reads a state from an address query such as "?region=Islay&sort=score". */
export function parseState(query: string, params: readonly string[]): ShelfState {
  const search = new URLSearchParams(query);
  const sort = search.get('sort') as SortKey | null;
  const filters: Record<string, string> = {};
  for (const param of params) {
    const value = search.get(param);
    if (value) filters[param] = value;
  }
  return {
    q: (search.get('q') ?? '').trim(),
    sort: sort && SORTS.includes(sort) ? sort : DEFAULT_SORT,
    filters,
  };
}

/** Writes a state back as an address query, leaving out anything at its default. */
export function toQuery(state: ShelfState): string {
  const search = new URLSearchParams();
  if (state.q) search.set('q', state.q);
  for (const [param, value] of Object.entries(state.filters)) {
    if (value) search.set(param, value);
  }
  if (state.sort !== DEFAULT_SORT) search.set('sort', state.sort);
  const text = search.toString();
  return text ? `?${text}` : '';
}

const ORDER: Record<SortKey, (a: ShelfItem, b: ShelfItem) => number> = {
  newest: (a, b) => b.date - a.date,
  score: (a, b) => b.score - a.score,
  price: (a, b) => a.price - b.price,
  name: (a, b) => a.name.localeCompare(b.name),
};

/** The ids that match, in the order they should be shown. */
export function applyShelf(items: readonly ShelfItem[], state: ShelfState): string[] {
  const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  const wanted = Object.entries(state.filters).filter(([, value]) => value);
  return items
    .filter((item) => wanted.every(([param, value]) => item.facets[param]?.includes(value)))
    .filter((item) => words.every((word) => item.search.includes(word)))
    .sort((a, b) => ORDER[state.sort](a, b) || a.name.localeCompare(b.name))
    .map((item) => item.id);
}
