import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  strengthBand,
  priceTier,
  spellingFor,
  contrastRatio,
  labelColorOn,
  roundScore,
  subscoreMean,
  longevityLabel,
} from './derive.ts';

test('strength bands follow ABV', () => {
  assert.equal(strengthBand(40).level, 1);
  assert.equal(strengthBand(43).level, 2);
  assert.equal(strengthBand(46).level, 3);
  assert.equal(strengthBand(50).level, 4);
  assert.equal(strengthBand(54.2).level, 4);
  assert.equal(strengthBand(55).level, 5);
  assert.equal(strengthBand(60.1).label, 'Cask strength');
});

test('price tiers follow price', () => {
  assert.equal(priceTier(28).level, 1);
  assert.equal(priceTier(40).level, 2);
  assert.equal(priceTier(69.99).level, 2);
  assert.equal(priceTier(70).level, 3);
  assert.equal(priceTier(120).level, 4);
  assert.equal(priceTier(200).level, 5);
  assert.equal(priceTier(28).label, 'Under $40');
});

test('whiskey for the United States and Ireland, whisky elsewhere', () => {
  assert.equal(spellingFor('United States'), 'whiskey');
  assert.equal(spellingFor('USA'), 'whiskey');
  assert.equal(spellingFor('ireland'), 'whiskey');
  assert.equal(spellingFor('Scotland'), 'whisky');
  assert.equal(spellingFor('Japan'), 'whisky');
  assert.equal(spellingFor('Canada'), 'whisky');
  assert.equal(spellingFor('India'), 'whisky');
});

test('contrast ratio matches known values', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#FFFFFF')), 21);
  assert.equal(contrastRatio('#14100D', '#14100D'), 1);
});

test('label color is whichever of dark or light reads better', () => {
  assert.equal(labelColorOn('#E8DCA8'), '#14100D');
  assert.equal(labelColorOn('#6E4353'), '#EEE6D8');
  assert.ok(contrastRatio(labelColorOn('#9A3029'), '#9A3029') >= 4.5);
});

test('scores round to one decimal', () => {
  assert.equal(roundScore(8.449), 8.4);
  assert.equal(roundScore(8.45), 8.5);
});

test('subscore mean ignores overall', () => {
  assert.equal(subscoreMean({ nose: 9, palate: 8, finish: 7, value: 8, overall: 1 }), 8);
});

test('longevity reads as a plain range', () => {
  assert.equal(longevityLabel([6, 8]), '6 to 8 hours');
  assert.equal(longevityLabel([12, 12]), '12 hours');
  assert.equal(longevityLabel([1, 1]), '1 hour');
});
