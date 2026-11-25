/**
 * Top 5 lists: which reviews qualify for a list, how they are ranked, and
 * what the list page shows. A list is either worked out from scores (it has
 * a `match` rule) or set by hand (it has five `picks`).
 */
import { fragranceView } from './review-view.ts';
import type { FragranceData, ReviewView, WhiskeyData } from './review-view.ts';
import type { Issue, ReviewLite, World } from './validate.ts';
import { closest, vocabMessage } from './vocab.ts';
import { ACCORD_FAMILIES, ACCORD_LABELS } from '../data/accords.ts';
import { AUDIENCES, CONCENTRATIONS, FRAGRANCE_TAGS } from '../data/fragrance.ts';
import { REGION_LABELS, TYPE_LABELS, WHISKEY_TAGS } from '../data/whiskey.ts';

export const LIST_SIZE = 5;
/** An accord counts toward a list only at this weight or more, so a faint trace does not qualify. */
export const ACCORD_WEIGHT = 50;

export type Match = {
  accord?: string;
  tag?: string;
  house?: string;
  family?: string;
  concentration?: string;
  audience?: string;
  age?: number;
  region?: string;
  type?: string;
  distillery?: string;
  maxPrice?: number;
};

export type Top5Pick = { review?: string; name?: string; why?: string };

export type Top5Data = {
  title: string;
  category: World;
  of: 'bottles' | 'houses' | 'distilleries';
  intro?: string;
  match?: Match;
  picks?: Top5Pick[];
  draft: boolean;
  publishDate: Date;
};

/** What a rule can ask about one review. Every value is lower-case. */
export type Candidate = {
  id: string;
  score: number;
  date: number;
  price: number;
  facts: Record<string, string[]>;
};

const lower = (values: string[]) => values.map((v) => v.toLowerCase());

export function whiskeyCandidate(id: string, d: WhiskeyData): Candidate {
  return {
    id,
    score: d.ratings.overall,
    date: d.reviewedDate.valueOf(),
    price: d.price,
    facts: {
      tag: lower(d.tags),
      age: d.age === null ? [] : [String(d.age)],
      region: lower([d.region]),
      type: lower([d.type]),
      distillery: lower([d.distillery]),
    },
  };
}

export function fragranceCandidate(id: string, d: FragranceData): Candidate {
  return {
    id,
    score: d.ratings.overall,
    date: d.reviewedDate.valueOf(),
    price: d.price,
    facts: {
      accord: lower(d.accords.filter((a) => a.weight >= ACCORD_WEIGHT).map((a) => a.label)),
      tag: lower(d.tags),
      house: lower([d.house]),
      family: lower([fragranceView(d).group]),
      concentration: lower([d.concentration]),
      audience: lower([d.audience]),
    },
  };
}

/** True when the bottle meets every part of the rule. */
export function qualifies(candidate: Candidate, match: Match): boolean {
  return Object.entries(match).every(([key, wanted]) => {
    if (wanted === undefined) return true;
    if (key === 'maxPrice') return candidate.price <= Number(wanted);
    return (candidate.facts[key] ?? []).includes(String(wanted).toLowerCase());
  });
}

/** Every qualifying bottle, best score first. Equal scores put the newer review first. */
export function ranked(candidates: Candidate[], match: Match): Candidate[] {
  return candidates
    .filter((c) => qualifies(c, match))
    .sort((a, b) => b.score - a.score || b.date - a.date);
}

export type Top5Row = {
  rank: number;
  name: string;
  reviewId?: string;
  view?: ReviewView;
  /** One line under the name: the pick's own reason, or the review's summary. */
  line?: string;
  score?: string;
  meta?: string;
  /** A bottle named on a hand-set list that has no review yet. */
  unreviewed: boolean;
  /** For lists of houses and distilleries: the site has reviews from this one. */
  brandKnown: boolean;
};

