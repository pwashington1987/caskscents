import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fragranceCandidate, qualifies, ranked, top5View, whiskeyCandidate } from './top5.ts';
import type { Top5Data } from './top5.ts';
import { fragranceView, whiskeyView } from './review-view.ts';
import type { FragranceData, WhiskeyData } from './review-view.ts';

const fragrance = (over: Partial<FragranceData> = {}): FragranceData => ({
  name: 'Velvet Cherry',
  house: 'Example Parfums',
  year: 2018,
  concentration: 'Eau de Parfum',
  audience: 'Unisex',
  price: 195,
  volumeMl: 100,
  currency: 'USD',
  summary: 'A cherry summary.',
  ratings: { scent: 8.8, longevity: 7.5, sillage: 8.2, bottle: 9, overall: 8.4 },
  ratingNotes: { scent: 's', longevity: 'l', sillage: 'si', bottle: 'b' },
  accords: [
    { label: 'Vanilla', weight: 100 },
    { label: 'Sweet', weight: 50 },
    { label: 'Woody', weight: 49 },
  ],
  pyramid: { top: ['Cherry'], heart: ['Rose'], base: ['Vanilla'] },
  profile: { longevityHours: [6, 8], projection: 'Room', seasons: { winter: 1, spring: 1, summer: 1, autumn: 1 }, day: 50 },
  wearsTested: 3,
  bestFor: 'Dinner.',
  tags: ['niche', 'date-night'],
  draft: false,
  reviewedDate: new Date('2026-11-10T00:00:00Z'),
  ...over,
});

const whiskey = (over: Partial<WhiskeyData> = {}): WhiskeyData => ({
  name: 'Harbour Smoke 12',
  distillery: 'Example Distillery',
  region: 'Islay',
  country: 'Scotland',
  type: 'Single malt',
  age: 12,
  abv: 43,
  price: 60,
  currency: 'USD',
  summary: 'Smoky.',
  ratings: { nose: 9, palate: 9, finish: 9, overall: 9 },
  ratingNotes: { nose: 'n', palate: 'p', finish: 'f' },
  flavorProfile: [{ label: 'Peat and smoke', intensity: 90 }],
  tastingNotes: { nose: 'n', palate: 'p', finish: 'f' },
  profile: { peat: 5, sweetness: 2 },
  tags: ['peated'],
  draft: false,
  reviewedDate: new Date('2026-11-12T00:00:00Z'),
  ...over,
});

/** A fragrance review ready for a list: id, page view and what rules can ask about. */
const entry = (id: string, over: Partial<FragranceData> = {}) => {
  const data = fragrance({ name: `Bottle ${id}`, ...over });
  return { id, view: fragranceView(data), candidate: fragranceCandidate(id, data) };
};
const scored = (id: string, overall: number, day: number, over: Partial<FragranceData> = {}) =>
  entry(id, {
    ratings: { scent: 8, longevity: 8, sillage: 8, bottle: 8, overall },
    reviewedDate: new Date(Date.UTC(2026, 10, day)),
    ...over,
  });

const list = (over: Partial<Top5Data> = {}): Top5Data => ({
  title: 'Vanilla fragrances',
  category: 'fragrance',
  of: 'bottles',
  intro: 'The five best.',
  draft: false,
  publishDate: new Date('2026-11-01T00:00:00Z'),
  ...over,
});

test('a fragrance offers its strong accords, tags, house, family and more, all lower-case', () => {
  const c = fragranceCandidate('velvet', fragrance());
  assert.deepEqual(c.facts.accord, ['vanilla', 'sweet']); // Woody at 49 is too faint to count
  assert.deepEqual(c.facts.tag, ['niche', 'date-night']);
  assert.deepEqual(c.facts.house, ['example parfums']);
  assert.deepEqual(c.facts.family, ['gourmand']);
  assert.deepEqual(c.facts.concentration, ['eau de parfum']);
  assert.deepEqual(c.facts.audience, ['unisex']);
  assert.equal(c.score, 8.4);
  assert.equal(c.price, 195);
  assert.equal(c.date, Date.UTC(2026, 10, 10));
});

test('a whiskey offers its tags, age, region, type and distillery', () => {
  const c = whiskeyCandidate('harbour', whiskey());
  assert.deepEqual(c.facts, {
    tag: ['peated'],
    age: ['12'],
    region: ['islay'],
    type: ['single malt'],
    distillery: ['example distillery'],
  });
  assert.deepEqual(whiskeyCandidate('nas', whiskey({ age: null })).facts.age, []);
});

test('a bottle qualifies only when every part of the rule holds', () => {
  const c = fragranceCandidate('velvet', fragrance());
  assert.equal(qualifies(c, { accord: 'Vanilla' }), true);
  assert.equal(qualifies(c, { accord: 'Woody' }), false);
  assert.equal(qualifies(c, { accord: 'Vanilla', tag: 'date-night' }), true);
  assert.equal(qualifies(c, { accord: 'Vanilla', tag: 'office' }), false);
  assert.equal(qualifies(c, { house: 'example parfums' }), true); // capitals do not matter
  const w = whiskeyCandidate('harbour', whiskey());
  assert.equal(qualifies(w, { age: 12 }), true);
  assert.equal(qualifies(w, { age: 15 }), false);
  assert.equal(qualifies(w, { maxPrice: 60 }), true); // up to and including the price
  assert.equal(qualifies(w, { maxPrice: 59 }), false);
});

