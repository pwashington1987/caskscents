# CaskScents

Honest reviews of what you pour and what you wear. Whiskey and fragrance reviews, and side-by-side rundowns that name a winner for each reason you might be buying.

The site is built with [Astro](https://astro.build/) and published as plain static pages. The design and the build plan live in `docs/superpowers/`.

**Status:** built, and running at the preview address https://pwashington1987.github.io/caskscents/ with sample entries standing in for real reviews. What is left is yours: see the launch checklist at the end.

## How it works, in one minute

- Every review and rundown is one text file in `src/content/`. You fill in the blanks at the top and write underneath.
- When you save a change to GitHub (a "push" to `main`), the site rebuilds itself and goes live a couple of minutes later. Nothing else to do.
- If a file has a mistake, such as a misspelled word or a missing score, the build stops and tells you the file, the field and the fix. The live site stays as it was until you correct it.

## Set it up on your computer

You need [Node.js](https://nodejs.org/) 22.18 or newer. Then, in the project folder:

```bash
npm install
npm run dev        # the site at http://localhost:4321/caskscents/, updating as you type
```

Other commands you may want:

```bash
npm test           # the automatic tests
npm run check      # looks for mistakes in the page templates
npm run build      # builds the finished site into dist/
npm run links      # checks every link in dist/
```

If `npm install` ever fails with a message about a missing module, delete the `node_modules` folder and run it again.

## Add a review

```bash
npm run new whiskey "Lagavulin 16"
npm run new fragrance "Rouge Smoking"
```

This creates a file in `src/content/whiskeys/` or `src/content/fragrances/` with every field in place. Fill in the blanks, then write the review underneath.

- **Scores** run from 0 to 10 with one decimal. Each score has a one or two line note saying why (160 characters at most).
- **Fixed word lists.** Regions, types, flavors, accords, notes and tags must come from the lists in `src/data/`. If you misspell one, the build stops and suggests the closest valid spelling. To use a new word, add a line to the list.
- **Short name.** A long bottle name can have a `shortName` (16 characters at most). It labels the narrow columns in rundown tables.
- **Drafts.** A new file starts with `draft: true`. Drafts show while you run `npm run dev` and are never published. Delete that line when the review is ready.

No computer setup? You can also add a review on github.com: open an existing file in `src/content/`, copy its text, create a new file beside it and change the details. The build checks it the same way.

## Add a bottle photo

```bash
npm run photo lagavulin-16 ~/Pictures/lagavulin.jpg
```

Use the review's file name without `.md`, then the path to your photo. The command:

- cuts the photo to the site's 2:3 shape, with the bottle filling most of it
- darkens the background to the page color, so the bottle blends in with no box around it
- writes a large copy, a small copy for lists and a share card, into `public/bottles/`
- sets the `image:` line in the review for you

**Taking the photo.** Stand the bottle in front of something dark (a black card or cloth works) and light it from one side. Leave a little space around it. If the background is too bright to blend, the command tells you. A review without a photo shows the gold line drawing for its world.

## Add a rundown

```bash
npm run new rundown "The Islay Peat Showdown"
```

List two to four review file names under `items`, and two to four `picks` (the first one gets the gold rule). The score table and its notes are pulled from the reviews themselves. To word a note differently in one rundown, use `noteOverrides`.

The build checks that every bottle exists, belongs to the right world and is published, and it warns you when a "best overall" pick is not the highest-scoring bottle.

**Winners stay on the rundown page.** Lists, the gateway, feeds and share previews say which questions a rundown answers, never who won. So keep the winner out of the rundown's `summary` line too. The gateway also shows no scores at all; review scores appear from the whiskey and fragrance homepages onward.

## The About and scoring pages

- **About.** Write your text in `src/content/pages/about.md`, under the settings block at the top. Plain paragraphs work; `## A heading` makes a heading. While that file has no text, the site has no About page and no link to it. As soon as it has text, the page appears at `/about/` and the footer links to it.
- **How I score.** The wording is in `src/pages/about/scoring.astro`. It is a first draft: read it and change anything that is not how you score.

## Feeds, sharing and search

- **Feeds.** Each world has one: `/whiskey/rss.xml` and `/fragrance/rss.xml`.
- **Sharing.** Every page has a title, a description and a share picture. A review with a photo uses its own card; everything else uses the card for its world (`public/og/`).
- **Search engines.** Reviews carry `Review` structured data, and a sitemap is built automatically.

## Email signup and visit counting

Both are off until you give them a name or a token. In `.github/workflows/deploy.yml`, remove the `#` in front of the line and fill it in:

- `PUBLIC_BUTTONDOWN_USERNAME`: your [Buttondown](https://buttondown.com/) newsletter name. The signup form then appears on the gateway. In Buttondown, add the two feeds above so new posts are emailed automatically.
- `PUBLIC_CF_ANALYTICS_TOKEN`: your [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) token. It is free and sets no cookies. Visits are not counted on the preview build.

## The sample entries

Files whose names start with `sample-` are placeholders for development. They are all marked draft, so they never publish. Two of them carry photos (in `public/bottles/`) to show how photos sit on the pages.

Until launch, the automatic build sets `PUBLIC_SHOW_DRAFTS=true` so the samples are visible on the preview site, marked as a preview and hidden from search engines.

## What the automatic build does

Every push to `main` runs `.github/workflows/deploy.yml`, which:

1. runs the tests and the template check
2. builds the site and checks every link and share picture
3. builds the site a second time exactly as it will launch, with drafts hidden, and checks that too
4. publishes the result to the `gh-pages` branch, which GitHub Pages serves (Settings, then Pages: "Deploy from a branch", `gh-pages`, `/ (root)`)

The exact package versions are saved in `package-lock.json`, so a build next year uses the same tools as today.

## Moving to your own domain

1. In `.github/workflows/deploy.yml`, remove the `#` from the `SITE_URL` and `BASE_PATH` lines and put your domain in `SITE_URL`.
2. Create a file `public/CNAME` containing only the domain, such as `caskscents.com`.
3. Point the domain at GitHub Pages (GitHub's Pages settings walk you through it).

Every internal link is built through one helper (`src/lib/href.ts`), so nothing else changes.

## Launch checklist

1. Write your first real reviews, with photos.
2. Read the "How I score" page and the line on the gateway that begins "Every bottle here was bought", and correct anything that is not true for you.
3. Add your About text (optional: the site works without it).
4. Delete the `sample-` files from `src/content/` and their photos from `public/bottles/`.
5. In `.github/workflows/deploy.yml`, delete the line `PUBLIC_SHOW_DRAFTS: 'true'`. The preview banner goes, drafts are hidden, and search engines are allowed in.
6. Optional: switch on the email signup and visit counting, and move to your own domain.
7. Optional: in [Google Search Console](https://search.google.com/search-console), add the site and submit `sitemap-index.xml`.
