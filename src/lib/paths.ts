/** Where each kind of page lives. Pass the result through href() when linking. */
import type { World } from './validate.ts';

export const worldPath = (world: World) => `/${world}/`;
export const reviewPath = (world: World, id: string) => `/${world}/reviews/${id}/`;
export const rundownPath = (world: World, id: string) => `/${world}/rundowns/${id}/`;
export const worldTitle = (world: World) => (world === 'whiskey' ? 'Whiskey' : 'Fragrance');
export const shelfPath = (world: World) => `/${world}/reviews/`;
export const rundownsPath = (world: World) => `/${world}/rundowns/`;
export const browseIndexPath = (world: World, page: string) => `/${world}/${page}/`;
export const browsePath = (world: World, page: string, slug: string) => `/${world}/${page}/${slug}/`;
