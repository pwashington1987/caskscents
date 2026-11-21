# CaskScents: implementation plan

Date: 2026-11-20
Spec: `docs/superpowers/specs/2026-11-01-caskscents-redesign-design.md` (approved 2026-11-20)
Repository: `github.com/pwashington1987/caskscents` (new, empty)

## Goal

Build the site described in the spec as a static Astro project, deployed from GitHub, with three draft sample entries per collection so every page type can be seen and tested before real reviews exist.

## Approach

- Astro (current stable), TypeScript strict, no UI framework. Plain CSS with tokens. Node's built-in test runner for unit tests, so there is no extra test dependency.
- Deployed by GitHub Actions to GitHub Pages at `https://pwashington1987.github.io/caskscents/` until a custom domain is added. All links go through the base-path helper, so moving to a domain is a one-line config change.
- Work lands on `main` in small commits, one per task below. Each milestone ends with the site deployed and a short list of what to look at.
- Tests are written before the code they cover for everything with logic (schema rules, derived fields, vocabulary errors, shelf filtering). Layout work is checked by viewing the built pages at 390 and 1440 px.

## Milestones and tasks

### M0. Project skeleton
1. Initial commit: spec, this plan, `.gitignore`, README with the authoring commands.
2. Scaffold Astro with TypeScript strict, unit tests, `astro check`.
3. `src/lib/href.ts` base-path helper with tests; `astro.config.mjs` with `site` and `base`.
4. GitHub Actions workflow: install, test, `astro check`, build, link check, publish the built site to the `gh-pages` branch.
Done when: an empty styled page is live at the Pages URL and CI is green.

### M1. Design foundation
5. `src/styles/tokens.css`: palette, type scale, spacing, the `data-world` accent switch.
6. Self-hosted fonts (Fraunces, Manrope, DM Mono), subset, with `font-display: swap`.
7. Outlined SVG assets: seal, wordmark, the two gateway captions, favicon set. Produced once by a script from the serif typeface and committed as static files.
8. `Base.astro` layout, `SiteNav` (desktop and phone menu), `Footer`, `Seal`, `Wordmark`, `LineArt`.
Done when: a blank page in each world shows the correct nav, footer and accent at both widths.

### M2. Content model and authoring
9. Vocabularies in `src/data/`: accords with colors, notes, whiskey flavors, regions, style tags, concentrations.
10. `src/content.config.ts` schemas for whiskeys, fragrances, rundowns.
11. `src/lib/derive.ts`: strength band, price tier, whisky/whiskey spelling, accord colors and label contrast. Tests first.
12. `src/lib/validate.ts`: unknown-label errors with closest match, slug and pick checks, overall-score warnings. Tests first.
13. `scripts/new.mjs` scaffold command. Three draft samples per collection, excluded from production.
Done when: a deliberate typo in a sample fails the build with a plain message naming the file, the field and the suggested fix.

### M3. Review page
14. `ScoreBig`, `ScoreRow`, `BarList`, `PillList`, `SeasonBars`, `DayNightBar`, `FactTile`, `ShareBar`.
15. `/fragrance/reviews/[slug]` and `/whiskey/reviews/[slug]`, one template with world-specific sections.
16. "Appears in" and "If you like this" queries.
Done when: both sample review types match the mockups at 390 and 1440 px.

### M4. Rundown page
17. `VerdictList`, `CompareTable` (desktop), `CompareGrid` and `CompareAccordion` (phone), `ProfileCompare`.
18. `/[world]/rundowns/[slug]`, with notes pulled from reviews and optional overrides.
Done when: the sample rundown matches the mockups and has no sideways scroll on a phone.

### M5. Listing pages
19. `BottleCard`, `BottleRow`, `LatestColumn`.
20. World home (`/whiskey/`, `/fragrance/`).
21. The shelf: prebuilt `reviews.json`, `ShelfFilters` with filter, sort, search, URL state and load-more. Filter logic tested first.
22. Rundown lists; region, style, house and family pages.
Done when: every chip and nav link leads to a real page and a filtered shelf URL can be reloaded and shared.

### M6. Gateway
23. Final hero image: regenerate at full quality with more room above the bottle. **Owner approves the image before it is used.** Export desktop and phone crops in AVIF, WebP and JPEG.
24. `HeroGateway` with the seal, option D captions, hover and focus states, load animation, image-failure fallback.
25. Latest-from-both-worlds section, the no-sponsors statement, `EmailSignup`, phone layout.
Done when: the gateway matches the approved board, works with the image blocked, and passes at both widths.

### M7. Supporting pages and plumbing
26. About, scoring and 404 pages (owner supplies the About text; scoring text drafted for approval).
27. RSS per world, sitemap, per-page meta, Open Graph card generation, `Review` structured data.
28. Cloudflare Web Analytics snippet and Buttondown form, both switched on by config values so the site builds without them.
29. `scripts/photo.mjs`: crop to 2:3, set the background to the page color, write web sizes.

### M8. Quality pass and handover
30. Full check: tests, `astro check`, link check, pages at 390 and 1440 px, gateway with image blocked, reduced motion, keyboard-only navigation, Lighthouse on the gateway and a review page (target 90 or better for performance).
31. README finished: how to add a review, a rundown and a photo; how to publish; how to move to a custom domain.
32. Owner walkthrough on desktop and phone; fixes from that review.

