/**
 * What search engines and link previews read about a page: full addresses,
 * the share picture, and the structured description of a review or rundown.
 */
import { withBase } from './href.ts';
import type { World } from './validate.ts';

export const SITE_NAME = 'CaskScents';

/** A full address, such as https://caskscents.com/whiskey/. */
export function absoluteUrl(site: string | URL, base: string, path: string): string {
  return new URL(withBase(base, path), site).href;
}

/** The picture shown when a page is shared and has no bottle card of its own. */
export function defaultCard(world: World | null): string {
  return `/og/${world ?? 'home'}.jpg`;
}

export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

const publisher = { '@type': 'Organization', name: SITE_NAME } as const;

export function reviewJsonLd(input: {
  name: string;
  brand: string;
  summary: string;
  url: string;
  image: string;
  score: number;
  date: Date;
  world: World;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: `${input.name} review`,
    description: input.summary,
    url: input.url,
    datePublished: isoDate(input.date),
    author: publisher,
    publisher,
    itemReviewed: {
      '@type': 'Product',
      name: input.name,
      image: input.image,
      category: input.world === 'whiskey' ? 'Whiskey' : 'Fragrance',
      brand: { '@type': 'Brand', name: input.brand },
    },
    reviewRating: { '@type': 'Rating', ratingValue: input.score, bestRating: 10, worstRating: 0 },
  };
}

/** A rundown is described as an article. The winners stay on the page itself. */
export function rundownJsonLd(input: { title: string; summary: string; url: string; image: string; date: Date }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.summary,
    url: input.url,
    image: input.image,
    datePublished: isoDate(input.date),
    author: publisher,
    publisher,
  };
}

/** JSON that is safe to place inside a script tag. */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** True when a page's text is more than blank lines and comments. */
export function hasText(body: string | undefined): boolean {
  return (body ?? '').replace(/<!--[\s\S]*?-->/g, '').trim().length > 0;
}
