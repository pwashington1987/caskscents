import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whiskeyTypeLabel, formatPrice, formatAbv, formatDate, tagLabel, plural } from './labels.ts';

test('adds whisky or whiskey to types that need the noun', () => {
  assert.equal(whiskeyTypeLabel('Single malt', 'Scotland'), 'Single malt whisky');
  assert.equal(whiskeyTypeLabel('Single pot still', 'Ireland'), 'Single pot still whiskey');
  assert.equal(whiskeyTypeLabel('Rye', 'United States'), 'Rye whiskey');
  assert.equal(whiskeyTypeLabel('Single malt', 'Japan'), 'Single malt whisky');
});

test('leaves types that stand alone', () => {
  assert.equal(whiskeyTypeLabel('Bourbon', 'United States'), 'Bourbon');
  assert.equal(whiskeyTypeLabel('Wheated bourbon', 'United States'), 'Wheated bourbon');
});

test('prices drop needless cents', () => {
  assert.equal(formatPrice(110, 'USD'), '$110');
  assert.equal(formatPrice(54.5, 'USD'), '$54.50');
  assert.equal(formatPrice(95, 'GBP'), '£95');
});

test('ABV keeps a decimal only when it has one', () => {
  assert.equal(formatAbv(43), '43%');
  assert.equal(formatAbv(54.2), '54.2%');
});

test('dates read as month and year', () => {
  assert.equal(formatDate(new Date('2026-11-18T00:00:00Z')), 'Nov 2026');
});

test('tags read as plain words', () => {
  assert.equal(tagLabel('bottled-in-bond'), 'Bottled in bond');
  assert.equal(tagLabel('peated'), 'Peated');
  assert.equal(tagLabel('under-50'), 'Under $50');
  assert.equal(tagLabel('under-100'), 'Under $100');
});

test('counts read naturally', () => {
  assert.equal(plural(1, 'bottle'), '1 bottle');
  assert.equal(plural(3, 'bottle'), '3 bottles');
  assert.equal(plural(0, 'review'), '0 reviews');
});
