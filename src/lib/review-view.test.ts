import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whiskeyView, fragranceView } from './review-view.ts';
import type { WhiskeyData, FragranceData } from './review-view.ts';

const whiskey: WhiskeyData = {
  name: 'Harbour Smoke 16',
  distillery: 'Example Distillery',
  region: 'Islay',
  country: 'Scotland',
  type: 'Single malt',
  age: 16,
  abv: 43,
  price: 110,
  currency: 'USD',
  summary: 'Smoky.',
  ratings: { nose: 9.2, palate: 9.4, finish: 9.5, value: 7.8, overall: 9.1 },
  ratingNotes: { nose: 'n', palate: 'p', finish: 'f', value: 'v' },
  flavorProfile: [
    { label: 'Sweet and sherry', intensity: 62 },
    { label: 'Peat and smoke', intensity: 92 },
  ],
  tastingNotes: { nose: 'Bonfire.', palate: 'Toffee.', finish: 'Long.' },
  profile: { peat: 5, sweetness: 3 },
  tags: ['peated'],
  draft: false,
  reviewedDate: new Date('2026-11-18T00:00:00Z'),
};

const fragrance: FragranceData = {
  name: 'Velvet Cherry',
  house: 'Example Parfums',
  year: 2018,
  concentration: 'Eau de Parfum',
  audience: 'Unisex',
  price: 195,
  volumeMl: 100,
  currency: 'USD',
  summary: 'Cherry.',
  ratings: { scent: 8.8, longevity: 7.5, sillage: 8.2, bottle: 9, value: 7.4, overall: 8.4 },
  ratingNotes: { scent: 's', longevity: 'l', sillage: 'si', bottle: 'b', value: 'v' },
  accords: [
    { label: 'Sweet', weight: 84 },
    { label: 'Vanilla', weight: 100 },
    { label: 'Cherry', weight: 42 },
  ],
  pyramid: { top: ['Cherry'], heart: ['Heliotrope'], base: ['Vanilla', 'Musk'] },
  profile: {
    longevityHours: [6, 8],
    projection: "Arm's length",
    seasons: { winter: 85, spring: 25, summer: 10, autumn: 75 },
    day: 30,
  },
  wearsTested: 6,
  bestFor: 'Dinner.',
  tags: ['niche'],
  draft: true,
  reviewedDate: new Date('2026-11-17T00:00:00Z'),
};

test('whiskey meta line and facts', () => {
  const v = whiskeyView(whiskey);
  assert.deepEqual(v.meta, ['Example Distillery', 'Islay', 'Single malt whisky', '16 years old']);
  assert.deepEqual(v.facts, ['43% ABV', '$110', 'Reviewed Nov 2026']);
  assert.equal(v.overall, '9.1');
});

test('a whiskey without an age says so, and batch details join the facts', () => {
  const v = whiskeyView({ ...whiskey, age: null, batch: 'B12', bottledYear: 2024 });
  assert.equal(v.meta[3], 'No age statement');
  assert.deepEqual(v.facts, ['43% ABV', '$110', 'Batch B12', 'Bottled 2024', 'Reviewed Nov 2026']);
});

test('whiskey scores keep their order and carry their notes', () => {
  const v = whiskeyView(whiskey);
  assert.deepEqual(v.scores.map((s) => s.label), ['Nose', 'Palate', 'Finish', 'Value']);
  assert.deepEqual(v.scores[0], { key: 'nose', label: 'Nose', score: '9.2', percent: 92, note: 'n' });
});

test('whiskey flavors sort strongest first as thin bars', () => {
  const v = whiskeyView(whiskey);
  assert.equal(v.bars.title, 'Flavor profile');
  assert.equal(v.bars.style, 'thin');
  assert.deepEqual(v.bars.items.map((b) => b.label), ['Peat and smoke', 'Sweet and sherry']);
});

test('whiskey profile shows peat, sweetness, strength and price tier', () => {
  const v = whiskeyView(whiskey);
  assert.deepEqual(v.profile.tiles, [
    { label: 'Peat', value: '5 of 5', level: 5 },
    { label: 'Sweetness', value: '3 of 5', level: 3 },
    { label: 'Strength', value: 'Standard', level: 2 },
    { label: 'Price', value: '$70 to $120', level: 3 },
  ]);
  assert.deepEqual(v.notes.rows, [
    { label: 'Nose', text: 'Bonfire.' },
    { label: 'Palate', text: 'Toffee.' },
    { label: 'Finish', text: 'Long.' },
  ]);
});

