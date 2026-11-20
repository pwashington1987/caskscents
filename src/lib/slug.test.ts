import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './slug.ts';

test('labels become lowercase, hyphenated, accent-free slugs', () => {
  assert.equal(slugify('Other United States'), 'other-united-states');
  assert.equal(slugify('Maison Francis Kurkdjian'), 'maison-francis-kurkdjian');
  assert.equal(slugify("Penhaligon's"), 'penhaligon-s');
  assert.equal(slugify('Hermès'), 'hermes');
  assert.equal(slugify('D&G'), 'd-and-g');
});
