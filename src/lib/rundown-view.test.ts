import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rundownView } from './rundown-view.ts';
import type { RundownData } from './rundown-view.ts';
import { whiskeyView } from './review-view.ts';
import type { WhiskeyData } from './review-view.ts';

const base: WhiskeyData = {
  name: 'A',
  distillery: 'Alpha',
  region: 'Islay',
  country: 'Scotland',
  type: 'Single malt',
  age: 16,
  abv: 43,
  price: 110,
  currency: 'USD',
  summary: 's',
  ratings: { nose: 9.2, palate: 9.4, finish: 9.5, value: 7.8, overall: 9.1 },
  ratingNotes: { nose: 'a nose', palate: 'a palate', finish: 'a finish', value: 'a value' },
  flavorProfile: [
    { label: 'Peat and smoke', intensity: 92 },
    { label: 'Sweet and sherry', intensity: 62 },
  ],
  tastingNotes: { nose: '', palate: '', finish: '' },
  profile: { peat: 5, sweetness: 3 },
  tags: [],
  draft: false,
  reviewedDate: new Date('2026-11-18T00:00:00Z'),
};

const item = (id: string, over: Partial<WhiskeyData>) => ({ id, view: whiskeyView({ ...base, ...over }) });

const a = item('a', { name: 'Alpha 16' });
const b = item('b', {
  name: 'Beta 10',
  distillery: 'Beta',
  price: 55,
  ratings: { nose: 8.4, palate: 8.0, finish: 9.5, value: 8.6, overall: 8.2 },
  ratingNotes: { nose: 'b nose', palate: 'b palate', finish: 'b finish', value: 'b value' },
  flavorProfile: [
    { label: 'Peat and smoke', intensity: 98 },
    { label: 'Citrus', intensity: 35 },
  ],
});
const c = item('c', {
  name: 'Gamma Reserve',
  distillery: 'Gamma',
  region: 'Kentucky',
  country: 'United States',
  type: 'Bourbon',
  abv: 50,
  price: 38,
  ratings: { nose: 8.0, palate: 8.3, finish: 7.8, value: 9.2, overall: 8.3 },
  ratingNotes: { nose: 'c nose', palate: 'c palate', finish: 'c finish', value: 'c value' },
  flavorProfile: [{ label: 'Caramel and toffee', intensity: 80 }],
});

const data = (over: Partial<RundownData> = {}): RundownData => ({
  title: 'Two Islays',
  summary: 'sum',
  category: 'whiskey',
  items: ['a', 'b'],
  picks: [
    { useCase: 'Best overall', winner: 'a', why: 'because' },
    { useCase: 'Best value', winner: 'b', why: 'cheap' },
  ],
  ...over,
});

test('meta names the shared region, the bottle count and the read time', () => {
  assert.deepEqual(rundownView(data({ readMinutes: 8 }), [a, b]).meta, ['Rundown', 'Islay', '2 bottles', '8 min read']);
});

test('meta leaves the region out when the bottles do not share one', () => {
  assert.deepEqual(rundownView(data({ items: ['a', 'c'] }), [a, c]).meta, ['Rundown', '2 bottles']);
});

test('bottles keep the rundown order and get a short name', () => {
  const v = rundownView(data(), [a, b]);
  assert.deepEqual(v.bottles.map((x) => [x.id, x.name, x.short, x.overall]), [
    ['a', 'Alpha 16', 'Alpha', '9.1'],
    ['b', 'Beta 10', 'Beta', '8.2'],
  ]);
});

test('short names fall back to the full name when two bottles share a distillery, and an explicit one wins', () => {
  const b2 = item('b', { name: 'Alpha 10' });
  assert.deepEqual(rundownView(data(), [a, b2]).bottles.map((x) => x.short), ['Alpha 16', 'Alpha 10']);
  const a2 = item('a', { name: 'Alpha 16', shortName: 'A16' });
  assert.equal(rundownView(data(), [a2, b]).bottles[0].short, 'A16');
});

