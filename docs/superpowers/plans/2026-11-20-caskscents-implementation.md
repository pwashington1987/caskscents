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
4. GitHub Actions workflow: install, test, `astro check`, build, link check, deploy to Pages.
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
| M0 | In the repository's Pages settings, set the source to "GitHub Actions" (one click). |
| M6 | Approve the final hero image. |
| M7 | About-page text; a Cloudflare Web Analytics token and a Buttondown username (both optional at launch). |
| After handover | Real reviews and bottle photos. The site launches with no published reviews until these exist. |

## Risks

- **The site is empty at launch.** Draft samples never publish, so the gateway's "latest" lists and the shelf need a designed empty state until the first real reviews are added. Included in tasks 20, 21 and 25.
- **Outlining the logo typeface** depends on a font-to-path tool working in the build workspace. Fallback: load that one typeface for the logo only.
- **Bottle photos** shot on light or busy backgrounds will not blend. The photo script will warn when the background is too bright.
