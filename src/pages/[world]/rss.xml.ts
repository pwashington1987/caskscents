/** The feed for one world: /whiskey/rss.xml and /fragrance/rss.xml. */
import type { APIRoute } from 'astro';
import { getSite } from '../../lib/site.ts';
import { buildFeed, type FeedItem } from '../../lib/feed.ts';
import { absoluteUrl } from '../../lib/meta.ts';
import { feedPath, reviewPath, rundownPath, worldPath, worldTitle } from '../../lib/paths.ts';
import type { World } from '../../lib/validate.ts';

export function getStaticPaths() {
  return [{ params: { world: 'whiskey' } }, { params: { world: 'fragrance' } }];
}

export const GET: APIRoute = async ({ params, site }) => {
  const world = params.world as World;
  const content = await getSite();
  const url = (path: string) => absoluteUrl(site!, import.meta.env.BASE_URL, path);

  const items: FeedItem[] = [
    ...content.reviews(world).map((review) => ({
      title: `${review.data.name} review`,
      link: url(reviewPath(world, review.id)),
      description: review.data.summary,
      date: review.data.reviewedDate,
      kind: 'Review' as const,
    })),
    ...content.rundownsFor(world).map((rundown) => ({
      title: rundown.data.title,
      link: url(rundownPath(world, rundown.id)),
      description: rundown.data.summary,
      date: rundown.data.publishDate,
      kind: 'Rundown' as const,
    })),
  ];

  const xml = buildFeed({
    title: `CaskScents ${worldTitle(world)}`,
    description: `New ${world} reviews and rundowns from CaskScents.`,
    link: url(worldPath(world)),
    self: url(feedPath(world)),
    items,
  });
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
