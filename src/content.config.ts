/**
 * The shape of every review and rundown. A file that does not fit stops the
 * build with a message naming the file and the field.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { vocabMessage } from './lib/vocab.ts';
import { ACCORD_LABELS } from './data/accords.ts';
import { NOTES } from './data/notes.ts';
import { FLAVORS, REGION_LABELS, TYPE_LABELS, WHISKEY_TAGS } from './data/whiskey.ts';
import { AUDIENCES, CONCENTRATIONS, FRAGRANCE_TAGS, PROJECTIONS } from './data/fragrance.ts';

/** A value that must come from one of the fixed word lists in src/data/. */
const vocab = (kind: string, list: readonly string[], file: string) =>
  z.string().superRefine((value, ctx) => {
    const message = vocabMessage(kind, value, list, file);
    if (message) ctx.addIssue({ code: 'custom', message });
  });

const score = z
  .number()
  .min(0, 'Scores run from 0 to 10.')
  .max(10, 'Scores run from 0 to 10.')
  .refine((n) => Math.abs(n * 10 - Math.round(n * 10)) < 1e-9, 'Use one decimal place, such as 8.4.');

const note = z.string().min(1).max(160, 'Keep a score note to one or two short lines (160 characters).');
const NO_VALUE_SCORE =
  'Value is not scored. Take "value" out of ratings and ratingNotes, and say whether it is worth the money in words, on a line of its own: value: "..."';
const percent = z.number().min(0).max(100);
const level = z.number().int().min(1).max(5);
const summary = z.string().min(1).max(160, 'Keep the summary to one line (160 characters).');
const price = z.number().positive();
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use the review file name without ".md".');

const shared = {
  // What the review was made from. A sample is reviewed the same way, and says so on the page.
  source: z.enum(['bottle', 'sample'], { errorMap: () => ({ message: 'Use "bottle" or "sample".' }) }).default('bottle'),
  // Whether it is worth the money, in words. Shown beside the scores, never counted in them.
  value: z.string().min(1).max(240, 'Keep the value note to two or three short lines (240 characters).').optional(),
  shortName: z.string().max(16, 'Keep the short name to 16 characters; it labels narrow table columns.').optional(),
  currency: z.string().default('USD'),
  batch: z.string().optional(),
  summary,
  image: z.string().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  reviewedDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
};

const whiskeys = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/whiskeys' }),
  schema: z.object({
    ...shared,
    name: z.string().min(1),
    distillery: z.string().min(1),
    region: vocab('region', REGION_LABELS, 'src/data/whiskey.ts'),
    country: z.string().min(1),
    type: vocab('type', TYPE_LABELS, 'src/data/whiskey.ts'),
    age: z.number().int().positive().nullable(),
    abv: z.number().min(20).max(80),
    price,
    bottledYear: z.number().int().optional(),
    ratings: z.object({ nose: score, palate: score, finish: score, overall: score }).strict(NO_VALUE_SCORE),
    ratingNotes: z.object({ nose: note, palate: note, finish: note }).strict(NO_VALUE_SCORE),
    flavorProfile: z
      .array(
        z.object({
          label: vocab('flavor', FLAVORS, 'src/data/whiskey.ts'),
          intensity: percent,
        }),
      )
      .min(3)
      .max(6),
    tastingNotes: z.object({ nose: z.string(), palate: z.string(), finish: z.string() }),
    profile: z.object({ peat: level, sweetness: level }),
    tags: z.array(vocab('tag', WHISKEY_TAGS, 'src/data/whiskey.ts')).default([]),
  }),
});

