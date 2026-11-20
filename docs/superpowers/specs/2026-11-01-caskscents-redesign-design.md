# CaskScents: design spec

First written 2026-11-01. Revised 2026-11-20 after a full review and a second round of mockups.
Status: design approved in conversation, awaiting the owner's review of this document.

## 1. Purpose and success

CaskScents is a public review brand for whiskey and fragrance, built to grow an audience through search and social. It is a new build. An earlier prototype existed and nothing from it is kept: no code, no content, no migration.

Success a year out:
- Every review and rundown has its own fast, indexable page that reads as well on a phone as on a laptop.
- Writing a new review or rundown takes minutes and cannot produce a broken page, even with hundreds of reviews.
- The site reads as a dark, luxurious, members-club publication, never as a template.

Not in this build: user accounts, comments, reader voting, a hosted CMS, a second language, print styles, scroll-driven video.

## 2. Decisions

| Area | Decision |
|---|---|
| Stack | Astro, static output, content collections. One repository, one deploy. |
| Authoring | One Markdown file per review and per rundown. Scaffold command, strict build-time validation, controlled vocabularies. A local editing form (Keystatic) is a later add-on. |
| Identity | CS seal (two thin rings, light serif "C" and "S") beside the wordmark "CaskScents" in an italic serif. The seal, wordmark and gateway captions ship as outlined SVG, so their typeface is never loaded as a font. |
| Palette, shared | Espresso #14100D (page), Umber #1E1814 (raised surfaces), Bone #EEE6D8 (text), Ash #9C9185 (muted), Antique gold #C9A24E (seal, scores that win, active states). |
| Palette, whiskey | Copper #B8702E (accent), Amber #E09A3A (highlight), Oak #3A2A1E (borders). |
| Palette, fragrance | Rose gold #C98A7E (accent), Frost #8E8792 (highlight), Smoked glass #2A2328 (borders). Provisional: all colors are CSS tokens, so the fragrance accent can change in one place after it is judged on the built site. |
| Type | Three shipped families: Fraunces (display, weight 300), Manrope (body and labels), DM Mono (numerals only: scores, ABV). Self-hosted, subset. |
| Restraint rules | Hairlines, not boxed cards. No glows outside the gateway hero. Spaced uppercase labels only for the world name and verdict labels. Pills only for notes, filters and tags. |
| Motion | 400 to 600 ms eases, bars fill on entry, nothing bounces. `prefers-reduced-motion` turns it all off. |
| Gateway | Photographic hero with the seal, caption option D, and the latest from both worlds below. Section 4. |
| World home | "The Front Page" layout. Section 5. |
| Rundown | A winner per use case, a side-by-side score table with a note under every score. Section 6. |
| Review | Parfumo and Fragrantica hybrid, compact, no comments. Section 7. |
| Interaction | Read only: filters, sort, search, share, copy link. No accounts, no database. |

## 3. Site map and URLs

```
/                                  gateway
/whiskey/                          world home
/whiskey/reviews/                  the shelf (filter, sort, search)
/whiskey/reviews/<slug>/           review
/whiskey/rundowns/                 rundown list
/whiskey/rundowns/<slug>/          rundown
/whiskey/regions/<slug>/           every review from a region
/whiskey/styles/<slug>/            every review with a style tag (peated, sherried, bourbon...)
/fragrance/                        same structure, with:
/fragrance/houses/<slug>/          every review from a house
/fragrance/families/<slug>/        every review led by an accord family
/about/                            who writes this, contact
/about/scoring/                    how scores work, in plain words
/404                               designed not-found page
/whiskey/rss.xml  /fragrance/rss.xml  /sitemap-index.xml
```

- Region, style, house and family pages are static, generated from the content, and listed in the sitemap. "Browse by" chips and the nav's Regions and Houses links point to them.
- The shelf keeps its state in the URL (`?region=islay&sort=score&q=lagavulin`), so a filtered view can be shared and the back button works. It shows 24 bottles and loads 24 more on request.
- The nav search icon opens the current world's shelf with the search field focused.
- Every internal link is built through one `href()` helper that prepends the configured base path, so the site works unchanged at a domain root or under a sub-path.

## 4. Gateway

A real page, not a splash screen: it carries content for search and for visitors who arrive at the root.

First screen, desktop:
- Full-width photographic hero: a Glencairn glass of amber whisky on the left, an unbranded perfume bottle on the right, on dark marble, with empty dark space in the middle. Generated imagery, approved by the owner.
- Centered in the dark space: the CS seal, opened into two halves, then the line "Honest reviews of what you pour and what you wear."
- Caption option D: "WHISKEY" and "FRAGRANCE" in small, widely spaced gold capitals, set beside each object level with the liquid, each joined to its object by a short gold hairline.
- Each half of the screen is one link to its world. On hover or keyboard focus that side brightens slightly and the other dims. On load the seal's halves ease apart once. No scroll-driven animation.
- A soft fade at the bottom blends the photograph into the page.