## What the owner needs to provide

| When | What |
|---|---|
| Before M0 | Link GitHub to Claude so the repository can be reached. |
| M0 | In the repository's Pages settings, choose "Deploy from a branch", then `gh-pages` and `/ (root)`. Pages on a private repository needs a paid GitHub plan; a public repository is free. |
| M6 | Approve the final hero image. |
| M7 | About-page text; a Cloudflare Web Analytics token and a Buttondown username (both optional at launch). |
| After handover | Real reviews and bottle photos. The site launches with no published reviews until these exist. |

## Risks

- **The site is empty at launch.** Draft samples never publish, so the gateway's "latest" lists and the shelf need a designed empty state until the first real reviews are added. Included in tasks 20, 21 and 25.
- **Outlining the logo typeface** depends on a font-to-path tool working in the build workspace. Fallback: load that one typeface for the logo only.
- **Bottle photos** shot on light or busy backgrounds will not blend. The photo script will warn when the background is too bright.

## Build notes (changes made while building)

Status on 2026-11-20: M0 to M8 are built and live on the preview address. What remains is the owner's walkthrough and the launch checklist in the README.

- **Tests** use Node's built-in test runner. The build workspace cannot install packages, so every push is built and checked by GitHub Actions, and pages are reviewed from the published `gh-pages` branch.
- **Deploy** publishes `dist` to the `gh-pages` branch (Pages set to "Deploy from a branch"). The repository is public.
- **Preview drafts.** The workflow sets `PUBLIC_SHOW_DRAFTS=true` so the nine sample entries show on the preview site with a banner and `noindex`. Remove that line at launch.
- **Task 7, outlined logo.** Not done: no font-to-path tool is available. The seal, wordmark and gateway captions use the Cormorant Garamond webfont (the planned fallback).
- **`shortName`.** Reviews have an optional short name (16 characters at most) for narrow rundown columns.
- **Rundown profile comparison** only lists accords or flavors that at least two of the bottles share, five at most.
- **Task 19.** There is no separate `BottleRow`: `BottleCard` is a row on phones and a card on wide screens, with a `row` option to stay a row everywhere (used on the gateway).
- **Task 21, the shelf.** Filters are menus (one per facet) plus search and sort, not chips. The bottle data is written into the page itself, not a separate `reviews.json`. There is no load-more yet; add it when a shelf passes about 60 bottles.
- **Task 23, hero image.** The owner chose to use the wide photograph already approved, with the two portrait images as the phone crops. Nothing was regenerated.
- **Task 24.** Wide screens lock the hero to the photograph's shape so the captions stay beside the glass and bottle at any width. Phones show the seal, the tagline and the two portrait images side by side, and never download the wide photograph. Keyboard focus rings the caption.
- **Task 25.** The email signup only appears once `PUBLIC_BUTTONDOWN_USERNAME` is set. A first version of the scoring page (`/about/scoring/`) was added early because the gateway links to it; its wording still needs the owner's approval in M7.
- **Scores and winners (owner's rule, 2026-11-20).** The gateway shows no scores at all. A rundown's winners and scores appear only on the rundown page; lists, feeds, share previews and structured data name the questions it answers, never who won. Review scores do show on the world pages.
- **Task 26, About.** Left blank at the owner's request. The text lives in `src/content/pages/about.md`; the page and its footer link appear only once that file has text.
- **Task 27, share cards.** Cards are not drawn at build time (that needs a text-drawing tool the build does not have). Instead there are three fixed cards made from the gateway photograph (`public/og/`), and `npm run photo` writes a card for each bottle with the photo beside the name mark. Cards carry no score.
- **Task 27, feeds.** Written by hand in `src/lib/feed.ts` with no extra package. Items carry the title, link, date and one-line summary.
- **Task 29, photo command.** Beyond the plan, it also finds the bottle and frames it, fades the photo's side and bottom edges, writes a small copy for lists and sets the review's `image:` line.
- **Not done in M7.** A Search Console verification file (needs the owner's code from Google) and a `robots.txt` (only useful once the site is on its own domain).
- **Samples with photos.** Two samples (`sample-harbour-smoke-16`, `sample-velvet-cherry`) use the owner's generated glass and bottle pictures, to show how real photos sit on the pages.
- **Task 30, quality pass.** Every built page was checked at 390 and 1440 px (and the main ones at 768 and 1024) for sideways scroll, console errors, broken images, heading order, labels, tap-target size and text contrast; keyboard order and focus were checked on the gateway, shelf, review and rundown pages. Fixed: a skip link, three small tap targets, and the rundown line-up when photos and line drawings are mixed. Lighthouse could not be run from the build workspace, so speed was measured on a simulated slow phone instead (gateway: largest paint about 1.2 s, no blocking, no layout shift, about 255 KB in 12 requests). Run PageSpeed Insights on the live address for the official score.
- **Launch build.** The workflow builds the site a second time with drafts hidden and checks its links, so the empty-at-launch site is tested on every push. Its empty states were reviewed once.
- **Package versions** are pinned: the workflow saved `package-lock.json` on its first run.
- **Stress samples.** `sample-long-name-extrait` and `sample-four-bottle-stress-test` check a very long name and the four-bottle rundown.

