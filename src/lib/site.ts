/**
 * The one place pages get their content from. It hides drafts where they
 * should be hidden, sorts everything newest first, and runs the checks that
 * span several files, stopping the build if any of them fail.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { hasText } from './meta.ts';
import {
  draftConflicts,
  formatIssues,
  validateReview,
  validateRundown,
  type Issue,
  type ReviewLite,
  type World,
} from './validate.ts';

export type Whiskey = CollectionEntry<'whiskeys'>;
export type Fragrance = CollectionEntry<'fragrances'>;
export type Rundown = CollectionEntry<'rundowns'>;
export type Review = Whiskey | Fragrance;

/** Drafts show while developing, and on a preview deploy that asks for them. */
export const showDrafts: boolean =
  import.meta.env.DEV || import.meta.env.PUBLIC_SHOW_DRAFTS === 'true';

/** The About page, once it has text. Until then there is no page and no link to it. */
export async function aboutPage(): Promise<CollectionEntry<'pages'> | undefined> {
  const entry = await getEntry('pages', 'about');
  return entry && hasText(entry.body) ? entry : undefined;
}

export type Site = {
  whiskeys: Whiskey[];
  fragrances: Fragrance[];
  rundowns: Rundown[];
  reviews: (world: World) => Review[];
  review: (world: World, id: string) => Review | undefined;
  rundownsFor: (world: World) => Rundown[];
  rundownsContaining: (world: World, id: string) => Rundown[];
};

let cached: Promise<Site> | undefined;

export function getSite(): Promise<Site> {
  cached ??= load();
  return cached;
}

const newest = <T>(date: (item: T) => Date) => (a: T, b: T) =>
  date(b).valueOf() - date(a).valueOf();

async function load(): Promise<Site> {
  const [allWhiskeys, allFragrances, allRundowns] = await Promise.all([
    getCollection('whiskeys'),
    getCollection('fragrances'),
    getCollection('rundowns'),
  ]);

  const visible = <T extends { data: { draft: boolean } }>(entries: T[]) =>
    showDrafts ? entries : entries.filter((e) => !e.data.draft);

  const whiskeys = visible(allWhiskeys).sort(newest((w) => w.data.reviewedDate));
  const fragrances = visible(allFragrances).sort(newest((f) => f.data.reviewedDate));
  const rundowns = visible(allRundowns).sort(newest((r) => r.data.publishDate));

  const lite = (world: World, e: Review): ReviewLite => ({
    id: e.id,
    world,
    name: e.data.name,
    ratings: e.data.ratings,
  });
  const liteReviews = new Map<string, ReviewLite>();
  for (const w of whiskeys) liteReviews.set(w.id, lite('whiskey', w));
  for (const f of fragrances) {
    if (liteReviews.has(f.id)) {
      throw new Error(
        `Two reviews share the file name "${f.id}" (one whiskey, one fragrance). Rename one of them.`,
      );
    }
    liteReviews.set(f.id, lite('fragrance', f));
  }

  const hiddenDrafts = new Set<string>(
    showDrafts ? [] : [...allWhiskeys, ...allFragrances].filter((e) => e.data.draft).map((e) => e.id),
  );

  const issues: Issue[] = [];
  for (const r of liteReviews.values()) issues.push(...validateReview(r));
  for (const r of rundowns) {
    const rundown = { id: r.id, ...r.data };
    const drafts = draftConflicts(rundown, hiddenDrafts);
    issues.push(...drafts);
    if (drafts.length === 0) issues.push(...validateRundown(rundown, liteReviews));
  }

  const warnings = issues.filter((i) => i.level === 'warning');
  const errors = issues.filter((i) => i.level === 'error');
  if (warnings.length) console.warn(`\nCaskScents content notes:\n${formatIssues(warnings)}\n`);
  if (errors.length) {
    throw new Error(`\nCaskScents content problems, fix these to build:\n${formatIssues(errors)}\n`);
  }

  const reviews = (world: World): Review[] => (world === 'whiskey' ? whiskeys : fragrances);

  return {
    whiskeys,
    fragrances,
    rundowns,
    reviews,
    review: (world, id) => reviews(world).find((r) => r.id === id),
    rundownsFor: (world) => rundowns.filter((r) => r.data.category === world),
    rundownsContaining: (world, id) =>
      rundowns.filter((r) => r.data.category === world && r.data.items.includes(id)),
  };
}
