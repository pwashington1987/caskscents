import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyShelf, parseState, toQuery, DEFAULT_SORT } from './shelf.ts';
import type { ShelfItem } from './shelf.ts';

const item = (id: string, over: Partial<ShelfItem>): ShelfItem => ({
  id,
  name: id,
  search: id,
  score: 8,
  price: 50,
  date: 0,
  facets: {},
  ...over,
});

const items: ShelfItem[] = [
  item('lagavulin-16', { name: 'Lagavulin 16', search: 'lagavulin 16 lagavulin islay peat', score: 9.1, price: 110, date: 3, facets: { region: ['Islay'], style: ['peated', 'sherried'] } }),
  item('laphroaig-10', { name: 'Laphroaig 10', search: 'laphroaig 10 laphroaig islay peat', score: 8.2, price: 55, date: 2, facets: { region: ['Islay'], style: ['peated'] } }),
  item('eagle-rare', { name: 'Eagle Rare 10', search: 'eagle rare 10 buffalo trace kentucky', score: 8.4, price: 45, date: 1, facets: { region: ['Kentucky'], style: [] } }),
];
const params = ['region', 'style'];

test('the default view is everything, newest first', () => {
  const state = parseState('', params);
  assert.equal(state.sort, DEFAULT_SORT);
  assert.deepEqual(applyShelf(items, state), ['lagavulin-16', 'laphroaig-10', 'eagle-rare']);
});

test('filters combine: every chosen filter must match', () => {
  assert.deepEqual(applyShelf(items, parseState('?region=Islay', params)), ['lagavulin-16', 'laphroaig-10']);
  assert.deepEqual(applyShelf(items, parseState('?region=Islay&style=sherried', params)), ['lagavulin-16']);
  assert.deepEqual(applyShelf(items, parseState('?region=Kentucky&style=peated', params)), []);
});

test('sorting by score, price and name', () => {
  assert.deepEqual(applyShelf(items, parseState('?sort=score', params)), ['lagavulin-16', 'eagle-rare', 'laphroaig-10']);
  assert.deepEqual(applyShelf(items, parseState('?sort=price', params)), ['eagle-rare', 'laphroaig-10', 'lagavulin-16']);
  assert.deepEqual(applyShelf(items, parseState('?sort=name', params)), ['eagle-rare', 'lagavulin-16', 'laphroaig-10']);
});

test('search matches every typed word, in any order, ignoring case', () => {
  assert.deepEqual(applyShelf(items, parseState('?q=PEAT', params)), ['lagavulin-16', 'laphroaig-10']);
  assert.deepEqual(applyShelf(items, parseState('?q=10+islay', params)), ['laphroaig-10']);
  assert.deepEqual(applyShelf(items, parseState('?q=gin', params)), []);
});

test('unknown parameters and an unknown sort are ignored', () => {
  const state = parseState('?sort=sideways&colour=red&region=Islay', params);
  assert.equal(state.sort, DEFAULT_SORT);
  assert.deepEqual(state.filters, { region: 'Islay' });
});

test('the address only carries what differs from the default', () => {
  assert.equal(toQuery(parseState('', params)), '');
  assert.equal(toQuery(parseState('?sort=newest&q=', params)), '');
  assert.equal(toQuery({ q: 'peat smoke', sort: 'score', filters: { region: 'Islay', style: '' } }), '?q=peat+smoke&region=Islay&sort=score');
});

test('a state survives a round trip through the address', () => {
  const state = { q: 'rare', sort: 'price' as const, filters: { region: 'Kentucky' } };
  assert.deepEqual(parseState(toQuery(state), params), state);
});
