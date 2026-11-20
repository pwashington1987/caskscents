# CaskScents

Honest reviews of what you pour and what you wear. Whiskey and fragrance reviews, and side-by-side rundowns that name a winner for each reason you might be buying.

The site is built with [Astro](https://astro.build/) and published as plain static pages. The design and build plan live in `docs/superpowers/`.

**Status:** built and running on the preview address, with sample entries standing in for real reviews. Left to do before launch: a final quality pass, your About text and your first real reviews.

## Run it on your computer

Requires [Node.js](https://nodejs.org/) 22.18 or newer.

```bash
npm install
npm run dev        # the site at http://localhost:4321/caskscents/
npm test           # the unit tests
npm run check      # type and template check
npm run build      # the production site, into dist/
npm run links      # checks every internal link in dist/
```

## Add a review

```bash
npm run new whiskey "Lagavulin 16"
npm run new fragrance "Rouge Smoking"
```

This creates a file in `src/content/whiskeys/` or `src/content/fragrances/` with every field in place. Fill in the blanks, then write the review underneath.

- **Scores** run from 0 to 10 with one decimal. Each score has a one or two line note saying why.
- **Fixed word lists.** Regions, types, flavors, accords, notes and tags must come from the lists in `src/data/`. If you misspell one, the build stops and tells you the file, the field and the closest valid spelling. To use a new word, add a line to the list.
- **Drafts.** A new file starts with `draft: true`. Drafts show while you run `npm run dev` and are never published. Delete that line when the review is ready.

## Add a bottle photo

```bash
npm run photo lagavulin-16 ~/Pictures/lagavulin.jpg
```

Use the review's file name without `.md`, then the path to your photo. The command:

- cuts the photo to the site's 2:3 shape, with the bottle filling most of it
- darkens the background to the page color, so the bottle blends in with no box around it
- writes a large copy, a small copy for lists and a share card, into `public/bottles/`
- sets the `image:` line in the review for you

**Taking the photo.** Stand the bottle in front of something dark (a black card or cloth works) and light it from one side. If the background is too bright to blend, the command tells you. A review without a photo shows the gold line drawing for its world.

## Add a rundown

```bash
npm run new rundown "The Islay Peat Showdown"
```

List two to four review file names under `items`, and two to four `picks` (the first one gets the gold rule). The score table and its notes are pulled from the reviews themselves. To word a note differently in one rundown, use `noteOverrides`.

The build checks that every bottle exists, belongs to the right world and is published, and it warns you when a "best overall" pick is not the highest-scoring bottle.

Winners and scores from a rundown only ever appear on the rundown's own page. Lists, the gateway, feeds and share previews say which questions it answers, not who won. So keep the winner out of the rundown's `summary` line too.

## The About page

Write your text in `src/content/pages/about.md`, under the settings block at the top. Plain paragraphs work; `## A heading` makes a heading. While that file has no text, the site has no About page and no link to it. As soon as it has text, the page appears at `/about/` and the footer links to it.

The scoring page is `src/pages/about/scoring.astro`. Edit the wording there.

## Feeds, sharing and search

- **Feeds.** Each world has one: `/whiskey/rss.xml` and `/fragrance/rss.xml`.
- **Sharing.** Every page has a title, a description and a share picture. A review with a photo uses its own card; everything else uses the card for its world (`public/og/`).
- **Search engines.** Reviews carry `Review` structured data. A sitemap is built automatically.

## Email signup and visit counting

Both are off until you give them a name or a token. In `.github/workflows/deploy.yml`, remove the `#` in front of the line and fill it in:

- `PUBLIC_BUTTONDOWN_USERNAME`: your [Buttondown](https://buttondown.com/) newsletter name. The signup form then appears on the gateway. In Buttondown, add the two feeds above so new posts are emailed automatically.
- `PUBLIC_CF_ANALYTICS_TOKEN`: your [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) token. It is free and sets no cookies. Visits are not counted on the preview build.

## The sample entries

Files whose names start with `sample-` are placeholders for development. They are all marked draft, so they never publish. Delete them whenever you like.

Until launch, the automatic deploy sets `PUBLIC_SHOW_DRAFTS=true` so the samples are visible on the preview site, marked as a preview and hidden from search engines. At launch, delete that line from `.github/workflows/deploy.yml`.

## Publishing

Every push to `main` runs the tests, builds the site and publishes the result to the `gh-pages` branch (`.github/workflows/deploy.yml`). GitHub Pages serves that branch: in the repository's Settings, under Pages, choose "Deploy from a branch", then `gh-pages` and `/ (root)`.

## Moving to your own domain

Set two values in the workflow's build step (or in `astro.config.mjs`):

- `SITE_URL` to the domain, such as `https://caskscents.com`
- `BASE_PATH` to `/`

Every internal link is built through one helper (`src/lib/href.ts`), so nothing else changes.
