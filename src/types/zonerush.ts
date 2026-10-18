export interface Sector {
  id: string;
  code: string;
  name: string;
  owner: string;
  ownerHandle: string;
  ownerColor: string;
  fillColor: string;
  areaKm2: number;
  points: string; // SVG polygon points string
  paths?: { lat: number; lng: number }[];
  centroid?: { lat: number; lng: number };
  isContested?: boolean;
  defenseWindowMinutes?: number;
  alertMessage?: string;
}

export interface LeaderboardRunner {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  territoryKm2: number;
  xp: number;
  turfLoops: number;
  deltaRank?: number; // positive = moved up, negative = moved down
  isUser?: boolean;
  badge?: string;
  sectorNote?: string;
  podiumStyle?: 'gold' | 'silver' | 'bronze';
}

export interface RunTelemetry {
  distanceKm: number;
  durationSeconds: number;
  paceSeconds: number; // seconds per km
  bpm?: number;
  spm?: number;
  estimatedTerritoryYield: number;
  loopProgressPct: number;
  distanceToSealMeters: number;
  isPaused: boolean;
  isLocked: boolean;
  targetSyndicate: string;
  routePoints: [number, number][];
  gpsTrail: { lat: number; lng: number }[];
  currentBearing?: number;
  currentDirection?: string;
  displacementMeters: number;
}

export interface ConquestYield {
  sectorName: string;
  capturedKm2: number;
  capturedM2: number;
  acresCaptured: number;
  previousDominanceKm2: number;
  newDominanceKm2: number;
  rankSurgeTiers: number;
  previousRank: number;
  newRank: number;
  distanceKm: number;
  durationSeconds: number;
  avgPaceString: string;
  caloriesBurned: number;
  displacementMeters: number;
  polygonPaths: { lat: number; lng: number }[];
  rawGpsTrail: { lat: number; lng: number }[];
  displacedRivals: {
    username: string;
    avatarUrl: string;
    note: string;
    lostKm2: number;
  }[];
  streakBonusXp?: number;
  totalLootXp?: number;
  timestamp: string;
}

export type AppTab = 'map' | 'activity' | 'profile';
