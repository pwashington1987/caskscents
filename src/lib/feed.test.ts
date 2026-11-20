import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFeed, escapeXml } from './feed.ts';

const base = {
  title: 'CaskScents Whiskey',
  description: 'New whiskey reviews and rundowns.',
  link: 'https://caskscents.com/whiskey/',
  self: 'https://caskscents.com/whiskey/rss.xml',
};

test('special characters are escaped', () => {
  assert.equal(escapeXml(`Glen & Co <"16"> 'old'`), 'Glen &amp; Co &lt;&quot;16&quot;&gt; &apos;old&apos;');
});

test('an empty feed is still a valid channel', () => {
  const xml = buildFeed({ ...base, items: [] });
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<title>CaskScents Whiskey<\/title>/);
  assert.match(xml, /<atom:link href="https:\/\/caskscents.com\/whiskey\/rss.xml" rel="self"/);
  assert.equal(xml.includes('<item>'), false);
});

test('items are listed newest first with a link, a date and a kind', () => {
  const xml = buildFeed({
    ...base,
    items: [
      { title: 'Older & wiser', link: 'https://caskscents.com/a/', description: 'First.', date: new Date('2026-11-01T00:00:00Z'), kind: 'Review' },
      { title: 'Newer', link: 'https://caskscents.com/b/', description: 'Second.', date: new Date('2026-11-20T00:00:00Z'), kind: 'Rundown' },
    ],
  });
  assert.ok(xml.indexOf('<title>Newer</title>') < xml.indexOf('<title>Older &amp; wiser</title>'));
  assert.match(xml, /<guid isPermaLink="true">https:\/\/caskscents.com\/b\/<\/guid>/);
  assert.match(xml, /<pubDate>Fri, 20 Nov 2026 00:00:00 GMT<\/pubDate>/);
  assert.match(xml, /<category>Rundown<\/category>/);
});

test('a long feed keeps only the newest 30', () => {
  const items = Array.from({ length: 40 }, (_, i) => ({
    title: `Bottle ${i}`,
    link: `https://caskscents.com/${i}/`,
    description: 'x',
    date: new Date(Date.UTC(2026, 0, i + 1)),
    kind: 'Review' as const,
  }));
  const xml = buildFeed({ ...base, items });
  assert.equal(xml.match(/<item>/g)?.length, 30);
  assert.ok(xml.includes('Bottle 39'));
  assert.equal(xml.includes('<title>Bottle 9</title>'), false);
});
