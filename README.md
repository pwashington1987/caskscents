# CaskScents

Honest reviews of what you pour and what you wear. Whiskey and fragrance reviews, and side-by-side rundowns that name a winner for each reason you might be buying.

The site is built with [Astro](https://astro.build/) and published as plain static pages. The design and build plan live in `docs/superpowers/`.

**Status:** under construction. The foundation, the content format and the authoring commands are in place. The designed pages are being built milestone by milestone (see the plan).

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

## Add a rundown

```bash
npm run new rundown "The Islay Peat Showdown"
```

List two to four review file names under `items`, and two to four `picks` (the first one gets the gold rule). The score table and its notes are pulled from the reviews themselves. To word a note differently in one rundown, use `noteOverrides`.

The build checks that every bottle exists, belongs to the right world and is published, and it warns you when a "best overall" pick is not the highest-scoring bottle.

## The sample entries

Files whose names start with `sample-` are placeholders for development. They are all marked draft, so they never publish. Delete them whenever you like.

Until launch, the automatic deploy sets `PUBLIC_SHOW_DRAFTS=true` so the samples are visible on the preview site, marked as a preview and hidden from search engines. At launch, delete that line from `.github/workflows/deploy.yml`.

## Publishing

Every push to `main` runs the tests, builds the site and deploys it with GitHub Actions (`.github/workflows/deploy.yml`).

## Moving to your own domain

Set two values in the workflow's build step (or in `astro.config.mjs`):

- `SITE_URL` to the domain, such as `https://caskscents.com`
- `BASE_PATH` to `/`

Every internal link is built through one helper (`src/lib/href.ts`), so nothing else changes.
