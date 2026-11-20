/** Builds the page view for any review, whichever world it belongs to. */
import { fragranceView, whiskeyView, type ReviewView } from './review-view.ts';
import type { Review } from './site.ts';

export function viewOf(entry: Review): ReviewView {
  return entry.collection === 'whiskeys' ? whiskeyView(entry.data) : fragranceView(entry.data);
}
