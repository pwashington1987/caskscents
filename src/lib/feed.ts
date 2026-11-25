/** Builds the RSS feed for one world. No scores and no winners: readers open the page for those. */
export type FeedItem = {
  title: string;
  link: string;
  description: string;
  date: Date;
  kind: 'Review' | 'Rundown' | 'Top 5';
};

const MAX_ITEMS = 30;

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildFeed(feed: {
  title: string;
  description: string;
  link: string;
  self: string;
  items: FeedItem[];
}): string {
  const items = [...feed.items].sort((a, b) => b.date.valueOf() - a.date.valueOf()).slice(0, MAX_ITEMS);
  const body = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <category>${item.kind}</category>
      <description>${escapeXml(item.description)}</description>
    </item>
`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feed.title)}</title>
    <link>${escapeXml(feed.link)}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(feed.self)}" rel="self" type="application/rss+xml" />
${body}  </channel>
</rss>
`;
}
