// Vibrant Athletic Territory Color Palette for ZoneRush Runners
export interface TerritoryColorOption {
  id: string;
  name: string;
  hex: string;
  fillRgba: string;
  badgeClass: string;
}

// Five clearly different hues so runners' territories are never confused
export const TERRITORY_PALETTE: TerritoryColorOption[] = [
  {
    id: 'blue',
    name: 'Blue',
    hex: '#2563EB',
    fillRgba: 'rgba(37, 99, 235, 0.28)',
    badgeClass: 'bg-blue-600',
  },
  {
    id: 'red',
    name: 'Red',
    hex: '#DC2626',
    fillRgba: 'rgba(220, 38, 38, 0.28)',
    badgeClass: 'bg-red-600',
  },
  {
    id: 'green',
    name: 'Green',
    hex: '#16A34A',
    fillRgba: 'rgba(22, 163, 74, 0.28)',
    badgeClass: 'bg-green-600',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    hex: '#EAB308',
    fillRgba: 'rgba(234, 179, 8, 0.28)',
    badgeClass: 'bg-yellow-500',
  },
  {
    id: 'purple',
    name: 'Purple',
    hex: '#9333EA',
    fillRgba: 'rgba(147, 51, 234, 0.28)',
    badgeClass: 'bg-purple-600',
  },
];

// Returns a deterministic territory color for every user based on their ID / email / username
export const getUniqueUserColor = (identifier?: string | null): TerritoryColorOption => {
  if (!identifier) return TERRITORY_PALETTE[0];

  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % TERRITORY_PALETTE.length;
  return TERRITORY_PALETTE[index];
};

// Converts hex color to semi-transparent RGBA fill string
export const hexToRgba = (hex: string, alpha = 0.25): string => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${isNaN(r) ? 37 : r}, ${isNaN(g) ? 99 : g}, ${isNaN(b) ? 235 : b}, ${alpha})`;
};