Below the first screen:
1. "The latest from both worlds": two columns, Whiskey and Fragrance. Each shows the newest rundown (title, premise, best-overall pick) and the three newest reviews (thumbnail, name, one meta line, score), plus a link to the world.
2. A short "One person, two obsessions, no sponsors" statement with a link to the scoring page, beside an email signup.
3. Footer.

Phone: seal and tagline, then the two worlds side by side as large tap targets, each a portrait crop of its object with the same capitals beneath. Then the latest lists stacked, signup, footer.

Hero asset plan:
- The approved image is regenerated once at full quality with the same composition and a little more empty space above the bottle. Cost is a few credits; the account holds about 1,000.
- Exports: a wide desktop image and two portrait crops for phones, in AVIF and WebP with a JPEG fallback, sized so the hero stays under roughly 250 KB on desktop.
- The owner has seen that the bottle's shape is close to the look of an existing niche house and chose to keep it. If that changes, only the bottle is regenerated.
- If the image fails to load, the page still works: the background is the page color and a thin gold line drawing of the glass and bottle stands in.

## 5. World home (The Front Page)

Nav: seal lockup, the world's name in its accent, links to Reviews, Rundowns, and Regions or Houses, a search icon, and a "Switch to Fragrance" or "Switch to Whiskey" link. On phones the links collapse into a menu.

Sections:
1. Latest rundown: title, premise, the use-case picks, the bottles lined up.
2. Latest reviews: four bottles with photo, name, score, meta line and one-line hook.
3. Rundowns: a numbered list with bottle count and best-overall pick.
4. Browse by: chips for regions and styles, or houses and families, with counts.
5. Footer: wordmark, "Scores are one person's palate. Prices are what I paid." (fragrance: "nose"), links to About, Scoring and RSS. The whiskey world adds "Please drink responsibly."

On phones the review cards become the same compact rows used on the gateway.

## 6. Rundown page

1. Meta line (Rundown · region or family · N bottles · read time), title, premise, the bottles lined up with names.
2. The verdict: one entry per use case (2 to 4): label, winning bottle, one sentence of why. The first entry carries the gold rule.
3. Scores. Desktop: one table, a column per bottle, rows for ABV and price, each scored attribute, and Overall. Every attribute cell shows the score and a one or two line note. The highest score in each row is gold.
   Phone: "Scores at a glance", a numbers-only grid that fits the screen; then "Why, score by score", one collapsible row per attribute that opens to each bottle's score and note, ranked highest first. No sideways scrolling.
4. Flavor profile (whiskey) or accords (fragrance), grouped by attribute with one bar per bottle, beside the written account.
5. Links to each full review, with share and copy-link.

Scored attributes: whiskey has Nose, Palate, Finish, Value; fragrance has Scent, Longevity, Sillage, Bottle, Value.

## 7. Review page

Fragrance:
1. Header: meta line (house · year · concentration · audience), title, one-line hook, bottle photo, the overall score large, price per volume, review date, number of wears.
2. Scores: each sub-score with a thin bar and its one-line note.
3. Main accords: horizontal bars, longest first, each in its accord color. Label text is dark or light, chosen automatically for contrast.
4. Notes: Top, Heart and Base as three rows of pills.
5. When to wear it: how long it lasts in hours, how far it projects in plain words, four labeled season bars with levels, and a day/night split bar.
6. The review in prose, then a "Best for" line.
7. "Appears in" (rundowns containing this bottle) and "If you like this" (three reviewed bottles), then share and copy-link.

Whiskey uses the same skeleton: meta line (distillery · region · type · age), sub-scores Nose, Palate, Finish and Value with notes; flavor profile bars in place of accords; nose, palate and finish tasting notes in place of the pyramid; and a profile row of Peat, Sweetness, Strength and Price tier.

On desktop the header places the photo left and the text right, with accords and notes in two columns and the related links in a side column. On phones everything is one column in the order above.

## 8. Content model

`src/content.config.ts`, strict schemas. Fields marked (derived) are computed at build and never typed.

