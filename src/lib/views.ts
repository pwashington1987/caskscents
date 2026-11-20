/** Builds the page view for any review, whichever world it belongs to. */
import { fragranceView, whiskeyView, type ReviewView } from './review-view.ts';
import type { Review, Site } from './site.ts';
import type { World } from './validate.ts';

export function viewOf(entry: Review): ReviewView {
  return entry.collection === 'whiskeys' ? whiskeyView(entry.data) : fragranceView(entry.data);
}

export type Listed = { id: string; view: ReviewView };

/** Every visible review in a world, newest first, ready for cards and lists. */
export function listFor(site: Site, world: World): Listed[] {
  return site.reviews(world).map((entry) => ({ id: entry.id, view: viewOf(entry) }));
}
