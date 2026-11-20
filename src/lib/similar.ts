/** Picks the bottles most like a given one, for "If you like this". */
export type Similarable = { id: string; features: string[]; overall: number };

function overlap(a: Set<string>, b: string[]): number {
  const other = new Set(b);
  let shared = 0;
  for (const f of a) if (other.has(f)) shared++;
  const union = a.size + other.size - shared;
  return union === 0 ? 0 : shared / union;
}

/** Ids of up to `count` bottles sharing the most with `target`. Bottles with nothing in common are left out. */
export function similarTo(target: Similarable, candidates: Similarable[], count = 3): string[] {
  const features = new Set(target.features);
  return candidates
    .filter((c) => c.id !== target.id)
    .map((c) => ({ c, score: overlap(features, c.features) }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.c.overall - x.c.overall || x.c.id.localeCompare(y.c.id))
    .slice(0, count)
    .map((x) => x.c.id);
}
