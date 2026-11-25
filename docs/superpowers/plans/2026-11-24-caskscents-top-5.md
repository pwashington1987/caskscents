# Top 5 Lists Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ranked "Top 5" lists in each world, built from review scores by default or set by hand, with their own pages and links from the top bar, homepage, review pages and feeds.

**Architecture:** A new content collection (`top5`, one Markdown file per list). All matching, ranking, checking and view-building is pure TypeScript in `src/lib/top5.ts`, tested with Node's test runner. One Astro-aware module (`src/lib/top5-lists.ts`) loads the collection, runs the checks and hands resolved lists to pages.

**Tech Stack:** Astro 5 content collections, zod, TypeScript, `node --test`. No new packages.

**Spec:** `docs/superpowers/specs/2026-11-24-caskscents-top-5-design.md`

## Global Constraints

- A list always has exactly five rows. An automatic list with fewer than five qualifying reviews is not shown anywhere.
- An accord qualifies a bottle only at weight 50 or more.
- Order for automatic lists: overall score, highest first; ties go to the newer review.
- Outside a list's own page, only its title and intro appear. Never a rank or a member.
- Scores show on list pages. The gateway is not changed.
- Site copy: plain words, no em dashes. Imports use explicit `.ts` endings. Every internal link goes through `href()`.
- The workspace cannot install packages or run Astro. Logic is verified with `node --test`; pages are verified from the published preview build.

## Review Focus

1. A bottle on a hand-set list is renamed, deleted or still a draft: the build stops and names the list and the pick. (Task 2 test.)
2. Two bottles tie for fifth place: the newer review takes it, every time. (Task 1 test.)
3. A house is typed with different capitals than in its reviews ("example parfums"): it still links to the house page. (Task 1 test.)
4. A world has no lists that qualify: the top-bar link and homepage section are absent and `/top-5/` shows a plain "on their way" message. (Task 5, launch build and link check.)
5. A `match` uses a word for the wrong world (`age` on a fragrance list) or a misspelled accord: the build stops with the fix. (Task 2 test.)

---

### Task 1: Matching, ranking and the list view

**Files:**
- Create: `src/lib/top5.ts`
- Test: `src/lib/top5.test.ts`

**Interfaces:**
- Consumes: `WhiskeyData`, `FragranceData`, `ReviewView` from `src/lib/review-view.ts`; `World` from `src/lib/validate.ts`.
- Produces:

```ts
export const LIST_SIZE = 5;
export const ACCORD_WEIGHT = 50;
export type Match = {
  accord?: string; tag?: string; house?: string; family?: string; concentration?: string; audience?: string;
  age?: number; region?: string; type?: string; distillery?: string; maxPrice?: number;
};
export type Pick = { review?: string; name?: string; why?: string };
export type Top5Data = {
  title: string; category: World; of: 'bottles' | 'houses' | 'distilleries';
  intro?: string; match?: Match; picks?: Pick[]; draft: boolean; publishDate: Date;
};
/** What a rule can ask about one review. Every value is lower-case. */
export type Candidate = { id: string; score: number; date: number; price: number; facts: Record<string, string[]> };
export function whiskeyCandidate(id: string, d: WhiskeyData): Candidate;   // facts: tag, age, region, type, distillery
export function fragranceCandidate(id: string, d: FragranceData): Candidate; // facts: accord (weight >= 50), tag, house, family, concentration, audience
export function qualifies(c: Candidate, match: Match): boolean;            // every key must hold; maxPrice is inclusive
export function ranked(candidates: Candidate[], match: Match): Candidate[]; // all that qualify, best first
export type Top5Row = {
  rank: number; name: string; reviewId?: string; view?: ReviewView;
  line?: string; score?: string; meta?: string; unreviewed: boolean; brandKnown: boolean;
};
export type Top5View = {
  world: World; title: string; intro?: string; of: Top5Data['of'];
  basis: 'score' | 'hand'; rows: Top5Row[]; updated: Date;
};
/** `waiting` is how many more qualifying reviews an automatic list needs. */
export function top5View(
  data: Top5Data,
  reviews: { id: string; view: ReviewView; candidate: Candidate }[],
): { view: Top5View } | { waiting: number };
```

