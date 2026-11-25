/**
 * Loads the Top 5 lists, checks them against the reviews and works out what
 * each one shows. A list that fails a check stops the build. An automatic
 * list still waiting for five qualifying reviews is left out, with a note.
 */
import { getCollection } from 'astro:content';
import { getSite, showDrafts } from './site.ts';
import { viewOf } from './views.ts';
import { fragranceCandidate, top5View, validateTop5, whiskeyCandidate } from './top5.ts';
import type { ListReview, Top5Data, Top5View } from './top5.ts';
import { formatIssues, type Issue, type World } from './validate.ts';

export type ResolvedList = { id: string; data: Top5Data; view: Top5View };

export type Top5Site = {
  /** The lists that have their five, newest first. */
  forWorld: (world: World) => ResolvedList[];
  /** The lists a reviewed bottle is on. */
  containing: (world: World, reviewId: string) => ResolvedList[];
};

let cached: Promise<Top5Site> | undefined;

export function getTop5(): Promise<Top5Site> {
  cached ??= load();
  return cached;
}

async function load(): Promise<Top5Site> {
  const [site, all] = await Promise.all([getSite(), getCollection('top5')]);
  const lists = (showDrafts ? all : all.filter((l) => !l.data.draft)).sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf(),
  );

  const errors: Issue[] = lists.flatMap((l) => validateTop5({ id: l.id, ...l.data }, site.lite, site.hiddenDrafts));
  if (errors.length) {
    throw new Error(`\nCaskScents content problems, fix these to build:\n${formatIssues(errors)}\n`);
  }

  const reviews: Record<World, ListReview[]> = {
    whiskey: site.whiskeys.map((e) => ({ id: e.id, view: viewOf(e), candidate: whiskeyCandidate(e.id, e.data) })),
    fragrance: site.fragrances.map((e) => ({ id: e.id, view: viewOf(e), candidate: fragranceCandidate(e.id, e.data) })),
  };

  const resolved: ResolvedList[] = [];
  const waiting: string[] = [];
  for (const list of lists) {
    const result = top5View(list.data, reviews[list.data.category]);
    if ('view' in result) {
      resolved.push({ id: list.id, data: list.data, view: result.view });
    } else {
      const have = 5 - result.waiting;
      waiting.push(
        `  note  top5/${list.id}: "${list.data.title}" has ${have} of 5 qualifying reviews. It will appear when ${result.waiting} more ${result.waiting === 1 ? 'qualifies' : 'qualify'}.`,
      );
    }
  }
  if (waiting.length) console.warn(`\nCaskScents Top 5 lists still waiting:\n${waiting.join('\n')}\n`);

  return {
    forWorld: (world) => resolved.filter((l) => l.data.category === world),
    containing: (world, reviewId) =>
      resolved.filter((l) => l.data.category === world && l.view.rows.some((row) => row.reviewId === reviewId)),
  };
}
