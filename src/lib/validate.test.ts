import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReview, validateRundown, attributesFor, draftConflicts } from './validate.ts';
import type { ReviewLite, RundownLite } from './validate.ts';

const review = (id: string, overall: number, subs = overall): ReviewLite => ({
  id,
  world: 'whiskey',
  name: id,
  ratings: { nose: subs, palate: subs, finish: subs, value: subs, overall },
});

const reviews = new Map<string, ReviewLite>([
  ['a', review('a', 9.1)],
  ['b', review('b', 8.2)],
  ['c', review('c', 8.9)],
  ['f', { ...review('f', 8), world: 'fragrance' }],
]);

const rundown = (over: Partial<RundownLite> = {}): RundownLite => ({
  id: 'islay',
  category: 'whiskey',
  items: ['a', 'b', 'c'],
  picks: [
    { useCase: 'Best overall', winner: 'a', why: 'x' },
    { useCase: 'Best value', winner: 'b', why: 'y' },
  ],
  ...over,
});

const errors = (issues: { level: string }[]) => issues.filter((i) => i.level === 'error');
const warnings = (issues: { level: string }[]) => issues.filter((i) => i.level === 'warning');

test('scored attributes differ by world', () => {
  assert.deepEqual(attributesFor('whiskey'), ['nose', 'palate', 'finish', 'value']);
  assert.deepEqual(attributesFor('fragrance'), ['scent', 'longevity', 'sillage', 'bottle', 'value']);
});

test('a consistent review has no issues', () => {
  assert.deepEqual(validateReview(review('a', 9.1)), []);
});

test('an overall far from the subscore mean is a warning, not an error', () => {
  const issues = validateReview(review('a', 9.5, 7));
  assert.equal(errors(issues).length, 0);
  assert.equal(warnings(issues).length, 1);
  assert.match(issues[0].message, /overall 9\.5/);
  assert.match(issues[0].message, /7/);
});

test('a valid rundown has no issues', () => {
  assert.deepEqual(validateRundown(rundown(), reviews), []);
});

test('an unknown bottle is an error that names the slug and suggests one', () => {
  const issues = validateRundown(rundown({ items: ['a', 'b', 'cc'] }), reviews);
  assert.equal(errors(issues).length, 1);
  assert.match(issues[0].message, /"cc"/);
  assert.match(issues[0].message, /Did you mean "c"\?/);
});

test('a bottle from the other world is an error', () => {
  const picks = [
    { useCase: 'Best overall', winner: 'a', why: 'x' },
    { useCase: 'Best value', winner: 'a', why: 'y' },
  ];
  const issues = validateRundown(rundown({ items: ['a', 'f'], picks }), reviews);
  assert.equal(errors(issues).length, 1);
  assert.match(issues[0].message, /fragrance/);
});

test('a pick must be one of the rundown bottles', () => {
  const issues = validateRundown(
    rundown({ items: ['a', 'b'], picks: [{ useCase: 'Best overall', winner: 'c', why: 'x' }, { useCase: 'Best value', winner: 'b', why: 'y' }] }),
    reviews,
  );
  assert.equal(errors(issues).length, 1);
  assert.match(issues[0].message, /"c"/);
});

test('a bottle listed twice is an error', () => {
  const issues = validateRundown(rundown({ items: ['a', 'a', 'b'] }), reviews);
  assert.equal(errors(issues).length, 1);
  assert.match(issues[0].message, /more than once/);
});

test('a best-overall pick that is not the top score is a warning', () => {
  const issues = validateRundown(
    rundown({ picks: [{ useCase: 'Best overall', winner: 'b', why: 'x' }, { useCase: 'Best value', winner: 'c', why: 'y' }] }),
    reviews,
  );
  assert.equal(errors(issues).length, 0);
  assert.equal(warnings(issues).length, 1);
  assert.match(issues[0].message, /highest overall/);
});

test('note overrides must point at a rundown bottle and a real attribute', () => {
  const bad = validateRundown(
    rundown({ noteOverrides: { z: { nose: 'x' }, a: { sillage: 'x', palate: 'ok' } } }),
    reviews,
  );
  assert.equal(errors(bad).length, 2);
  assert.match(bad[0].message, /"z"/);
  assert.match(bad[1].message, /"sillage"/);
});

test('a published rundown may not include a bottle that is still a draft', () => {
  const issues = draftConflicts(rundown(), new Set(['b']));
  assert.equal(issues.length, 1);
  assert.equal(issues[0].level, 'error');
  assert.match(issues[0].message, /"b"/);
  assert.match(issues[0].message, /draft/);
  assert.deepEqual(draftConflicts(rundown(), new Set(['zzz'])), []);
});
