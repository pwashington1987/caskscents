/**
 * Finds the extra files "npm run photo" writes beside a bottle photo.
 * Runs while the site is being built, so a missing file is simply left out.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const exists = (path: string) => existsSync(join(process.cwd(), 'public', path));

const variant = (image: string | undefined, ending: string): string | undefined => {
  if (!image || !image.endsWith('.webp')) return undefined;
  const path = image.replace(/\.webp$/, ending);
  return exists(path) ? path : undefined;
};

/** The small copy used in lists. */
export const smallPhoto = (image?: string) => variant(image, '-sm.webp');
/** The picture shown when the review is shared. */
export const shareCard = (image?: string) => variant(image, '-card.jpg');
