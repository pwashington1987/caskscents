/**
 * Fragrance accords. Each has the bar color used on review pages and the
 * family it belongs to (families become the /fragrance/families/ pages).
 * To add an accord, add a line here. Label text color is chosen automatically.
 */
export type Accord = { label: string; color: string; family: string };

export const ACCORDS: readonly Accord[] = [
  { label: 'Vanilla', color: '#E8DCA8', family: 'Gourmand' },
  { label: 'Sweet', color: '#9A3029', family: 'Gourmand' },
  { label: 'Caramel', color: '#B8742E', family: 'Gourmand' },
  { label: 'Honey', color: '#D9A531', family: 'Gourmand' },
  { label: 'Chocolate', color: '#4A2C20', family: 'Gourmand' },
  { label: 'Coffee', color: '#4B2E1E', family: 'Gourmand' },
  { label: 'Almond', color: '#D8C2A0', family: 'Gourmand' },
  { label: 'Nutty', color: '#9A7850', family: 'Gourmand' },
  { label: 'Coconut', color: '#E6DDC8', family: 'Gourmand' },
  { label: 'Lactonic', color: '#EADFCF', family: 'Gourmand' },
  { label: 'Boozy', color: '#8A5A22', family: 'Gourmand' },
  { label: 'Cherry', color: '#6E4353', family: 'Fruity' },
  { label: 'Fruity', color: '#C9643A', family: 'Fruity' },
  { label: 'Tropical', color: '#E0A03A', family: 'Fruity' },
  { label: 'Citrus', color: '#E3C94B', family: 'Citrus' },
  { label: 'Floral', color: '#D9A0B4', family: 'Floral' },
  { label: 'White floral', color: '#E9E2D0', family: 'Floral' },
  { label: 'Rose', color: '#B5506A', family: 'Floral' },
  { label: 'Iris', color: '#9C93B8', family: 'Floral' },
  { label: 'Powdery', color: '#D9C6B4', family: 'Floral' },
  { label: 'Lavender', color: '#8E86C0', family: 'Aromatic' },
  { label: 'Aromatic', color: '#5E8C7A', family: 'Aromatic' },
  { label: 'Herbal', color: '#6F8F5A', family: 'Aromatic' },
  { label: 'Green', color: '#5F8A4A', family: 'Aromatic' },
  { label: 'Fresh spicy', color: '#7FA06A', family: 'Aromatic' },
  { label: 'Fresh', color: '#9FC5C0', family: 'Fresh' },
  { label: 'Aquatic', color: '#6FA3C0', family: 'Fresh' },
  { label: 'Ozonic', color: '#A9C4D6', family: 'Fresh' },
  { label: 'Soapy', color: '#C9D8E0', family: 'Fresh' },
  { label: 'Aldehydic', color: '#CFD6DC', family: 'Fresh' },
  { label: 'Salty', color: '#A8B8BE', family: 'Fresh' },
  { label: 'Mineral', color: '#8A9096', family: 'Fresh' },
  { label: 'Metallic', color: '#9AA3AA', family: 'Fresh' },
  { label: 'Woody', color: '#6B4A2E', family: 'Woody' },
  { label: 'Earthy', color: '#5A4A3A', family: 'Woody' },
  { label: 'Mossy', color: '#5C6B46', family: 'Woody' },
  { label: 'Patchouli', color: '#5B4B36', family: 'Woody' },
  { label: 'Oud', color: '#3E2A22', family: 'Woody' },
  { label: 'Amber', color: '#8F4420', family: 'Amber' },
  { label: 'Warm spicy', color: '#A8472A', family: 'Amber' },
  { label: 'Balsamic', color: '#7A3F2A', family: 'Amber' },
  { label: 'Incense', color: '#5A4E52', family: 'Amber' },
  { label: 'Musky', color: '#C7B8CF', family: 'Musk' },
  { label: 'Animalic', color: '#6A4038', family: 'Musk' },
  { label: 'Leather', color: '#4A3020', family: 'Leather' },
  { label: 'Smoky', color: '#4A4442', family: 'Leather' },
  { label: 'Tobacco', color: '#6A4A28', family: 'Leather' },
];

export const ACCORD_LABELS: readonly string[] = ACCORDS.map((a) => a.label);
export const ACCORD_FAMILIES: readonly string[] = [...new Set(ACCORDS.map((a) => a.family))];

const byLabel = new Map(ACCORDS.map((a) => [a.label, a]));
export const accord = (label: string): Accord | undefined => byLabel.get(label);
