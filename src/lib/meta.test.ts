import { test } from 'node:test';
import assert from 'node:assert/strict';
import { absoluteUrl, defaultCard, hasText, isoDate, jsonLdText, reviewJsonLd, rundownJsonLd } from './meta.ts';

test('absolute addresses include the site and the base path', () => {
  assert.equal(
    absoluteUrl('https://pwashington1987.github.io', '/caskscents', '/whiskey/'),
    'https://pwashington1987.github.io/caskscents/whiskey/',
  );
  assert.equal(absoluteUrl('https://caskscents.com', '/', '/og/home.jpg'), 'https://caskscents.com/og/home.jpg');
});

test('each world has its own default share card, and the rest share one', () => {
  assert.equal(defaultCard('whiskey'), '/og/whiskey.jpg');
  assert.equal(defaultCard('fragrance'), '/og/fragrance.jpg');
  assert.equal(defaultCard(null), '/og/home.jpg');
});

test('dates are written as year, month, day', () => {
  assert.equal(isoDate(new Date('2026-11-20T00:00:00Z')), '2026-11-20');
});

test('a review describes the bottle, the score out of 10 and the date', () => {
  const data = reviewJsonLd({
    name: 'Lagavulin 16',
    brand: 'Lagavulin',
    summary: 'Smoke and sherry.',
    url: 'https://caskscents.com/whiskey/reviews/lagavulin-16/',
    image: 'https://caskscents.com/og/whiskey.jpg',
    score: 9.1,
    date: new Date('2026-11-20T00:00:00Z'),
    world: 'whiskey',
  });
  assert.equal(data['@type'], 'Review');
  assert.equal(data.itemReviewed.name, 'Lagavulin 16');
  assert.equal(data.itemReviewed.brand.name, 'Lagavulin');
  assert.equal(data.itemReviewed.category, 'Whiskey');
  assert.deepEqual(data.reviewRating, { '@type': 'Rating', ratingValue: 9.1, bestRating: 10, worstRating: 0 });
  assert.equal(data.datePublished, '2026-11-20');
  assert.equal(data.author.name, 'CaskScents');
});

test('a rundown is described as an article and never names a winner', () => {
  const data = rundownJsonLd({
    title: 'Three for a Cold Night',
    summary: 'Two Islay malts and a bourbon.',
    url: 'https://caskscents.com/whiskey/rundowns/three/',
    image: 'https://caskscents.com/og/whiskey.jpg',
    date: new Date('2026-11-20T00:00:00Z'),
  });
  assert.equal(data['@type'], 'Article');
  assert.equal(data.headline, 'Three for a Cold Night');
  assert.deepEqual(Object.keys(data).filter((k) => /winner|pick|rating/i.test(k)), []);
});

test('structured data cannot close its own script tag', () => {
  assert.equal(jsonLdText({ name: '</script><b>' }).includes('<'), false);
});

test('a page with only a comment or blank lines counts as empty', () => {
  assert.equal(hasText(undefined), false);
  assert.equal(hasText('  \n\n'), false);
  assert.equal(hasText('<!-- Write your About text below this line. -->\n'), false);
  assert.equal(hasText('<!-- note -->\n\nI live in Texas.'), true);
});
