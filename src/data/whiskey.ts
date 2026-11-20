/** Fixed word lists for whiskey reviews. Add a line to extend any of them. */

/** Labels allowed in a review's flavorProfile. */
export const FLAVORS: readonly string[] = [
  'Peat and smoke',
  'Sweet and sherry',
  'Brine and medicinal',
  'Vanilla and oak',
  'Caramel and toffee',
  'Honey',
  'Orchard fruit',
  'Dried fruit',
  'Tropical fruit',
  'Citrus',
  'Floral',
  'Malt and cereal',
  'Baking spice',
  'Rye spice',
  'Corn sweetness',
  'Nutty',
  'Chocolate and coffee',
  'Herbal and grassy',
  'Leather and tobacco',
  'Wine cask',
];

/** Regions, each with its country. Regions become the /whiskey/regions/ pages. */
export type Region = { label: string; country: string };

export const REGIONS: readonly Region[] = [
  { label: 'Islay', country: 'Scotland' },
  { label: 'Speyside', country: 'Scotland' },
  { label: 'Highland', country: 'Scotland' },
  { label: 'Lowland', country: 'Scotland' },
  { label: 'Campbeltown', country: 'Scotland' },
  { label: 'Islands', country: 'Scotland' },
  { label: 'Kentucky', country: 'United States' },
  { label: 'Tennessee', country: 'United States' },
  { label: 'Indiana', country: 'United States' },
  { label: 'Texas', country: 'United States' },
  { label: 'New York', country: 'United States' },
  { label: 'Other United States', country: 'United States' },
  { label: 'Ireland', country: 'Ireland' },
  { label: 'Japan', country: 'Japan' },
  { label: 'Canada', country: 'Canada' },
  { label: 'India', country: 'India' },
  { label: 'Taiwan', country: 'Taiwan' },
  { label: 'Rest of world', country: '' },
];

export const REGION_LABELS: readonly string[] = REGIONS.map((r) => r.label);

/**
 * Types. When addNoun is true the site appends "whisky" or "whiskey"
 * (picked from the country), so "Single malt" reads "Single malt whisky".
 */
export type WhiskeyType = { label: string; addNoun: boolean };

export const TYPES: readonly WhiskeyType[] = [
  { label: 'Single malt', addNoun: true },
  { label: 'Blended malt', addNoun: true },
  { label: 'Blended', addNoun: true },
  { label: 'Single grain', addNoun: true },
  { label: 'Single pot still', addNoun: true },
  { label: 'Bourbon', addNoun: false },
  { label: 'Wheated bourbon', addNoun: false },
  { label: 'Rye', addNoun: true },
  { label: 'Tennessee', addNoun: true },
  { label: 'American single malt', addNoun: true },
  { label: 'Corn', addNoun: true },
];

export const TYPE_LABELS: readonly string[] = TYPES.map((t) => t.label);

/** Style tags. Each becomes a /whiskey/styles/ page and a shelf filter. */
export const WHISKEY_TAGS: readonly string[] = [
  'peated',
  'sherried',
  'bourbon-cask',
  'port-cask',
  'wine-cask',
  'rum-cask',
  'cask-strength',
  'single-barrel',
  'small-batch',
  'bottled-in-bond',
  'wheated',
  'high-rye',
  'under-50',
  'daily-sipper',
  'special-occasion',
];
