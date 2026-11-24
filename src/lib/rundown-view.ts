/** Turns a rundown and its reviews into exactly what the rundown page shows. */
import type { ReviewView, ScoreLine } from './review-view.ts';
import { attributesFor, type World } from './validate.ts';

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
export type ValueCell = { id: string; name: string; short: string; note: string };

/** Shown where a bottle has no score for something, because it was reviewed from a sample. */
const NO_SCORE = '–';
const NO_SCORE_NOTE = 'Reviewed from a sample, so this is not scored.';

export type RundownView = {
  world: World;
  title: string;
  summary: string;
  meta: string[];
  bottles: { id: string; name: string; short: string; image?: string; overall: string }[];
  picks: { useCase: string; winnerId: string; winner: string; why: string; lead: boolean }[];
  facts: { label: string; values: string[] }[];
  attributes: { key: string; label: string; cells: Cell[]; ranked: Cell[]; top: string }[];
  /** Each bottle's value note, in words. Left out when no bottle has one. Never scored. */
  value?: ValueCell[];
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

  // One row per score. A bottle without that score (a sample has no bottle score)
  // gets a dash, and a row nobody has a score for is left out.
  const attributes = attributesFor(data.category).flatMap((key) => {
    const lines = items.map((i) => i.view.scores.find((s) => s.key === key));
    const rated = lines.filter((line): line is ScoreLine => line !== undefined);
    if (rated.length === 0) return [];
    const max = Math.max(...rated.map((line) => line.percent));
    const cells: Cell[] = items.map(({ id, view }, index) => {
      const line = lines[index];
      return {
        id,
        name: view.name,
        short: byId.get(id)!.short,
        score: line ? line.score : NO_SCORE,
        note: line ? (data.noteOverrides?.[id]?.[key] ?? line.note) : NO_SCORE_NOTE,
        best: line ? line.percent === max : false,
      };
    });
    const rank = (cell: Cell) => (cell.score === NO_SCORE ? -1 : Number(cell.score));
    const ranked = [...cells].sort((x, y) => rank(y) - rank(x));
    const leaders = cells.filter((c) => c.best);
    return [
      {
        key,
        label: rated[0].label,
        cells,
        ranked,
        top: `${listNames(leaders.map((c) => c.name))}, ${leaders[0].score}`,
      },
    ];
  });

  const valueCells: ValueCell[] = items.map(({ id, view }) => ({
    id,
    name: view.name,
    short: byId.get(id)!.short,
    note: data.noteOverrides?.[id]?.value ?? view.value ?? '',
  }));
  const value = valueCells.some((cell) => cell.note) ? valueCells : undefined;

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

  // Only compare a flavor or accord that at least two of the bottles have.
  const strongest = new Map<string, number>();
  const holders = new Map<string, number>();
  for (const { view } of items) {
    for (const bar of view.bars.items) {
      strongest.set(bar.label, Math.max(strongest.get(bar.label) ?? 0, bar.percent));
      holders.set(bar.label, (holders.get(bar.label) ?? 0) + 1);
    }
  }
  const profileGroups = [...strongest.entries()]
    .filter(([label]) => (holders.get(label) ?? 0) >= 2)
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
    value,
    overall,
    profile: { title: items[0].view.bars.title === 'Main accords' ? 'Accords' : 'Flavor profile', groups: profileGroups },
  };
}
