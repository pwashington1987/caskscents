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