test('qualifying bottles are ranked by score, and a tie goes to the newer review', () => {
  const pool = [
    scored('a', 8.0, 1),
    scored('b', 9.0, 2),
    scored('c', 8.5, 3),
    scored('d', 8.5, 9),
    scored('e', 9.5, 4, { accords: [{ label: 'Citrus', weight: 100 }] }),
  ].map((e) => e.candidate);
  assert.deepEqual(ranked(pool, { accord: 'Vanilla' }).map((c) => c.id), ['b', 'd', 'c', 'a']);
});

test('an automatic list keeps the best five and says what each row needs', () => {
  const pool = [scored('a', 8.0, 1), scored('b', 9.0, 2), scored('c', 8.5, 3), scored('d', 8.5, 9), scored('e', 7.0, 4), scored('f', 6.0, 5)];
  const result = top5View(list({ match: { accord: 'Vanilla' } }), pool);
  assert.ok('view' in result);
  const { view } = result;
  assert.equal(view.basis, 'score');
  assert.equal(view.world, 'fragrance');
  assert.equal(view.title, 'Vanilla fragrances');
  assert.deepEqual(view.rows.map((r) => [r.rank, r.reviewId]), [[1, 'b'], [2, 'd'], [3, 'c'], [4, 'a'], [5, 'e']]);
  assert.equal(view.rows[0].name, 'Bottle b');
  assert.equal(view.rows[0].score, '9.0');
  assert.equal(view.rows[0].line, 'A cherry summary.');
  assert.equal(view.rows[0].meta, 'Example Parfums · Eau de Parfum · $195');
  assert.equal(view.rows[0].unreviewed, false);
  assert.equal(view.rows[0].view?.name, 'Bottle b');
  assert.equal(view.updated.valueOf(), Date.UTC(2026, 10, 9)); // the newest review on the list
});

test('an automatic list with too few bottles says how many more it needs', () => {
  const pool = [scored('a', 8.0, 1), scored('b', 9.0, 2), scored('c', 8.5, 3)];
  assert.deepEqual(top5View(list({ match: { accord: 'Vanilla' } }), pool), { waiting: 2 });
});

test('a list set by hand keeps its own order, its own words, and can name a bottle not yet reviewed', () => {
  const pool = [scored('a', 8.0, 1), scored('b', 9.0, 2), scored('c', 8.5, 3), scored('d', 8.5, 9)];
  const result = top5View(
    list({
      picks: [
        { review: 'a', why: 'My favorite all the same.' },
        { review: 'b' },
        { name: 'Something Not Reviewed', why: 'On the wish list.' },
        { review: 'c' },
        { review: 'd' },
      ],
    }),
    pool,
  );
  assert.ok('view' in result);
  const { view } = result;
  assert.equal(view.basis, 'hand');
  assert.deepEqual(view.rows.map((r) => r.reviewId), ['a', 'b', undefined, 'c', 'd']);
  assert.equal(view.rows[0].line, 'My favorite all the same.');
  assert.equal(view.rows[1].line, 'A cherry summary.');
  assert.equal(view.rows[0].score, '8.0');
  assert.deepEqual(
    { ...view.rows[2] },
    { rank: 3, name: 'Something Not Reviewed', line: 'On the wish list.', unreviewed: true, brandKnown: false },
  );
  assert.equal(view.updated.valueOf(), Date.UTC(2026, 10, 1)); // the list's own date
});

test('a list of houses is names and reasons, and knows which houses the site has reviews for', () => {
  const pool = [scored('a', 8.0, 1)];
  const result = top5View(
    list({
      title: 'Houses',
      of: 'houses',
      picks: [
        { name: 'example parfums', why: 'Consistent.' },
        { name: 'Unknown Maison' },
        { name: 'Third' },
        { name: 'Fourth' },
        { name: 'Fifth' },
      ],
    }),
    pool,
  );
  assert.ok('view' in result);
  const rows = result.view.rows;
  assert.equal(result.view.of, 'houses');
  assert.deepEqual(rows.map((r) => r.brandKnown), [true, false, false, false, false]);
  assert.equal(rows[0].name, 'Example Parfums'); // shown the way the reviews spell it
  assert.equal(rows[0].line, 'Consistent.');
  assert.equal(rows.some((r) => r.unreviewed), false);
  assert.equal(rows.some((r) => r.score !== undefined), false);
});

test('a list of distilleries works the same way for whiskey', () => {
  const data = whiskey();
  const pool = [{ id: 'h', view: whiskeyView(data), candidate: whiskeyCandidate('h', data) }];
  const result = top5View(
    list({
      title: 'Distilleries',
      category: 'whiskey',
      of: 'distilleries',
      picks: [{ name: 'Example Distillery' }, { name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'E' }],
    }),
    pool,
  );
  assert.ok('view' in result);
  assert.deepEqual(result.view.rows.map((r) => r.brandKnown), [true, false, false, false, false]);
});