- [ ] **Step 1: Write the failing tests** in `src/lib/top5.test.ts`:
  - `fragranceCandidate` lists an accord at weight 50 and leaves one at 49 out; `family` is the strongest accord's family; all facts lower-case.
  - `whiskeyCandidate` gives `age: ['12']`, and `age: []` when there is no age statement.
  - `qualifies`: one key; two keys must both hold; `maxPrice: 60` accepts 60 and rejects 61; `{ house: 'example parfums' }` accepts house "Example Parfums".
  - `ranked`: highest score first; equal scores put the newer `date` first; non-qualifying left out.
  - `top5View` automatic with six qualifying: five rows, ranks 1 to 5, `basis: 'score'`, `line` is the review summary, `score` is the formatted overall, `updated` is the newest member's review date.
  - `top5View` automatic with three qualifying returns `{ waiting: 2 }`.
  - `top5View` by hand: order kept as written; `why` replaces the summary; a `name` pick has `unreviewed: true`, no score; `updated` is `publishDate`.
  - `top5View` for `of: 'houses'`: rows are names; `brandKnown` is true when any review has that house (compared without regard to capitals), `unreviewed` is false.
- [ ] **Step 2: Run** `node --test src/lib/top5.test.ts`. Expected: fails, module not found.
- [ ] **Step 3: Implement** the exports above in `src/lib/top5.ts`.
- [ ] **Step 4: Run** `node --test src/lib/top5.test.ts`. Expected: all pass.
- [ ] **Step 5: Commit** "Add Top 5 matching, ranking and list views".

### Task 2: Checks, content format and the scaffold command

**Files:**
- Modify: `src/lib/top5.ts`, `src/lib/top5.test.ts`, `src/content.config.ts`, `scripts/new.mjs`, `scripts/new.test.mjs`

**Interfaces:**
- Consumes: `Issue`, `ReviewLite` from `src/lib/validate.ts`; `closest` from `src/lib/vocab.ts`; word lists from `src/data/`.
- Produces:

```ts
export const MATCH_KEYS: Record<World, readonly (keyof Match)[]>;
// whiskey: tag, age, region, type, distillery, maxPrice
// fragrance: accord, tag, house, family, concentration, audience, maxPrice
export function validateTop5(
  list: { id: string } & Top5Data,
  reviews: ReadonlyMap<string, ReviewLite>,
  hiddenDrafts: ReadonlySet<string>,
): Issue[];   // `where` is `top5/<id>`
```

Collection `top5` in `src/content.config.ts`: `title`, `category`, `of` (default `bottles`), `intro` (200 characters at most, optional), `match` (strict object of the keys above, optional), `picks` (exactly 5 of `{ review?, name?, why? }`, optional), `draft`, `publishDate`.

- [ ] **Step 1: Write the failing tests** for `validateTop5`, one rule per case:
  - neither `match` nor `picks`, and both together: error.
  - `match: {}`: error.
  - `{ age: 12 }` on a fragrance list: error naming the keys fragrance lists can use.
  - `{ accord: 'Vanila' }`: error containing `Did you mean "Vanilla"?`. Same for an unknown tag, region, type, family, concentration, audience.
  - `of: 'houses'` on a whiskey list, `of: 'distilleries'` on a fragrance list, and either with `match`: error.
  - a pick with both `review` and `name`, or neither: error naming the pick's position.
  - a `review` pick that does not exist (with closest suggestion), belongs to the other world, is a hidden draft, or appears twice: error.
  - a `review` pick on a houses list: error.
  - a correct automatic list and a correct hand list: no issues.
  - `scripts/new.test.mjs`: `npm run new top5 "Vanilla fragrances"` creates `src/content/top5/vanilla-fragrances.md` starting `---\ndraft: true\ntitle: "Vanilla fragrances"`, with a `match:` line and commented `picks`.
- [ ] **Step 2: Run** the two test files. Expected: fail.
- [ ] **Step 3: Implement** `MATCH_KEYS` and `validateTop5`; add the collection with a `superRefine` for "exactly one of match or picks"; add `top5` to `FOLDERS` and `templates` in `scripts/new.mjs`.
- [ ] **Step 4: Run** `node --test "src/**/*.test.ts" "scripts/**/*.test.mjs"`. Expected: all pass.
- [ ] **Step 5: Commit** "Add Top 5 checks, content format and scaffold".

### Task 3: List pages

