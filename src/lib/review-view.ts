/**
 * Turns a review's data into exactly what the review page shows, so the
 * whiskey and fragrance pages can share one template.
 */
import { accord } from '../data/accords.ts';
import { labelColorOn, longevityLabel, priceTier, strengthBand } from './derive.ts';
import { formatAbv, formatDate, formatPrice, formatScore, whiskeyTypeLabel } from './labels.ts';
import type { World } from './validate.ts';

type Shared = {
  name: string;
  price: number;
  currency: string;
  batch?: string;
  summary: string;
  image?: string;
  tags: string[];
  draft: boolean;
  reviewedDate: Date;
  updatedDate?: Date;
};

export type WhiskeyData = Shared & {
  distillery: string;
  region: string;
  country: string;
  type: string;
  age: number | null;
  abv: number;
  bottledYear?: number;
  ratings: { nose: number; palate: number; finish: number; value: number; overall: number };
  ratingNotes: { nose: string; palate: string; finish: string; value: string };
  flavorProfile: { label: string; intensity: number }[];
  tastingNotes: { nose: string; palate: string; finish: string };
  profile: { peat: number; sweetness: number };
};

export type FragranceData = Shared & {
  house: string;
  year: number;
  concentration: string;
  audience: string;
  volumeMl: number;
  ratings: { scent: number; longevity: number; sillage: number; bottle: number; value: number; overall: number };
  ratingNotes: { scent: string; longevity: string; sillage: string; bottle: string; value: string };
  accords: { label: string; weight: number }[];
  pyramid: { top: string[]; heart: string[]; base: string[] };
  profile: {
    longevityHours: [number, number];
    projection: string;
    seasons: { winter: number; spring: number; summer: number; autumn: number };
    day: number;
  };
  wearsTested: number;
  bestFor: string;
};

export type ScoreLine = { key: string; label: string; score: string; percent: number; note: string };
export type Bar = { label: string; percent: number; color?: string; textColor?: string };
export type NoteRow = { label: string; pills?: string[]; text?: string };
export type Tile = { label: string; value: string; level?: number };

export type ReviewView = {
  world: World;
  name: string;
  summary: string;
  image?: string;
  draft: boolean;
  meta: string[];
  overall: string;
  facts: string[];
  scores: ScoreLine[];
  bars: { title: string; style: 'filled' | 'thin'; items: Bar[] };
  notes: { title: string; rows: NoteRow[] };
  profile: {
    title: string;
    tiles: Tile[];
    seasons?: { label: string; percent: number }[];
    day?: number;
  };
  bestFor?: string;
  features: string[];
};

const capital = (word: string) => word[0].toUpperCase() + word.slice(1);

function scoreLines<K extends string>(
  keys: readonly K[],
  ratings: Record<K, number>,
  notes: Record<K, string>,
): ScoreLine[] {
  return keys.map((key) => ({
    key,
    label: capital(key),
    score: formatScore(ratings[key]),
    percent: Math.round(ratings[key] * 10),
    note: notes[key],
  }));
}

export function whiskeyView(d: WhiskeyData): ReviewView {
  const strength = strengthBand(d.abv);
  const tier = priceTier(d.price);
  const flavors = [...d.flavorProfile].sort((a, b) => b.intensity - a.intensity);
  return {
    world: 'whiskey',
    name: d.name,
    summary: d.summary,
    image: d.image,
    draft: d.draft,
    meta: [
      d.distillery,
      d.region,
      whiskeyTypeLabel(d.type, d.country),
      d.age === null ? 'No age statement' : `${d.age} years old`,
    ],
    overall: formatScore(d.ratings.overall),
    facts: [
      `${formatAbv(d.abv)} ABV`,
      formatPrice(d.price, d.currency),
      ...(d.batch ? [`Batch ${d.batch}`] : []),
      ...(d.bottledYear ? [`Bottled ${d.bottledYear}`] : []),
      `Reviewed ${formatDate(d.reviewedDate)}`,
    ],
    scores: scoreLines(['nose', 'palate', 'finish', 'value'] as const, d.ratings, d.ratingNotes),
    bars: {
      title: 'Flavor profile',
      style: 'thin',
      items: flavors.map((f) => ({ label: f.label, percent: f.intensity })),
    },
    notes: {
      title: 'Tasting notes',
      rows: [
        { label: 'Nose', text: d.tastingNotes.nose },
        { label: 'Palate', text: d.tastingNotes.palate },
        { label: 'Finish', text: d.tastingNotes.finish },
      ],
    },
    profile: {
      title: 'At a glance',
      tiles: [
        { label: 'Peat', value: `${d.profile.peat} of 5`, level: d.profile.peat },
        { label: 'Sweetness', value: `${d.profile.sweetness} of 5`, level: d.profile.sweetness },
        { label: 'Strength', value: strength.label, level: strength.level },
        { label: 'Price', value: tier.label, level: tier.level },
      ],
    },
    features: [...flavors.map((f) => f.label), ...d.tags, `region:${d.region}`, `type:${d.type}`],
  };
}

export function fragranceView(d: FragranceData): ReviewView {
  const accords = [...d.accords].sort((a, b) => b.weight - a.weight);
  const seasons = (['winter', 'spring', 'summer', 'autumn'] as const)
    .map((s) => ({ label: capital(s), percent: d.profile.seasons[s] }))
    .sort((a, b) => b.percent - a.percent);
  return {
    world: 'fragrance',
    name: d.name,
    summary: d.summary,
    image: d.image,
    draft: d.draft,
    meta: [d.house, String(d.year), d.concentration, d.audience],
    overall: formatScore(d.ratings.overall),
    facts: [
      `${formatPrice(d.price, d.currency)} for ${d.volumeMl} ml`,
      ...(d.batch ? [`Batch ${d.batch}`] : []),
      `Reviewed ${formatDate(d.reviewedDate)}`,
      d.wearsTested === 1 ? 'Worn once' : `Worn ${d.wearsTested} times`,
    ],
    scores: scoreLines(
      ['scent', 'longevity', 'sillage', 'bottle', 'value'] as const,
      d.ratings,
      d.ratingNotes,
    ),
    bars: {
      title: 'Main accords',
      style: 'filled',
      items: accords.map((a) => {
        const color = accord(a.label)?.color ?? '#9C9185';
        return { label: a.label, percent: a.weight, color, textColor: labelColorOn(color) };
      }),
    },
    notes: {
      title: 'Notes',
      rows: [
        { label: 'Top', pills: d.pyramid.top },
        { label: 'Heart', pills: d.pyramid.heart },
        { label: 'Base', pills: d.pyramid.base },
      ],
    },
    profile: {
      title: 'When to wear it',
      tiles: [
        { label: 'Lasts', value: longevityLabel(d.profile.longevityHours) },
        { label: 'Projects', value: d.profile.projection },
      ],
      seasons,
      day: d.profile.day,
    },
    bestFor: d.bestFor,
    features: [...accords.map((a) => a.label), ...d.tags, `house:${d.house}`],
  };
}
