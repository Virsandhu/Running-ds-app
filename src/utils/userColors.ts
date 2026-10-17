// Vibrant Athletic Territory Color Palette for ZoneRush Runners
export interface TerritoryColorOption {
  id: string;
  name: string;
  hex: string;
  fillRgba: string;
  badgeClass: string;
}

export const TERRITORY_PALETTE: TerritoryColorOption[] = [
  {
    id: 'cobalt',
    name: 'Cobalt Blue',
    hex: '#2563EB',
    fillRgba: 'rgba(37, 99, 235, 0.28)',
    badgeClass: 'bg-blue-600',
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    hex: '#059669',
    fillRgba: 'rgba(5, 150, 105, 0.28)',
    badgeClass: 'bg-emerald-600',
  },
  {
    id: 'orange',
    name: 'Athletic Orange',
    hex: '#FC5200',
    fillRgba: 'rgba(252, 82, 0, 0.28)',
    badgeClass: 'bg-[#FC5200]',
  },
  {
    id: 'purple',
    name: 'Electric Purple',
    hex: '#7C3AED',
    fillRgba: 'rgba(124, 58, 237, 0.28)',
    badgeClass: 'bg-purple-600',
  },
  {
    id: 'crimson',
    name: 'Crimson Rose',
    hex: '#E11D48',
    fillRgba: 'rgba(225, 29, 72, 0.28)',
    badgeClass: 'bg-rose-600',
  },
  {
    id: 'cyan',
    name: 'Cyan Neon',
    hex: '#0891B2',
    fillRgba: 'rgba(8, 145, 178, 0.28)',
    badgeClass: 'bg-cyan-600',
  },
  {
    id: 'amber',
    name: 'Amber Gold',
    hex: '#D97706',
    fillRgba: 'rgba(217, 119, 6, 0.28)',
    badgeClass: 'bg-amber-600',
  },
  {
    id: 'indigo',
    name: 'Deep Indigo',
    hex: '#4F46E5',
    fillRgba: 'rgba(79, 70, 229, 0.28)',
    badgeClass: 'bg-indigo-600',
  },
  {
    id: 'lime',
    name: 'Volt Lime',
    hex: '#65A30D',
    fillRgba: 'rgba(101, 163, 13, 0.28)',
    badgeClass: 'bg-lime-600',
  },
  {
    id: 'fuchsia',
    name: 'Cyber Fuchsia',
    hex: '#C026D3',
    fillRgba: 'rgba(192, 38, 211, 0.28)',
    badgeClass: 'bg-fuchsia-600',
  },
];

// Explicit distinct colors for known runners to guarantee zero collision
export const KNOWN_RUNNER_COLORS: Record<string, string> = {
  '@AlexRunner': '#2563EB', // Cobalt Blue (Current User)
  'Alex Chen': '#2563EB',
  '@AaravTurf': '#D97706',  // Amber Gold
  'Aarav': '#D97706',
  '@KabirFast': '#059669',  // Emerald Green
  'Kabir': '#059669',
  '@NitroMaya': '#7C3AED',  // Electric Purple
  'Nitro': '#7C3AED',
  '@GhostSprint': '#0891B2', // Cyan Neon
  'GhostSprint': '#0891B2',
  '@ViperRun': '#E11D48',    // Crimson Rose
  'ViperRun': '#E11D48',
  '@Zenith': '#4F46E5',      // Deep Indigo
  'Zenith': '#4F46E5',
  '@VoltKicks': '#65A30D',   // Volt Lime
  'VoltKicks': '#65A30D',
  '@BlazeKicks': '#FC5200',  // Athletic Orange
  'BlazeKicks': '#FC5200',
};

// Returns a deterministic unique territory color for every user based on their ID / email / username
export const getUniqueUserColor = (identifier?: string | null): TerritoryColorOption => {
  if (!identifier) return TERRITORY_PALETTE[0];

  // Check known runners first
  if (KNOWN_RUNNER_COLORS[identifier]) {
    const hex = KNOWN_RUNNER_COLORS[identifier];
    const match = TERRITORY_PALETTE.find((p) => p.hex.toLowerCase() === hex.toLowerCase());
    if (match) return match;
  }

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