export type Top5View = {
  world: World;
  title: string;
  intro?: string;
  of: Top5Data['of'];
  basis: 'score' | 'hand';
  rows: Top5Row[];
  updated: Date;
};

export type ListReview = { id: string; view: ReviewView; candidate: Candidate };

const reviewRow = (rank: number, review: ListReview, why?: string): Top5Row => ({
  rank,
  name: review.view.name,
  reviewId: review.id,
  view: review.view,
  line: why ?? review.view.summary,
  score: review.view.overall,
  meta: review.view.cardMeta,
  unreviewed: false,
  brandKnown: false,
});

const nameRow = (rank: number, name: string, why: string | undefined, flags: Pick<Top5Row, 'unreviewed' | 'brandKnown'>): Top5Row => ({
  rank,
  name,
  ...(why ? { line: why } : {}),
  ...flags,
});

/**
 * Builds what a list page shows. An automatic list that does not yet have
 * five qualifying reviews returns how many more it is waiting for.
 */
export function top5View(data: Top5Data, reviews: ListReview[]): { view: Top5View } | { waiting: number } {
  const base = { world: data.category, title: data.title, intro: data.intro, of: data.of };

  if (data.picks) {
    const byId = new Map(reviews.map((r) => [r.id, r]));
    // How the reviews spell each house or distillery, looked up without regard to capitals.
    const brands = new Map(reviews.map((r) => [r.view.brand.toLowerCase(), r.view.brand]));
    const rows = data.picks.map((pick, index) => {
      const rank = index + 1;
      const review = pick.review ? byId.get(pick.review) : undefined;
      if (review) return reviewRow(rank, review, pick.why);
      const typed = pick.name ?? pick.review ?? '';
      if (data.of === 'bottles') return nameRow(rank, typed, pick.why, { unreviewed: true, brandKnown: false });
      const known = brands.get(typed.toLowerCase());
      return nameRow(rank, known ?? typed, pick.why, { unreviewed: false, brandKnown: known !== undefined });
    });
    return { view: { ...base, basis: 'hand', rows, updated: data.publishDate } };
  }

  const byId = new Map(reviews.map((r) => [r.id, r]));
  const qualifying = ranked(reviews.map((r) => r.candidate), data.match ?? {});
  if (qualifying.length < LIST_SIZE) return { waiting: LIST_SIZE - qualifying.length };
  const top = qualifying.slice(0, LIST_SIZE);
  return {
    view: {
      ...base,
      basis: 'score',
      rows: top.map((candidate, index) => reviewRow(index + 1, byId.get(candidate.id)!)),
      updated: new Date(Math.max(...top.map((c) => c.date))),
    },
  };
}

// ---- Checks on a list file --------------------------------------------------

/** The words a `match` rule can use in each world. */
export const MATCH_KEYS: Record<World, readonly (keyof Match)[]> = {
  whiskey: ['tag', 'age', 'region', 'type', 'distillery', 'maxPrice'],
  fragrance: ['accord', 'tag', 'house', 'family', 'concentration', 'audience', 'maxPrice'],
};

/** Rule words whose value must come from one of the fixed word lists. */
const WORD_LISTS: Record<World, Partial<Record<keyof Match, { list: readonly string[]; file: string }>>> = {
  whiskey: {
    tag: { list: WHISKEY_TAGS, file: 'src/data/whiskey.ts' },
    region: { list: REGION_LABELS, file: 'src/data/whiskey.ts' },
    type: { list: TYPE_LABELS, file: 'src/data/whiskey.ts' },
  },
  fragrance: {
    accord: { list: ACCORD_LABELS, file: 'src/data/accords.ts' },
    tag: { list: FRAGRANCE_TAGS, file: 'src/data/fragrance.ts' },
    family: { list: ACCORD_FAMILIES, file: 'src/data/accords.ts' },
    concentration: { list: CONCENTRATIONS, file: 'src/data/fragrance.ts' },
    audience: { list: AUDIENCES, file: 'src/data/fragrance.ts' },
  },
};

