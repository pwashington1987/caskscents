# CaskScents: Top 5 lists

Date: 2026-11-24
Status: waiting for the owner's approval
Size: a small feature, about the size of the rundown lists. News is a separate feature and comes after this one.

## What it is for

Each world (whiskey, fragrance) gets ranked "Top 5" lists by category: vanilla fragrances, date night, houses; sherried, peated, 12 year olds, distilleries, and so on. A visitor gets a quick answer to "what is the best X", and a reason to come back as the lists change. The lists should mostly look after themselves as reviews are added.

## Approaches considered

1. **The scores decide.** Every list builds itself from the highest-scoring matching reviews. Nothing to maintain, but a list can only hold reviewed bottles, and ranking houses would mean averaging a few scores.
2. **The owner decides.** Every list is written by hand. Full control, and it can include bottles not yet reviewed, but every list has to be kept up to date by hand.
3. **Both.** Lists build themselves from scores by default, and any list can be set by hand instead. Houses and distilleries are always set by hand.

**Chosen: 3**, by the owner on 2026-11-24. It keeps the upkeep low and still lets a list say what the owner actually thinks.

## How a list is made

One small file per list in `src/content/top5/`, created with:

```bash
npm run new top5 "Vanilla fragrances"
```

An automatic list says what a bottle needs to qualify:

```yaml
draft: true
title: "Vanilla fragrances"
category: fragrance
intro: "The five best vanillas I have reviewed."
match: { accord: Vanilla }
publishDate: 2026-11-24
```

- `match` can use, for fragrance: `accord`, `tag`, `house`, `family`, `concentration`, `audience`. For whiskey: `tag`, `age`, `region`, `type`, `distillery`. For both: `maxPrice`. With more than one, a bottle must meet all of them (for example `{ tag: peated, maxPrice: 60 }`).
- The site takes every published review in that world that qualifies, sorts by overall score (newest review first when scores tie), and keeps the top five.

A list set by hand names its five instead:

```yaml
title: "Houses"
category: fragrance
of: houses
picks:
  - name: "Example Parfums"
    why: "The most consistent line I have tried."
  - ...four more
```

- Each pick is either `review: a-review-file-name` or `name: "Any name"`, with an optional `why` line.
- `of` is `bottles` (the default), `houses` or `distilleries`. Lists of houses and distilleries are always set by hand.
- A named house or distillery links to its own page when the site has reviews for it. A named bottle with no review shows "Not reviewed yet".

## What a visitor sees

A list page, at `/fragrance/top-5/vanilla-fragrances/`:

```
FRAGRANCE · TOP 5
Vanilla fragrances
The five best vanillas I have reviewed.            Ranked by score · Nov 2026

1   [photo]  Grey Suede                                              8.6
             Example Parfums · Eau de Parfum · $195
             One line from the review.
2   [photo]  Velvet Cherry                                           8.4
             ...
3
4
5

More Top 5 lists:  Date night · Under $100 · Houses
```

- Each row links to the full review. A list set by hand says "My picks" where an automatic one says "Ranked by score".
- All lists for a world are at `/fragrance/top-5/` and `/whiskey/top-5/`: the title and intro of each, without showing who is on it.
- "Top 5" is added to each world's top bar, and each world's homepage gets a short "Top 5" section with list titles only.
- A review page names the lists that bottle is on, without its rank.
- Each list appears once in its world's RSS feed, with its title and intro only.

## The calls I made (change any of them)

1. **You choose which lists exist.** A list appears only when you create its file. The site does not invent a list for every accord and tag, which would produce many thin ones.
2. **A list shows only when it has five.** An automatic list with fewer than five qualifying reviews stays hidden, and the build says how many it is waiting for ("Vanilla fragrances has 3 of 5"). No "Top 3" pages.
3. **What counts as "a vanilla fragrance".** A bottle qualifies for an accord when that accord's weight is 50 or more, so a faint trace does not count.
4. **Scores show on list pages.** They are review scores on a world page, which you said should be visible. An unreviewed pick has no score.
5. **Titles only outside the list.** The homepage section, the list of lists, the feed and the review page never show who is ranked where, the same way rundown winners stay on the rundown page.
6. **The gateway is unchanged.**

## Checks when the site builds

- A `match` that names an accord, tag, region or type that is not in the word lists stops the build and suggests the closest spelling.
- A hand list must have exactly five picks, each a real, published review in the right world or a plain name. Otherwise the build stops and says which pick is wrong.
- A file must have either `match` or `picks`.

## Not part of this

- Reader voting or comments.
- Lists that mix whiskey and fragrance.
- Automatic ranking of houses or distilleries.
- News. That is the next feature and gets its own design.

## Left to the builder

- Page layout details, reusing the existing bottle rows, type and spacing.
- The ranking and matching logic goes in a tested library file (`src/lib/top5.ts`), tests written first.
- Enough extra sample entries for at least one automatic list of five in each world on the preview site.
