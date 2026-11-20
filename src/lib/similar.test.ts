import { test } from 'node:test';
import assert from 'node:assert/strict';
import { similarTo } from './similar.ts';

const item = (id: string, features: string[], overall = 8) => ({ id, features, overall });

test('ranks by how much is shared, most first', () => {
  const target = item('a', ['Vanilla', 'Sweet', 'Amber', 'niche']);
  const result = similarTo(target, [
    target,
    item('b', ['Citrus', 'Fresh']),
    item('c', ['Vanilla', 'Sweet', 'Amber', 'niche']),
    item('d', ['Vanilla', 'Woody']),
  ]);
  assert.deepEqual(result, ['c', 'd']);
});

test('never includes the bottle itself or bottles with nothing in common', () => {
  const target = item('a', ['Peat and smoke']);
  assert.deepEqual(similarTo(target, [target, item('b', ['Honey'])]), []);
});

test('returns at most the number asked for', () => {
  const target = item('a', ['x']);
  const others = ['b', 'c', 'd', 'e'].map((id) => item(id, ['x']));
  assert.equal(similarTo(target, [target, ...others]).length, 3);
  assert.equal(similarTo(target, [target, ...others], 2).length, 2);
});

test('ties go to the higher score, then alphabetically', () => {
  const target = item('a', ['x', 'y']);
  const result = similarTo(target, [item('d', ['x', 'y'], 8), item('c', ['x', 'y'], 9), item('b', ['x', 'y'], 8)]);
  assert.deepEqual(result, ['c', 'b', 'd']);
});