**Files:**
- Create: `src/lib/top5-lists.ts`, `src/components/Top5Rows.astro`, `src/pages/[world]/top-5/index.astro`, `src/pages/[world]/top-5/[slug].astro`
- Modify: `src/lib/paths.ts`

**Interfaces:**
- Consumes: Task 1 and 2 exports; `getSite`, `showDrafts` from `src/lib/site.ts`; `listFor` from `src/lib/views.ts`.
- Produces:

```ts
// src/lib/paths.ts
export const top5IndexPath = (world: World) => `/${world}/top-5/`;
export const top5Path = (world: World, id: string) => `/${world}/top-5/${id}/`;
// src/lib/top5-lists.ts
export type ResolvedList = { id: string; data: Top5Data; view: Top5View };
export type Top5Site = {
  forWorld: (world: World) => ResolvedList[];                 // newest publishDate first
  containing: (world: World, reviewId: string) => ResolvedList[];
};
export function getTop5(): Promise<Top5Site>;   // cached; throws on errors; prints "has 3 of 5" notes
```

- [ ] **Step 1:** Add the two path helpers.
- [ ] **Step 2:** Write `top5-lists.ts`: load the collection, hide drafts unless `showDrafts`, run `validateTop5` for each list (throw with the same block format `site.ts` uses), build candidates and views, keep lists that resolve, and `console.warn` one line per waiting list: `<title> has N of 5 qualifying reviews. It will appear when M more qualify.`
- [ ] **Step 3:** `Top5Rows.astro` takes `view: Top5View`. An ordered list: rank numeral, `BottlePhoto` for bottle rows, name (linked to the review when there is one; to the house page for a known house; to the shelf search for a known distillery), `meta`, `line`, and the score at the right. An unreviewed bottle shows "Not reviewed yet" in place of a score.
- [ ] **Step 4:** `[slug].astro`: kicker `Top 5`, title, intro, "Ranked by score" or "My picks" with the month of `updated`, the rows, then "More Top 5 lists" (titles only). `index.astro`: every resolved list as title and intro, and "The first lists are on their way." when there are none.
- [ ] **Step 5: Commit** "Add Top 5 list pages".

### Task 4: Links into the lists

**Files:**
- Modify: `src/components/SiteNav.astro`, `src/pages/[world]/index.astro`, `src/pages/[world]/reviews/[slug].astro`, `src/pages/[world]/rss.xml.ts`, `src/lib/feed.ts`, `src/lib/feed.test.ts`

- [ ] **Step 1:** Extend `FeedItem['kind']` to `'Review' | 'Rundown' | 'Top 5'` with a test that the category is written; feed items for lists are `Top 5: <title>` with the intro (or "A CaskScents Top 5 list.") and `publishDate`.
- [ ] **Step 2:** `SiteNav`: add "Top 5" after "Rundowns" only when `forWorld(world)` is not empty.
- [ ] **Step 3:** World homepage: a "Top 5" section after "Rundowns" with up to four list titles and intros and an "All lists" link. Left out when there are none.
- [ ] **Step 4:** Review page aside: "On these lists" with each list's title, no rank.
- [ ] **Step 5: Run** all tests, then **commit** "Link Top 5 lists from the top bar, homepage, reviews and feeds".

### Task 5: Samples, documentation and the preview check

**Files:**
- Create: sample reviews so each world has at least five that qualify for one automatic list; sample lists in `src/content/top5/` covering an automatic list, a waiting list, a hand-set bottle list with one unreviewed pick, a houses list and a distilleries list (all `draft: true`)
- Modify: `README.md`, `docs/superpowers/plans/2026-11-20-caskscents-implementation.md` (build notes)

- [ ] **Step 1:** Add the samples and lists.
- [ ] **Step 2:** README: "Add a Top 5 list" (the command, `match` keys per world, hand-set picks, the five-or-hidden rule, the 50 weight rule).
- [ ] **Step 3:** Push; wait for the build (tests, template check, both builds, link checks) to pass.
- [ ] **Step 4:** From the published preview: run the page audit at 390 and 1440 px, screenshot an automatic list, a hand-set list, a houses list, the list index, the homepage section and a review's "On these lists"; confirm the waiting list has no page and the launch build (no drafts) has no "Top 5" link and no broken links.
- [ ] **Step 5: Commit** any fixes, update the build notes and the project copy of the docs.
