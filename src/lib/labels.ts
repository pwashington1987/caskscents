/** How facts are worded on the page. */
import { TYPES } from '../data/whiskey.ts';
import { spellingFor } from './derive.ts';

const needsNoun = new Map(TYPES.map((t) => [t.label, t.addNoun]));

/** "Single malt" in Scotland reads "Single malt whisky"; "Bourbon" stays "Bourbon". */
export function whiskeyTypeLabel(type: string, country: string): string {
  return needsNoun.get(type) ? `${type} ${spellingFor(country)}` : type;
}

export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatAbv(abv: number): string {
  return `${abv}%`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

const TAG_LABELS: Record<string, string> = {
  'under-50': 'Under $50',
  'under-100': 'Under $100',
};

/** "bottled-in-bond" reads "Bottled in bond". */
export function tagLabel(tag: string): string {
  if (TAG_LABELS[tag]) return TAG_LABELS[tag];
  const words = tag.replace(/-/g, ' ');
  return words[0].toUpperCase() + words.slice(1);
}

export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
