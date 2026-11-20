/** Turns a rundown and its reviews into exactly what the rundown page shows. */
import type { ReviewView } from './review-view.ts';
import type { World } from './validate.ts';

export type RundownData = {
  title: string;
  summary: string;
  category: World;
  items: string[];
  picks: { useCase: string; winner: string; why: string }[];
  noteOverrides?: Record<string, Record<string, string>>;
  readMinutes?: number;
};

export type RundownItem = { id: string; view: ReviewView };

export type Cell = { id: string; name: string; short: string; score: string; note: string; best: boolean };

export type RundownView = {
  world: World;
  title: string;
  summary: string;
  meta: string[];
  bottles: { id: string; name: string; short: string; image?: string; overall: string }[];
  picks: { useCase: string; winnerId: string; winner: string; why: string; lead: boolean }[];
  facts: { label: string; values: string[] }[];
  attributes: { key: string; label: string; cells: Cell[]; ranked: Cell[]; top: string }[];
  overall: { id: string; score: string; best: boolean }[];
  profile: { title: string; groups: { label: string; rows: { short: string; percent: number }[] }[] };
};

const MAX_PROFILE_GROUPS = 5;

function listNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function rundownView(data: RundownData, items: RundownItem[]): RundownView {
  const brandCount = new Map<string, number>();
  for (const { view } of items) brandCount.set(view.brand, (brandCount.get(view.brand) ?? 0) + 1);

  const shortOf = (view: ReviewView): string => {
    if (view.shortName) return view.shortName;
    const uniqueBrand = brandCount.get(view.brand) === 1;
    return view.world === 'whiskey' && uniqueBrand ? view.brand : view.name;
  };

  const bottles = items.map(({ id, view }) => ({
    id,
    name: view.name,
    short: shortOf(view),
    image: view.image,
    overall: view.overall,
  }));
  const byId = new Map(bottles.map((b) => [b.id, b]));

  const groups = new Set(items.map((i) => i.view.group));
  const sharedGroup = groups.size === 1 ? [...groups][0] : '';

  const attributes = items[0].view.scores.map((line, index) => {
    const values = items.map((i) => i.view.scores[index].percent);
    const max = Math.max(...values);
    const cells: Cell[] = items.map(({ id, view }) => {
      const score = view.scores[index];
      return {
        id,
        name: view.name,
        short: byId.get(id)!.short,
        score: score.score,
        note: data.noteOverrides?.[id]?.[line.key] ?? score.note,
        best: score.percent === max,
      };
    });
    const ranked = [...cells].sort((x, y) => Number(y.score) - Number(x.score));
    const leaders = cells.filter((c) => c.best);
    return {
      key: line.key,
      label: line.label,
      cells,
      ranked,
      top: `${listNames(leaders.map((c) => c.name))}, ${leaders[0].score}`,
    };
  });

  const overallMax = Math.max(...items.map((i) => Number(i.view.overall)));
  const overall = items.map(({ id, view }) => ({
    id,
    score: view.overall,
    best: Number(view.overall) === overallMax,
  }));

  const facts = items[0].view.compareFacts.map((fact, index) => ({
    label: fact.label,
    values: items.map((i) => i.view.compareFacts[index].value),
  }));

  const strongest = new Map<string, number>();
  for (const { view } of items) {
    for (const bar of view.bars.items) {
      strongest.set(bar.label, Math.max(strongest.get(bar.label) ?? 0, bar.percent));
    }
  }
  const profileGroups = [...strongest.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, MAX_PROFILE_GROUPS)
    .map(([label]) => ({
      label,
      rows: items.map(({ id, view }) => ({
        short: byId.get(id)!.short,
        percent: view.bars.items.find((b) => b.label === label)?.percent ?? 0,
      })),
    }));

  return {
    world: data.category,
    title: data.title,
    summary: data.summary,
    meta: [
      'Rundown',
      ...(sharedGroup ? [sharedGroup] : []),
      `${items.length} bottles`,
      ...(data.readMinutes ? [`${data.readMinutes} min read`] : []),
    ],
    bottles,
    picks: data.picks.map((pick, index) => ({
      useCase: pick.useCase,
      winnerId: pick.winner,
      winner: byId.get(pick.winner)?.name ?? pick.winner,
      why: pick.why,
      lead: index === 0,
    })),
    facts,
    attributes,
    overall,
    profile: { title: items[0].view.bars.title === 'Main accords' ? 'Accords' : 'Flavor profile', groups: profileGroups },
  };
}