test('fragrance meta line and facts', () => {
  const v = fragranceView(fragrance);
  assert.deepEqual(v.meta, ['Example Parfums', '2018', 'Eau de Parfum', 'Unisex']);
  assert.deepEqual(v.facts, ['$195 for 100 ml', 'Reviewed Nov 2026', 'Worn 6 times']);
  assert.equal(v.draft, true);
  assert.equal(v.bestFor, 'Dinner.');
});

test('one wear reads naturally', () => {
  assert.equal(fragranceView({ ...fragrance, wearsTested: 1 }).facts[2], 'Worn once');
});

test('accords sort strongest first, with their color and a readable label color', () => {
  const v = fragranceView(fragrance);
  assert.equal(v.bars.style, 'filled');
  assert.deepEqual(v.bars.items.map((b) => b.label), ['Vanilla', 'Sweet', 'Cherry']);
  assert.deepEqual(v.bars.items[0], { label: 'Vanilla', percent: 100, color: '#E8DCA8', textColor: '#14100D' });
  assert.equal(v.bars.items[1].textColor, '#EEE6D8');
});

test('the pyramid becomes three rows of pills', () => {
  const v = fragranceView(fragrance);
  assert.deepEqual(v.notes.rows, [
    { label: 'Top', pills: ['Cherry'] },
    { label: 'Heart', pills: ['Heliotrope'] },
    { label: 'Base', pills: ['Vanilla', 'Musk'] },
  ]);
});

test('when to wear it: plain facts, seasons strongest first, and the day share', () => {
  const v = fragranceView(fragrance);
  assert.deepEqual(v.profile.tiles, [
    { label: 'Lasts', value: '6 to 8 hours' },
    { label: 'Projects', value: "Arm's length" },
  ]);
  assert.deepEqual(v.profile.seasons, [
    { label: 'Winter', percent: 85 },
    { label: 'Autumn', percent: 75 },
    { label: 'Spring', percent: 25 },
    { label: 'Summer', percent: 10 },
  ]);
  assert.equal(v.profile.day, 30);
});

test('features for finding similar bottles', () => {
  assert.deepEqual(whiskeyView(whiskey).features, [
    'Peat and smoke', 'Sweet and sherry', 'peated', 'region:Islay', 'type:Single malt',
  ]);
  assert.deepEqual(fragranceView(fragrance).features, [
    'Vanilla', 'Sweet', 'Cherry', 'niche', 'house:Example Parfums',
  ]);
});

test('details used when bottles are compared in a rundown', () => {
  const w = whiskeyView({ ...whiskey, shortName: 'Harbour 16' });
  assert.equal(w.shortName, 'Harbour 16');
  assert.equal(w.brand, 'Example Distillery');
  assert.equal(w.group, 'Islay');
  assert.deepEqual(w.compareFacts, [
    { label: 'ABV', value: '43%' },
    { label: 'Paid', value: '$110' },
  ]);

  const f = fragranceView(fragrance);
  assert.equal(f.shortName, undefined);
  assert.equal(f.brand, 'Example Parfums');
  assert.equal(f.group, 'Gourmand');
  assert.deepEqual(f.compareFacts, [
    { label: 'Size', value: '100 ml' },
    { label: 'Paid', value: '$195' },
  ]);
});

test('details used on cards, the shelf and browse pages', () => {
  const w = whiskeyView(whiskey);
  assert.equal(w.cardMeta, 'Single malt whisky · Islay · 43% · $110');
  assert.deepEqual(w.facets, { region: ['Islay'], type: ['Single malt'], style: ['peated'] });
  assert.deepEqual(w.sort, { score: 9.1, price: 110, date: Date.UTC(2026, 10, 18) });

  const f = fragranceView(fragrance);
  assert.equal(f.cardMeta, 'Example Parfums · Eau de Parfum · $195');
  assert.deepEqual(f.facets, { house: ['Example Parfums'], family: ['Gourmand'], tag: ['niche'] });
  assert.equal(f.sort.price, 195);
});