const HAND_ONLY: Record<'houses' | 'distilleries', World> = { houses: 'fragrance', distilleries: 'whiskey' };

/**
 * Checks one list against the reviews. Every problem is an error, because a
 * ranked list with a wrong or missing entry should never be published.
 */
export function validateTop5(
  list: { id: string } & Top5Data,
  reviews: ReadonlyMap<string, ReviewLite>,
  hiddenDrafts: ReadonlySet<string>,
): Issue[] {
  const issues: Issue[] = [];
  const error = (message: string) => issues.push({ level: 'error', where: `top5/${list.id}`, message });
  const world = list.category;

  if (list.of !== 'bottles' && HAND_ONLY[list.of] !== world) {
    error(
      `"of: ${list.of}" is for ${HAND_ONLY[list.of]} lists. A ${world} list can use "of: ${world === 'whiskey' ? 'distilleries' : 'houses'}".`,
    );
    return issues;
  }

  if (list.match && list.picks) {
    error('has both "match" and "picks". Keep one: "match" ranks by score, "picks" sets the five by hand.');
    return issues;
  }
  if (!list.match && !list.picks) {
    error('needs either "match" (to rank by score) or "picks" (to set the five by hand).');
    return issues;
  }

  if (list.match) {
    if (list.of !== 'bottles') {
      error(`A list of ${list.of} is always set by hand. Replace "match" with five picks, each with a "name".`);
      return issues;
    }
    const keys = Object.keys(list.match) as (keyof Match)[];
    if (keys.length === 0) error('"match" is empty. Say what qualifies, such as { accord: Vanilla }.');
    for (const key of keys) {
      if (!MATCH_KEYS[world].includes(key)) {
        error(`"${key}" cannot be used on a ${world} list. ${world === 'whiskey' ? 'Whiskey' : 'Fragrance'} lists can use: ${MATCH_KEYS[world].join(', ')}.`);
        continue;
      }
      const words = WORD_LISTS[world][key];
      if (!words) continue;
      const message = vocabMessage(key, String(list.match[key]), words.list, words.file);
      if (message) error(message);
    }
    return issues;
  }

  const picks = list.picks ?? [];
  if (picks.length !== LIST_SIZE) {
    error(`has ${picks.length} picks. A Top 5 needs exactly five.`);
  }
  const sameWorld = [...reviews.values()].filter((r) => r.world === world).map((r) => r.id);
  const seen = new Set<string>();
  picks.forEach((pick, index) => {
    const n = index + 1;
    if (pick.review && pick.name) return error(`pick ${n} has both "review" and "name". Keep one.`);
    if (!pick.review && !pick.name) return error(`pick ${n} needs either "review" or "name".`);
    if (!pick.review) return;
    if (list.of !== 'bottles') {
      return error(`pick ${n} uses "review", but this is a list of ${list.of}. Use "name" with the ${list.of === 'houses' ? 'house' : 'distillery'} name.`);
    }
    const slug = pick.review;
    if (seen.has(slug)) return error(`"${slug}" is picked more than once.`);
    seen.add(slug);
    if (hiddenDrafts.has(slug)) {
      return error(`pick ${n} names "${slug}", which is still marked draft. Publish that review first, or mark this list draft too.`);
    }
    const review = reviews.get(slug);
    if (!review) {
      const hint = closest(slug, sameWorld);
      return error(
        `pick ${n} names "${slug}", but there is no ${world} review with that file name.` +
          (hint ? ` Did you mean "${hint}"?` : '') +
          ' For a bottle you have not reviewed, use "name" instead of "review".',
      );
    }
    if (review.world !== world) {
      return error(`pick ${n} names "${slug}", which is a ${review.world} review, but this is a ${world} list.`);
    }
  });
  return issues;
}
