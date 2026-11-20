import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupBy, FACETS } from './taxonomy.ts';

const items = [
  { id: 'a', facets: { region: ['Islay'], style: ['peated', 'sherried'] } },
  { id: 'b', facets: { region: ['Islay'], style: ['peated'] } },
  { id: 'c', facets: { region: ['Kentucky'], style: [] } },
];

test('groups bottles by a facet, biggest group first, then alphabetically', () => {
  assert.deepEqual(groupBy(items, 'region'), [
    { slug: 'islay', label: 'Islay', ids: ['a', 'b'] },
    { slug: 'kentucky', label: 'Kentucky', ids: ['c'] },
  ]);
});

test('a bottle with several values lands in each group', () => {
  assert.deepEqual(groupBy(items, 'style'), [
    { slug: 'peated', label: 'peated', ids: ['a', 'b'] },
    { slug: 'sherried', label: 'sherried', ids: ['a'] },
  ]);
});

test('each world has three facets, and two of them have browse pages', () => {
  assert.deepEqual(FACETS.whiskey.map((f) => f.param), ['region', 'type', 'style']);
  assert.deepEqual(FACETS.whiskey.filter((f) => f.page).map((f) => f.page), ['regions', 'styles']);
  assert.deepEqual(FACETS.fragrance.map((f) => f.param), ['house', 'family', 'tag']);
  assert.deepEqual(FACETS.fragrance.filter((f) => f.page).map((f) => f.page), ['houses', 'families']);
});