const fragrances = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/fragrances' }),
  schema: z.object({
    ...shared,
    name: z.string().min(1),
    house: z.string().min(1),
    year: z.number().int().min(1700).max(2100),
    concentration: vocab('concentration', CONCENTRATIONS, 'src/data/fragrance.ts'),
    audience: vocab('audience', AUDIENCES, 'src/data/fragrance.ts'),
    price,
    volumeMl: z.number().positive(),
    // The bottle is only scored when the review came from a full bottle (checked below).
    ratings: z
      .object({ scent: score, longevity: score, sillage: score, bottle: score.optional(), overall: score })
      .strict(NO_VALUE_SCORE),
    ratingNotes: z
      .object({ scent: note, longevity: note, sillage: note, bottle: note.optional() })
      .strict(NO_VALUE_SCORE),
    accords: z
      .array(
        z.object({
          label: vocab('accord', ACCORD_LABELS, 'src/data/accords.ts'),
          weight: percent,
        }),
      )
      .min(3)
      .max(8),
    pyramid: z.object({
      top: z.array(vocab('note', NOTES, 'src/data/notes.ts')).min(1),
      heart: z.array(vocab('note', NOTES, 'src/data/notes.ts')).min(1),
      base: z.array(vocab('note', NOTES, 'src/data/notes.ts')).min(1),
    }),
    profile: z.object({
      longevityHours: z
        .tuple([z.number().positive(), z.number().positive()])
        .refine(([min, max]) => min <= max, 'Write the shorter time first, such as [6, 8].'),
      projection: vocab('projection', PROJECTIONS, 'src/data/fragrance.ts'),
      seasons: z.object({ winter: percent, spring: percent, summer: percent, autumn: percent }),
      day: percent,
    }),
    wearsTested: z.number().int().positive(),
    bestFor: z.string().min(1).max(160),
    tags: z.array(vocab('tag', FRAGRANCE_TAGS, 'src/data/fragrance.ts')).default([]),
  }).superRefine((review, ctx) => {
    const scored = review.ratings.bottle !== undefined;
    const explained = review.ratingNotes.bottle !== undefined;
    if (review.source === 'bottle' && !scored) {
      ctx.addIssue({
        code: 'custom',
        path: ['ratings', 'bottle'],
        message: 'Add a bottle score. If you reviewed it from a sample, add the line "source: sample" and the bottle score can be left out.',
      });
    }
    if (scored !== explained) {
      ctx.addIssue({
        code: 'custom',
        path: [scored ? 'ratingNotes' : 'ratings', 'bottle'],
        message: 'The bottle needs both a score (in ratings) and a note saying why (in ratingNotes), or neither.',
      });
    }
  }),
});

const rundowns = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/rundowns' }),
  schema: z.object({
    title: z.string().min(1),
    category: z.enum(['whiskey', 'fragrance']),
    items: z.array(slug).min(2, 'A rundown compares 2 to 4 bottles.').max(4, 'A rundown compares 2 to 4 bottles.'),
    picks: z
      .array(z.object({ useCase: z.string().min(1), winner: slug, why: z.string().min(1).max(200) }))
      .min(2, 'Give 2 to 4 picks.')
      .max(4, 'Give 2 to 4 picks.'),
    noteOverrides: z.record(z.string(), z.record(z.string(), note)).optional(),
    summary,
    readMinutes: z.number().int().positive().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    publishDate: z.coerce.date(),
  }),
});

/** Plain pages written in Markdown, such as About. */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().max(160, 'Keep the description to one line (160 characters).').optional(),
  }),
});

/**
 * Top 5 lists. A list has either a `match` rule (ranked by score) or five
 * `picks` (set by hand). The words in a rule are checked against the word
 * lists when the site builds, in src/lib/top5.ts.
 */
const top5 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/top5' }),
  schema: z.object({
    title: z.string().min(1),
    category: z.enum(['whiskey', 'fragrance']),
    of: z.enum(['bottles', 'houses', 'distilleries']).default('bottles'),
    intro: z.string().max(200, 'Keep the intro to one or two lines (200 characters).').optional(),
    match: z
      .object({
        accord: z.string(),
        tag: z.string(),
        house: z.string(),
        family: z.string(),
        concentration: z.string(),
        audience: z.string(),
        age: z.number().int().positive(),
        region: z.string(),
        type: z.string(),
        distillery: z.string(),
        maxPrice: z.number().positive(),
      })
      .partial()
      .strict('A rule can use: accord, tag, house, family, concentration, audience, age, region, type, distillery, maxPrice.')
      .optional(),
    picks: z
      .array(
        z
          .object({
            review: slug.optional(),
            name: z.string().min(1).optional(),
            why: z.string().max(200, 'Keep the reason to one or two lines (200 characters).').optional(),
          })
          .strict('A pick can have: review, name, why.'),
      )
      .optional(),
    draft: z.boolean().default(false),
    publishDate: z.coerce.date(),
  }),
});

export const collections = { whiskeys, fragrances, rundowns, pages, top5 };
