import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBase } from './href.ts';

test('prefixes a sub-path base', () => {
  assert.equal(withBase('/caskscents', '/whiskey/'), '/caskscents/whiskey/');
  assert.equal(withBase('/caskscents/', '/whiskey/'), '/caskscents/whiskey/');
});

test('works at a domain root', () => {
  assert.equal(withBase('/', '/whiskey/'), '/whiskey/');
  assert.equal(withBase('', '/whiskey/'), '/whiskey/');
});

test('adds a leading slash when one is missing', () => {
  assert.equal(withBase('/caskscents', 'about/'), '/caskscents/about/');
});

test('the home path resolves to the base itself', () => {
  assert.equal(withBase('/caskscents', '/'), '/caskscents/');
  assert.equal(withBase('/', '/'), '/');
});

test('leaves external links, anchors and mail links alone', () => {
  assert.equal(withBase('/caskscents', 'https://example.com/x'), 'https://example.com/x');
  assert.equal(withBase('/caskscents', '#notes'), '#notes');
  assert.equal(withBase('/caskscents', 'mailto:a@b.co'), 'mailto:a@b.co');
  assert.equal(withBase('/caskscents', '//cdn.example.com/x'), '//cdn.example.com/x');
});

test('keeps query strings', () => {
  assert.equal(
    withBase('/caskscents', '/whiskey/reviews/?region=islay'),
    '/caskscents/whiskey/reviews/?region=islay',
  );
});