test('picks carry the winner name, and only the first leads', () => {
  const v = rundownView(data(), [a, b]);
  assert.deepEqual(v.picks, [
    { useCase: 'Best overall', winnerId: 'a', winner: 'Alpha 16', why: 'because', lead: true },
    { useCase: 'Best value', winnerId: 'b', winner: 'Beta 10', why: 'cheap', lead: false },
  ]);
});

test('each attribute lists every bottle with its score and note, marking the best', () => {
  const v = rundownView(data(), [a, b]);
  assert.deepEqual(v.attributes.map((x) => x.label), ['Nose', 'Palate', 'Finish', 'Value']);
  assert.deepEqual(v.attributes[0].cells, [
    { id: 'a', name: 'Alpha 16', short: 'Alpha', score: '9.2', note: 'a nose', best: true },
    { id: 'b', name: 'Beta 10', short: 'Beta', score: '8.4', note: 'b nose', best: false },
  ]);
  assert.deepEqual(v.attributes[3].cells.map((x) => x.best), [false, true]);
});

test('a tie marks both bottles as best', () => {
  const v = rundownView(data(), [a, b]);
  assert.deepEqual(v.attributes[2].cells.map((x) => x.best), [true, true]);
});

test('ranked cells run highest first, and the top line names the leader', () => {
  const v = rundownView(data(), [a, b]);
  assert.deepEqual(v.attributes[3].ranked.map((x) => x.id), ['b', 'a']);
  assert.equal(v.attributes[3].top, 'Beta 10, 8.6');
  assert.equal(v.attributes[2].top, 'Alpha 16 and Beta 10, 9.5');
});

test('a note override replaces the review note in this rundown only', () => {
  const v = rundownView(data({ noteOverrides: { b: { palate: 'reworded' } } }), [a, b]);
  assert.equal(v.attributes[1].cells[1].note, 'reworded');
  assert.equal(v.attributes[1].cells[0].note, 'a palate');
});

test('the overall row marks the highest overall score', () => {
  const v = rundownView(data(), [a, b]);
  assert.deepEqual(v.overall, [
    { id: 'a', score: '9.1', best: true },
    { id: 'b', score: '8.2', best: false },
  ]);
});

test('fact rows line up one value per bottle', () => {
  const v = rundownView(data({ items: ['a', 'c'] }), [a, c]);
  assert.deepEqual(v.facts, [
    { label: 'ABV', values: ['43%', '50%'] },
    { label: 'Paid', values: ['$110', '$38'] },
  ]);
});

test('the profile compares only what at least two bottles share, strongest first, with zero where absent', () => {
  const v = rundownView(data({ items: ['a', 'b', 'c'] }), [a, b, c]);
  assert.equal(v.profile.title, 'Flavor profile');
  assert.deepEqual(v.profile.groups.map((g) => g.label), ['Peat and smoke']);
  assert.deepEqual(v.profile.groups[0].rows, [
    { short: 'Alpha', percent: 92 },
    { short: 'Beta', percent: 98 },
    { short: 'Gamma', percent: 0 },
  ]);
});

test('the profile is empty when the bottles share nothing', () => {
  assert.deepEqual(rundownView(data({ items: ['a', 'c'] }), [a, c]).profile.groups, []);
});

test('the profile keeps at most five groups', () => {
  const labels = ['Peat and smoke', 'Honey', 'Citrus', 'Floral', 'Nutty', 'Wine cask'];
  const flavorProfile = labels.map((label, i) => ({ label, intensity: 90 - i * 10 }));
  const one = item('a', { name: 'Alpha 16', flavorProfile });
  const two = item('b', { name: 'Beta 10', distillery: 'Beta', flavorProfile });
  assert.equal(rundownView(data(), [one, two]).profile.groups.length, 5);
});
