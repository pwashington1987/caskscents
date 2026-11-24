/** Values the site works out from what the author typed. Nothing here is authored. */

export type Band = { level: 1 | 2 | 3 | 4 | 5; label: string };

export function strengthBand(abv: number): Band {
  if (abv < 43) return { level: 1, label: 'Light' };
  if (abv < 46) return { level: 2, label: 'Standard' };
  if (abv < 50) return { level: 3, label: 'Full' };
  if (abv < 55) return { level: 4, label: 'High' };
  return { level: 5, label: 'Cask strength' };
}

export function priceTier(price: number): Band {
  if (price < 40) return { level: 1, label: 'Under $40' };
  if (price < 70) return { level: 2, label: '$40 to $70' };
  if (price < 120) return { level: 3, label: '$70 to $120' };
  if (price < 200) return { level: 4, label: '$120 to $200' };
  return { level: 5, label: '$200 and up' };
}

const WHISKEY_COUNTRIES = new Set(['united states', 'usa', 'us', 'america', 'ireland']);

/** "whiskey" for the United States and Ireland, "whisky" everywhere else. */
export function spellingFor(country: string): 'whiskey' | 'whisky' {
  return WHISKEY_COUNTRIES.has(country.trim().toLowerCase()) ? 'whiskey' : 'whisky';
}

function channel(hex: string, at: number): number {
  const c = parseInt(hex.slice(at, at + 2), 16) / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  return 0.2126 * channel(h, 0) + 0.7152 * channel(h, 2) + 0.0722 * channel(h, 4);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const INK = '#14100D';
export const BONE = '#EEE6D8';

/** Text color for a label sitting on a colored bar: whichever reads better. */
export function labelColorOn(background: string): string {
  return contrastRatio(INK, background) >= contrastRatio(BONE, background) ? INK : BONE;
}

export function roundScore(n: number): number {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

export function subscoreMean(ratings: Record<string, number | undefined>): number {
  const subs = Object.entries(ratings)
    .filter(([k]) => k !== 'overall')
    .map(([, v]) => v)
    .filter((v): v is number => v !== undefined);
  return subs.reduce((sum, v) => sum + v, 0) / subs.length;
}

export function longevityLabel([min, max]: [number, number] | number[]): string {
  if (min === max) return `${min} ${min === 1 ? 'hour' : 'hours'}`;
  return `${min} to ${max} hours`;
}