whiskeys:
```
name, distillery, region, country, type, age (number | null), abv, price, currency
batch?, bottledYear?
summary, image?
ratings:     { nose, palate, finish, value, overall }     0 to 10, one decimal
ratingNotes: { nose, palate, finish, value }              one or two lines each
flavorProfile: [{ label, intensity 0-100 }]               3 to 6, labels from the flavor vocabulary
tastingNotes: { nose, palate, finish }
profile: { peat 1-5, sweetness 1-5 }
strengthBand (derived from abv), priceTier (derived from price), spelling (derived from country)
tags, featured, draft, reviewedDate, updatedDate?
```

fragrances:
```
name, house, year, concentration, audience
price, volumeMl, currency, batch?
summary, image?
ratings:     { scent, longevity, sillage, bottle, value, overall }
ratingNotes: { scent, longevity, sillage, bottle, value }
accords: [{ label, weight 0-100 }]                        3 to 8, labels from the accord vocabulary
pyramid: { top, heart, base }                             note names from the note vocabulary
profile: { longevityHours: [min, max], projection: "skin" | "arm's length" | "room",
           seasons: { winter, spring, summer, autumn } each 0-100, day 0-100 }
accord colors and label text color (derived from the vocabulary)
wearsTested, bestFor, tags, featured, draft, reviewedDate, updatedDate?
```

rundowns:
```
title, category, items: slug[] (2 to 4)
picks: [{ useCase, winner: slug, why }]                   2 to 4
noteOverrides?: { [slug]: { [attribute]: string } }       only where the rundown needs different wording
summary, readMinutes?, featured, draft, publishDate
```

Rules:
- The rundown table takes each score and its note from the review's `ratings` and `ratingNotes`; `noteOverrides` replaces a note for that rundown only.
- Vocabularies live in `src/data/` (accords with colors, notes, whiskey flavors, regions, style tags, concentration names). An unknown label fails the build and names the file, the field and the closest valid spelling.
- Every rundown slug and pick winner must exist in the named collection.
- `overall` is the writer's call, not an average. The build warns when it is more than 1.0 from the mean of the sub-scores, and when a "best overall" pick is not the highest overall score in its rundown.
- `spelling` is "whiskey" for the United States and Ireland and "whisky" everywhere else. Generated text such as meta lines uses it. The section itself is always named Whiskey.
- `draft: true` entries render in development and are excluded from production. Until launch, the preview deploy shows them, labelled as a preview and hidden from search engines. The repository ships with three clearly marked draft samples per collection for development; no invented score, price or review text is ever published.

Scaffold: `npm run new <whiskey|fragrance|rundown> "<Name>"` creates the file with every field present, sets `draft: true`, and prints where to put the photo. It refuses to overwrite.

Photos: one per bottle, shot on a dark background with light from one side. `npm run photo <slug> <file>` crops to 2:3, sets the background to the page color, and writes web-sized files. Cards blend the photo into the page, so no cut-out is needed. A bottle without a photo shows the gold line drawing for its world.

## 9. Components

`SiteNav`, `Footer`, `Seal`, `Wordmark`, `HeroGateway`, `LatestColumn`, `BottleRow`, `BottleCard`, `ScoreBig`, `ScoreRow` (score, bar, note), `BarList` (accords, flavors), `PillList`, `SeasonBars`, `DayNightBar`, `FactTile`, `VerdictList`, `CompareTable`, `CompareGrid` and `CompareAccordion` (phone), `ProfileCompare`, `ShelfFilters`, `ShareBar`, `EmailSignup`, `LineArt` (glass, bottle).

A `data-world` attribute on `<html>` switches the accent, highlight and border tokens. No component is forked per world.

The shelf filters, sort and search run in the browser over a prebuilt index per world (`/whiskey/reviews.json`). The only other scripts are the collapsible rows, share and copy-link, and the gateway hover state. Everything else is plain HTML and CSS.

## 10. Build, hosting, quality

- Static build deployed by CI on every push. The host is any static host; the base path is configurable (section 3).
- Per page: title, meta description from `summary`, an Open Graph card generated from the bottle photo and score, and `Review` structured data. RSS per world, sitemap.
- Analytics: Cloudflare Web Analytics (free, no cookies). Search Console verification file included.
- Email signup: a Buttondown form that sends new posts from the RSS feeds. No backend.
- Accessibility: real links and buttons, visible gold focus rings, 4.5:1 text contrast, text equivalents for every bar and gauge, reduced motion honored, touch targets at least 44 px.
- Checks before anything is shown as done: unit tests (Node's built-in test runner) for the cross-file rules, derived fields and vocabulary errors; `astro check`; a link check over the built site; pages viewed at 390 and 1440 px; the gateway viewed with the hero image blocked; Lighthouse performance 90 or better on a review page and the gateway.

## 11. Reserved for later

Keystatic editing form; affiliate links with a disclosure line; note illustrations in the pyramid; reader voting; comments.
