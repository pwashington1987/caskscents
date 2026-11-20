import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findWorld, frameAround, levelFor, outputsFor, processPhoto, setImageLine } from './photo.mjs';

let sharp;
try {
  sharp = createRequire(import.meta.url)('sharp');
} catch {
  sharp = null;
}

const project = () => {
  const root = mkdtempSync(join(tmpdir(), 'caskscents-photo-'));
  mkdirSync(join(root, 'src/content/whiskeys'), { recursive: true });
  mkdirSync(join(root, 'src/content/fragrances'), { recursive: true });
  writeFileSync(
    join(root, 'src/content/whiskeys/lagavulin-16.md'),
    '---\ndraft: true\nname: "Lagavulin 16"\nsummary: "Smoke."\n# image: /bottles/whiskey/lagavulin-16.webp   # add after running: npm run photo\nratings: {}\n---\n\nText.\n',
  );
  writeFileSync(join(root, 'src/content/fragrances/grey-suede.md'), '---\nname: "Grey Suede"\nsummary: "Iris."\n---\n\nText.\n');
  return root;
};

test('finds which world a review belongs to', () => {
  const root = project();
  assert.equal(findWorld(root, 'lagavulin-16'), 'whiskey');
  assert.equal(findWorld(root, 'grey-suede'), 'fragrance');
  assert.equal(findWorld(root, 'nope'), null);
});

test('names the three files it writes', () => {
  assert.deepEqual(outputsFor('whiskey', 'lagavulin-16'), {
    image: '/bottles/whiskey/lagavulin-16.webp',
    small: '/bottles/whiskey/lagavulin-16-sm.webp',
    card: '/bottles/whiskey/lagavulin-16-card.jpg',
  });
});

test('switches on the commented image line from the template', () => {
  const before = '---\nname: "A"\n# image: /bottles/whiskey/a.webp   # add after running: npm run photo\nratings: {}\n---\n\nBody\n';
  assert.equal(
    setImageLine(before, '/bottles/whiskey/a.webp'),
    '---\nname: "A"\nimage: /bottles/whiskey/a.webp\nratings: {}\n---\n\nBody\n',
  );
});

test('replaces an existing image line and adds one when there is none', () => {
  assert.equal(setImageLine('---\nimage: /old.webp\n---\nBody\n', '/new.webp'), '---\nimage: /new.webp\n---\nBody\n');
  assert.equal(setImageLine('---\nname: "A"\n---\nBody image: no\n', '/new.webp'), '---\nname: "A"\nimage: /new.webp\n---\nBody image: no\n');
});

test('a dark background is pulled down to the page color and white stays white', () => {
  const level = levelFor(60, 20);
  assert.equal(Math.round(60 * level.a + level.b), 20);
  assert.equal(Math.round(255 * level.a + level.b), 255);
  assert.deepEqual(levelFor(10, 20), { a: 1, b: 0 });
});

test('the cut is 2:3, centered on the bottle, and the bottle fills about four fifths of it', () => {
  const frame = frameAround({ width: 3000, height: 4000, box: { left: 1300, top: 1500, width: 400, height: 1200 } });
  assert.equal(frame.height, 1500);
  assert.equal(frame.width, 1000);
  assert.equal(frame.left, 1000);
  assert.equal(frame.top, 1350);
});

test('a wide bottle sets the cut by its width, and the cut never leaves the photo', () => {
  const wide = frameAround({ width: 3000, height: 4000, box: { left: 1000, top: 1500, width: 1400, height: 1200 } });
  assert.equal(wide.width, 2000);
  assert.equal(wide.height, 3000);
  const corner = frameAround({ width: 1500, height: 1200, box: { left: 0, top: 0, width: 300, height: 1100 } });
  assert.deepEqual(corner, { left: 0, top: 0, width: 800, height: 1200 });
});

test('writes a 2:3 photo, a small copy and a share card, and updates the review', { skip: !sharp }, async () => {
  const root = project();
  const source = join(root, 'shot.png');
  // A dark grey studio background with a bright "bottle" in the middle, shot in landscape.
  await sharp({ create: { width: 1500, height: 1200, channels: 3, background: { r: 52, g: 46, b: 44 } } })
    .composite([{ input: { create: { width: 300, height: 800, channels: 3, background: { r: 230, g: 180, b: 90 } } }, left: 600, top: 200 }])
    .png()
    .toFile(source);

  const result = await processPhoto({ root, slug: 'lagavulin-16', file: source });
  assert.equal(result.world, 'whiskey');
  assert.equal(result.warning, null);

  const main = await sharp(join(root, 'public/bottles/whiskey/lagavulin-16.webp')).metadata();
  assert.deepEqual([main.width, main.height], [800, 1200]);
  const small = await sharp(join(root, 'public/bottles/whiskey/lagavulin-16-sm.webp')).metadata();
  assert.deepEqual([small.width, small.height], [320, 480]);
  const card = await sharp(join(root, 'public/bottles/whiskey/lagavulin-16-card.jpg')).metadata();
  assert.deepEqual([card.width, card.height], [1200, 630]);

  // The corner is background: it must be no brighter than the page color (20, 16, 13), give or take compression.
  const { data } = await sharp(join(root, 'public/bottles/whiskey/lagavulin-16.webp')).extract({ left: 4, top: 4, width: 8, height: 8 }).raw().toBuffer({ resolveWithObject: true });
  assert.ok(data[0] <= 26 && data[1] <= 22 && data[2] <= 19, `corner is ${data[0]},${data[1]},${data[2]}`);
  // The middle is still the bright bottle.
  const mid = await sharp(join(root, 'public/bottles/whiskey/lagavulin-16.webp')).extract({ left: 396, top: 596, width: 8, height: 8 }).raw().toBuffer();
  assert.ok(mid[0] > 200);
  // The bottle was 800 of 1200 pixels tall in the shot; after the cut it fills about four fifths of the height.
  const column = await sharp(join(root, 'public/bottles/whiskey/lagavulin-16.webp')).extract({ left: 400, top: 0, width: 1, height: 1200 }).raw().toBuffer();
  let bright = 0;
  for (let y = 0; y < 1200; y++) if (column[y * 3] > 150) bright++;
  assert.ok(bright > 900 && bright < 1020, `bottle is ${bright} pixels tall`);

  const review = readFileSync(join(root, 'src/content/whiskeys/lagavulin-16.md'), 'utf8');
  assert.match(review, /^image: \/bottles\/whiskey\/lagavulin-16\.webp$/m);
});

test('warns when the background is too bright to blend', { skip: !sharp }, async () => {
  const root = project();
  const source = join(root, 'bright.png');
  await sharp({ create: { width: 800, height: 1200, channels: 3, background: { r: 235, g: 235, b: 230 } } }).png().toFile(source);
  const result = await processPhoto({ root, slug: 'grey-suede', file: source });
  assert.match(result.warning, /background/i);
  assert.ok(existsSync(join(root, 'public/bottles/fragrance/grey-suede.webp')));
});

test('says so plainly when the review or the photo does not exist', async () => {
  const root = project();
  await assert.rejects(processPhoto({ root, slug: 'nope', file: 'x.jpg' }), /no review called "nope"/i);
  await assert.rejects(processPhoto({ root, slug: 'grey-suede', file: join(root, 'missing.jpg') }), /cannot find the photo/i);
});
