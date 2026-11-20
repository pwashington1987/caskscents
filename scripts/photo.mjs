#!/usr/bin/env node
/**
 * Prepares a bottle photo for the site.
 *
 *   npm run photo lagavulin-16 ~/Pictures/lagavulin.jpg
 *
 * It cuts the photo to the site's 2:3 shape with the bottle filling most of
 * it, pulls a dark background down to the page color so the bottle blends in,
 * writes a large and a small copy plus a share card, and points the review at
 * the new photo.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FOLDERS = { whiskey: 'whiskeys', fragrance: 'fragrances' };
/** The page color (--ink). */
const INK = { r: 20, g: 16, b: 13 };
/** Above this brightness the background is not a dark backdrop, and will not blend. */
const TOO_BRIGHT = 110;
/** White in the middle, black at the left, right and bottom edges. Multiplied over the photo. */
const EDGE_FADE = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200">
  <defs>
    <linearGradient id="sides" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000"/><stop offset="0.1" stop-color="#fff"/>
      <stop offset="0.9" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
    </linearGradient>
    <linearGradient id="foot" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0.9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1200" fill="url(#sides)"/>
  <rect width="800" height="1200" fill="url(#foot)"/>
</svg>`;
const BRAND = join(dirname(fileURLToPath(import.meta.url)), 'assets', 'card-brand.png');

export function findWorld(root, slug) {
  for (const [world, folder] of Object.entries(FOLDERS)) {
    if (existsSync(join(root, 'src', 'content', folder, `${slug}.md`))) return world;
  }
  return null;
}

export function outputsFor(world, slug) {
  const base = `/bottles/${world}/${slug}`;
  return { image: `${base}.webp`, small: `${base}-sm.webp`, card: `${base}-card.jpg` };
}

/** Sets the `image:` line in a review's settings block, switching on the commented one from the template. */
export function setImageLine(markdown, imagePath) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return markdown;
  const settings = match[1];
  const line = `image: ${imagePath}`;
  const updated = /^#?\s*image:.*$/m.test(settings)
    ? settings.replace(/^#?\s*image:.*$/m, line)
    : `${settings}\n${line}`;
  return markdown.replace(match[0], `---\n${updated}\n---`);
}

/**
 * The brightness change that moves a background value down to the page
 * color while leaving pure white alone. Darker backgrounds are left as they are.
 */
export function levelFor(background, target) {
  if (background <= target) return { a: 1, b: 0 };
  const a = (255 - target) / (255 - background);
  return { a, b: target - background * a };
}

const median = (values) => {
  const sorted = [...values].sort((x, y) => x - y);
  return sorted[Math.floor(sorted.length / 2)];
};

/**
 * The 2:3 window to cut from a photo so the bottle fills most of it, wherever
 * it stood and however far back the camera was. `box` is where the bottle is.
 */
export function frameAround({ width, height, box }) {
  let frameHeight = Math.max(box.height / 0.8, (box.width / 0.7) * 1.5);
  let frameWidth = (frameHeight * 2) / 3;
  if (frameHeight > height) {
    frameHeight = height;
    frameWidth = (frameHeight * 2) / 3;
  }
  if (frameWidth > width) {
    frameWidth = width;
    frameHeight = frameWidth * 1.5;
  }
  const clamp = (value, max) => Math.min(Math.max(value, 0), max);
  const left = clamp(box.left + box.width / 2 - frameWidth / 2, width - frameWidth);
  const top = clamp(box.top + box.height / 2 - frameHeight / 2, height - frameHeight);
  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.floor(frameWidth),
    height: Math.floor(frameHeight),
  };
}

/** Finds the bottle: everything clearly brighter than the dark backdrop. Returns null when unsure. */
async function findBottle(image, width, height) {
  const w = 160;
  const h = Math.max(1, Math.round((height / width) * w));
  const data = await image.clone().resize(w, h, { fit: 'fill' }).removeAlpha().raw().toBuffer();
  const edge = [[], [], []];
  for (let y = 0; y < h * 0.66; y++) {
    for (let x = 0; x < w; x++) {
      if (!(y < 4 || x < 4 || x >= w - 4)) continue;
      const i = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) edge[c].push(data[i + c]);
    }
  }
  const bg = edge.map(median);
  const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const bgLuma = luma(bg[0], bg[1], bg[2]);
  if (bgLuma > TOO_BRIGHT) return null;

  const columns = new Array(w).fill(0);
  const rows = new Array(h).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      if (luma(data[i], data[i + 1], data[i + 2]) > bgLuma + 28) {
        columns[x]++;
        rows[y]++;
      }
    }
  }
  const span = (counts, least) => {
    const first = counts.findIndex((n) => n >= least);
    const last = counts.findLastIndex((n) => n >= least);
    return first === -1 ? null : [first, last + 1];
  };
  const xs = span(columns, Math.max(2, h * 0.02));
  const ys = span(rows, Math.max(2, w * 0.02));
  if (!xs || !ys) return null;
  const scale = width / w;
  const box = {
    left: xs[0] * scale,
    top: ys[0] * (height / h),
    width: (xs[1] - xs[0]) * scale,
    height: (ys[1] - ys[0]) * (height / h),
  };
  // A "bottle" that is a speck, or the whole picture, means the guess is not to be trusted.
  const share = (box.width * box.height) / (width * height);
  return share < 0.01 || share > 0.9 ? null : box;
}

/** The typical color along the top and upper sides of the photo, where the backdrop is. */
async function backgroundOf(image) {
  const width = 60;
  const height = 90;
  const data = await image.clone().resize(width, height, { fit: 'fill' }).removeAlpha().raw().toBuffer();
  const channels = [[], [], []];
  for (let y = 0; y < height * 0.66; y++) {
    for (let x = 0; x < width; x++) {
      const edge = y < 3 || x < 3 || x >= width - 3;
      if (!edge) continue;
      const i = (y * width + x) * 3;
      for (let c = 0; c < 3; c++) channels[c].push(data[i + c]);
    }
  }
  return { r: median(channels[0]), g: median(channels[1]), b: median(channels[2]) };
}

export async function processPhoto({ root = process.cwd(), slug, file }) {
  const world = findWorld(root, slug ?? '');
  if (!world) {
    throw new Error(
      `There is no review called "${slug}". Use the review's file name without ".md", such as: npm run photo lagavulin-16 photo.jpg`,
    );
  }
  if (!file || !existsSync(file)) {
    throw new Error(`I cannot find the photo "${file}". Check the path and try again.`);
  }
  const sharp = createRequire(import.meta.url)('sharp');
  const out = outputsFor(world, slug);
  const target = (path) => join(root, 'public', path);
  mkdirSync(dirname(target(out.image)), { recursive: true });

  // Turn it upright, then cut a 2:3 window around the bottle (or around the middle when it cannot be found).
  const upright = sharp(await sharp(file).rotate().removeAlpha().png().toBuffer());
  const size = await upright.metadata();
  const box = await findBottle(upright, size.width, size.height);
  const framed = box ? upright.clone().extract(frameAround({ width: size.width, height: size.height, box })) : upright.clone();
  const cropped = sharp(await framed.resize(800, 1200, { fit: 'cover' }).png().toBuffer());
  const background = await backgroundOf(cropped);
  const brightness = 0.2126 * background.r + 0.7152 * background.g + 0.0722 * background.b;

  let warning = null;
  let leveled = cropped;
  if (brightness > TOO_BRIGHT) {
    warning =
      'The background of this photo is too bright to blend into the page, so it will show as a pale box. ' +
      'Shoot the bottle against something dark (a black card or cloth works) with light from one side.';
  } else {
    const levels = [levelFor(background.r, INK.r), levelFor(background.g, INK.g), levelFor(background.b, INK.b)];
    leveled = sharp(
      await cropped
        .clone()
        .linear(
          levels.map((l) => l.a),
          levels.map((l) => l.b),
        )
        // Fade the side and bottom edges to dark, so a table or backdrop edge never shows as a hard line.
        .composite([{ input: Buffer.from(EDGE_FADE), blend: 'multiply' }])
        .png()
        .toBuffer(),
    );
  }

  await leveled.clone().webp({ quality: 82 }).toFile(target(out.image));
  await leveled.clone().resize(320, 480).webp({ quality: 80 }).toFile(target(out.small));

  // The share card: the bottle on the page color, with the name mark beside it.
  const layers = [{ input: await leveled.clone().resize(420, 630).png().toBuffer(), left: 690, top: 0, blend: 'lighten' }];
  if (existsSync(BRAND)) {
    const brand = await sharp(BRAND).metadata();
    layers.push({ input: BRAND, left: 130, top: Math.round((630 - brand.height) / 2) });
  }
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: INK } })
    .composite(layers)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(target(out.card));

  const review = join(root, 'src', 'content', FOLDERS[world], `${slug}.md`);
  writeFileSync(review, setImageLine(readFileSync(review, 'utf8'), out.image));

  return { world, outputs: out, review, warning };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [slug, file] = process.argv.slice(2);
  if (!slug || !file) {
    console.error('Use it like this: npm run photo lagavulin-16 path/to/your-photo.jpg');
    process.exit(1);
  }
  try {
    const { outputs, review, warning } = await processPhoto({ slug, file: resolve(file) });
    console.log(`Wrote public${outputs.image}, a small copy and a share card.`);
    console.log(`Updated the image line in ${review}`);
    if (warning) console.warn(`\nHeads up: ${warning}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
