import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { create, slugify, templates } from './new.mjs';

const root = () => mkdtempSync(join(tmpdir(), 'caskscents-new-'));

test('slugs are lowercase, hyphenated and accent free', () => {
  assert.equal(slugify('Lagavulin 16'), 'lagavulin-16');
  assert.equal(slugify("Aberlour A'bunadh"), 'aberlour-a-bunadh');
  assert.equal(slugify('Tonka Impériale'), 'tonka-imperiale');
  assert.equal(slugify('  Glen & Co.  '), 'glen-and-co');
});

test('creates a draft whiskey file with the name and date filled in', () => {
  const dir = root();
  const { file, slug } = create({ kind: 'whiskey', name: 'Lagavulin 16', root: dir, today: '2026-11-20' });
  assert.equal(slug, 'lagavulin-16');
  assert.equal(file, join(dir, 'src/content/whiskeys/lagavulin-16.md'));
  const text = readFileSync(file, 'utf8');
  assert.match(text, /^---\ndraft: true\nname: "Lagavulin 16"\n/);
  assert.match(text, /reviewedDate: 2026-11-20/);
  assert.match(text, /ratingNotes:/);
});

test('creates fragrance and rundown files in their own folders', () => {
  const dir = root();
  const f = create({ kind: 'fragrance', name: 'Rouge Smoking', root: dir, today: '2026-11-20' });
  const r = create({ kind: 'rundown', name: 'The Islay Peat Showdown', root: dir, today: '2026-11-20' });
  assert.match(f.file, /src\/content\/fragrances\/rouge-smoking\.md$/);
  assert.match(r.file, /src\/content\/rundowns\/the-islay-peat-showdown\.md$/);
  assert.match(readFileSync(f.file, 'utf8'), /year: 2026/);
  assert.match(readFileSync(r.file, 'utf8'), /publishDate: 2026-11-20/);
});

test('refuses to overwrite an existing file', () => {
  const dir = root();
  create({ kind: 'whiskey', name: 'Lagavulin 16', root: dir });
  assert.throws(() => create({ kind: 'whiskey', name: 'Lagavulin 16', root: dir }), /already exists/);
});

test('explains an unknown kind or a missing name', () => {
  assert.throws(() => create({ kind: 'gin', name: 'x', root: root() }), /whiskey, fragrance, rundown or top5/);
  assert.throws(() => create({ kind: 'whiskey', name: '', root: root() }), /Give it a name/);
});

test('new reviews have no value score: value is a line of words, and a sample can be marked', () => {
  for (const kind of ['whiskey', 'fragrance']) {
    const text = templates[kind]('Some Bottle', '2026-11-24');
    assert.equal(/^ratings: \{[^}]*value/m.test(text), false);
    assert.equal(/^  value:/m.test(text), false);
    assert.match(text, /^value: "/m);
    assert.match(text, /^# source: sample/m);
  }
});

test('creates a Top 5 list with a rule to fill in and hand-set picks ready to switch on', () => {
  const root = mkdtempSync(join(tmpdir(), 'caskscents-new-'));
  const { file, slug } = create({ kind: 'top5', name: 'Vanilla fragrances', root, today: '2026-11-24' });
  assert.equal(slug, 'vanilla-fragrances');
  assert.equal(file, join(root, 'src', 'content', 'top5', 'vanilla-fragrances.md'));
  const text = readFileSync(file, 'utf8');
  assert.match(text, /^---\ndraft: true\ntitle: "Vanilla fragrances"\n/);
  assert.match(text, /^match: \{ accord: Vanilla \}/m);
  assert.match(text, /^# picks:/m);
  assert.match(text, /^publishDate: 2026-11-24$/m);
});
