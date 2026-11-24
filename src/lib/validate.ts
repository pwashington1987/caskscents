/**
 * Checks that span more than one file, which the per-file schema cannot do.
 * Errors stop the build. Warnings are printed and the build continues.
 */
import { closest } from './vocab.ts';
import { roundScore, subscoreMean } from './derive.ts';

export type World = 'whiskey' | 'fragrance';

export type Issue = { level: 'error' | 'warning'; where: string; message: string };

export type ReviewLite = {
  id: string;
  world: World;
  name: string;
  ratings: { overall: number } & Record<string, number | undefined>;
};

export type RundownLite = {
  id: string;
  category: World;
  items: string[];
  picks: { useCase: string; winner: string; why: string }[];
  noteOverrides?: Record<string, Record<string, string>>;
};

const ATTRIBUTES: Record<World, string[]> = {
  whiskey: ['nose', 'palate', 'finish'],
  fragrance: ['scent', 'longevity', 'sillage', 'bottle'],
};
/** Notes a rundown may reword: one per score, plus the value note (which is words only). */
const notesFor = (world: World) => [...ATTRIBUTES[world], 'value'];

export function attributesFor(world: World): string[] {
  return ATTRIBUTES[world];
}

const folder = (world: World) => (world === 'whiskey' ? 'whiskeys' : 'fragrances');

export function validateReview(review: ReviewLite): Issue[] {
  const mean = subscoreMean(review.ratings);
  const gap = Math.abs(review.ratings.overall - mean);
  if (gap <= 1) return [];
  return [
    {
      level: 'warning',
      where: `${folder(review.world)}/${review.id}`,
      message: `overall ${review.ratings.overall} is ${roundScore(gap)} away from the average of its other scores (${roundScore(mean)}). That is allowed, but check it is what you meant.`,
    },
  ];
}

export function validateRundown(
  rundown: RundownLite,
  reviews: ReadonlyMap<string, ReviewLite>,
): Issue[] {
  const issues: Issue[] = [];
  const where = `rundowns/${rundown.id}`;
  const error = (message: string) => issues.push({ level: 'error', where, message });
  const warning = (message: string) => issues.push({ level: 'warning', where, message });

  const sameWorld = [...reviews.values()].filter((r) => r.world === rundown.category);
  const known: ReviewLite[] = [];
  const seen = new Set<string>();

  for (const slug of rundown.items) {
    if (seen.has(slug)) {
      error(`"${slug}" is listed in items more than once.`);
      continue;
    }
    seen.add(slug);
    const review = reviews.get(slug);
    if (!review) {
      const hint = closest(slug, sameWorld.map((r) => r.id));
      error(
        `items lists "${slug}", but there is no ${rundown.category} review with that file name.` +
          (hint ? ` Did you mean "${hint}"?` : ''),
      );
    } else if (review.world !== rundown.category) {
      error(
        `items lists "${slug}", which is a ${review.world} review, but this is a ${rundown.category} rundown.`,
      );
    } else {
      known.push(review);
    }
  }

  for (const pick of rundown.picks) {
    if (!seen.has(pick.winner)) {
      error(
        `the "${pick.useCase}" pick names "${pick.winner}", which is not one of this rundown's items.`,
      );
    }
  }

  const attributes = notesFor(rundown.category);
  for (const [slug, notes] of Object.entries(rundown.noteOverrides ?? {})) {
    if (!seen.has(slug)) {
      error(`noteOverrides has an entry for "${slug}", which is not one of this rundown's items.`);
      continue;
    }
    for (const attribute of Object.keys(notes)) {
      if (!attributes.includes(attribute)) {
        error(
          `noteOverrides for "${slug}" uses "${attribute}". Valid names are: ${attributes.join(', ')}.`,
        );
      }
    }
  }

  const bestOverall = rundown.picks.find((p) => /best overall/i.test(p.useCase));
  const winner = bestOverall && known.find((r) => r.id === bestOverall.winner);
  if (bestOverall && winner) {
    const top = known.reduce((a, b) => (b.ratings.overall > a.ratings.overall ? b : a));
    if (top.ratings.overall > winner.ratings.overall) {
      warning(
        `"${bestOverall.useCase}" goes to ${winner.name} (${winner.ratings.overall}), but ${top.name} has the highest overall score (${top.ratings.overall}). That is allowed, but readers will notice.`,
      );
    }
  }

  return issues;
}

/** A published rundown cannot show a review that is still marked draft. */
export function draftConflicts(rundown: RundownLite, draftIds: ReadonlySet<string>): Issue[] {
  return rundown.items
    .filter((slug) => draftIds.has(slug))
    .map((slug) => ({
      level: 'error' as const,
      where: `rundowns/${rundown.id}`,
      message: `items lists "${slug}", which is still marked draft. Publish that review first, or mark this rundown draft too.`,
    }));
}

/** Turns a list of issues into one readable block for the terminal. */
export function formatIssues(issues: Issue[]): string {
  return issues.map((i) => `  ${i.level === 'error' ? 'ERROR' : 'note'}  ${i.where}: ${i.message}`).join('\n');
}
