#!/usr/bin/env node
/**
 * Creates a new review or rundown with every field already in place.
 *
 *   npm run new whiskey "Lagavulin 16"
 *   npm run new fragrance "Rouge Smoking"
 *   npm run new rundown "The Islay Peat Showdown"
 *
 * The new file is marked draft, so it never publishes until you remove that line.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const FOLDERS = { whiskey: 'whiskeys', fragrance: 'fragrances', rundown: 'rundowns' };

export function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const quote = (text) => JSON.stringify(text);

export const templates = {
  whiskey: (name, today) => `---
draft: true
name: ${quote(name)}
distillery: "Distillery name"
region: Islay            # one of the regions in src/data/whiskey.ts
country: Scotland
type: Single malt        # one of the types in src/data/whiskey.ts
age: 16                  # a number, or null when there is no age statement
abv: 43
price: 100               # what you paid, in dollars
# batch: ""              # optional
# bottledYear: 2024      # optional
summary: "One line shown on cards and in search results."
# image: /bottles/whiskey/${slugify(name)}.webp   # add after running: npm run photo
ratings: { nose: 0.0, palate: 0.0, finish: 0.0, value: 0.0, overall: 0.0 }
ratingNotes:
  nose: "One or two lines on why the nose earns its score."
  palate: "One or two lines on why the palate earns its score."
  finish: "One or two lines on why the finish earns its score."
  value: "One or two lines on why the value earns its score."
flavorProfile:           # 3 to 6, labels from src/data/whiskey.ts, intensity 0 to 100
  - { label: Peat and smoke, intensity: 50 }
  - { label: Sweet and sherry, intensity: 50 }
  - { label: Vanilla and oak, intensity: 50 }
tastingNotes:
  nose: ""
  palate: ""
  finish: ""
profile: { peat: 3, sweetness: 3 }   # each 1 to 5
tags: []                 # from src/data/whiskey.ts, such as [peated, sherried]
featured: false
reviewedDate: ${today}
---

Write the review here.
`,

  fragrance: (name, today) => `---
draft: true
name: ${quote(name)}
house: "House name"
year: ${today.slice(0, 4)}
concentration: Eau de Parfum   # one of the concentrations in src/data/fragrance.ts
audience: Unisex               # Unisex, Women or Men
price: 100                     # what you paid, in dollars
volumeMl: 100
# batch: ""                    # optional
summary: "One line shown on cards and in search results."
# image: /bottles/fragrance/${slugify(name)}.webp   # add after running: npm run photo
ratings: { scent: 0.0, longevity: 0.0, sillage: 0.0, bottle: 0.0, value: 0.0, overall: 0.0 }
ratingNotes:
  scent: "One or two lines on why the scent earns its score."
  longevity: "One or two lines on why the longevity earns its score."
  sillage: "One or two lines on why the sillage earns its score."
  bottle: "One or two lines on why the bottle earns its score."
  value: "One or two lines on why the value earns its score."
accords:                       # 3 to 8, labels from src/data/accords.ts, weight 0 to 100
  - { label: Vanilla, weight: 100 }
  - { label: Sweet, weight: 80 }
  - { label: Woody, weight: 60 }
pyramid:                       # note names from src/data/notes.ts
  top: [Bergamot]
  heart: [Rose]
  base: [Vanilla]
profile:
  longevityHours: [6, 8]       # shortest and longest you got
  projection: "Arm's length"   # Skin, Arm's length or Room
  seasons: { winter: 50, spring: 50, summer: 50, autumn: 50 }   # each 0 to 100
  day: 50                      # 0 is all night, 100 is all day
wearsTested: 1
bestFor: "One line on when to wear it."
tags: []                       # from src/data/fragrance.ts, such as [niche, date-night]
featured: false
reviewedDate: ${today}
---

Write the review here.
`,

  rundown: (name, today) => `---
draft: true
title: ${quote(name)}
category: whiskey              # whiskey or fragrance
items: [first-review, second-review]   # 2 to 4 review file names, without .md
picks:                         # 2 to 4, the first one gets the gold rule
  - useCase: Best overall
    winner: first-review
    why: "One sentence on why."
  - useCase: Best value
    winner: second-review
    why: "One sentence on why."
# noteOverrides:               # optional: replace a review's score note in this rundown only
#   first-review:
#     nose: "Different wording for this comparison."
summary: "One line shown on cards and in search results."
# readMinutes: 10              # optional
featured: false
publishDate: ${today}
---

Write the story of the comparison here.
`,
};

export function create({ kind, name, root = process.cwd(), today = new Date().toISOString().slice(0, 10) }) {
  const folder = FOLDERS[kind];
  if (!folder) {
    throw new Error(`"${kind}" is not something I can create. Use whiskey, fragrance or rundown.`);
  }
  const slug = slugify(name ?? '');
  if (!slug) {
    throw new Error(`Give it a name in quotes, like: npm run new ${kind} "Lagavulin 16"`);
  }
  const dir = join(root, 'src', 'content', folder);
  const file = join(dir, `${slug}.md`);
  if (existsSync(file)) {
    throw new Error(`${file} already exists. I will not overwrite it.`);
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, templates[kind](name, today));
  return { file, slug };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const [kind, ...rest] = process.argv.slice(2);
  try {
    const { file, slug } = create({ kind, name: rest.join(' ') });
    console.log(`Created ${file}`);
    console.log('It is marked draft: it shows while you run "npm run dev" and never publishes.');
    if (kind !== 'rundown') {
      console.log(`Photo: npm run photo ${slug} path/to/your-photo.jpg`);
    }
    console.log('When it is ready, delete the "draft: true" line.');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
