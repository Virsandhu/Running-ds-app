export interface RunnableRoad {
  id: string;
  name: string;
  type: 'arterial' | 'campus_loop' | 'track' | 'perimeter' | 'avenue';
  distanceKm: number;
  claimYieldKm2: number;
  path: { lat: number; lng: number }[];
  description: string;
}

// Named claimable campus paths & circuits strictly inside The Doon School (Chandbagh Estate, Dehradun)
export const DOON_SCHOOL_RUNNABLE_ROADS: RunnableRoad[] = [
  {
    id: 'road-mall-perimeter',
    name: 'Mall Road Northern Perimeter',
    type: 'perimeter',
    distanceKm: 0.85,
    claimYieldKm2: 0.065,
    description: 'Northern campus boundary path running along Mall Road wall from West Cantt link to East Gate.',
    path: [
      { lat: 30.3375, lng: 78.0264 },
      { lat: 30.3378, lng: 78.0282 },
      { lat: 30.3382, lng: 78.0304 },
      { lat: 30.3380, lng: 78.0320 },
      { lat: 30.3375, lng: 78.0338 },
      { lat: 30.3368, lng: 78.0355 },
    ],
  },
  {
    id: 'road-chandbagh-spine',
    name: 'Chandbagh Central Spine Avenue',
    type: 'avenue',
    distanceKm: 0.45,
    claimYieldKm2: 0.040,
    description: 'Historic tree-lined central avenue from Mall Road Gate down to the Main Quadrangle & Chandbagh lawn.',
    path: [
      { lat: 30.3380, lng: 78.0318 },
      { lat: 30.3368, lng: 78.0314 },
      { lat: 30.3355, lng: 78.0312 },
      { lat: 30.3340, lng: 78.0310 },
      { lat: 30.3330, lng: 78.0310 },
    ],
  },
  {
    id: 'road-skinners-oval',
    name: "Skinner's Field 400m Track",
    type: 'track',
    distanceKm: 0.40,
    claimYieldKm2: 0.035,
    description: 'Athletic 400-meter oval track enclosing the championship Skinner Field turf and cricket pavilion.',
    path: [
      { lat: 30.3335, lng: 78.0320 },
      { lat: 30.3336, lng: 78.0338 },
      { lat: 30.3334, lng: 78.0352 },
      { lat: 30.3326, lng: 78.0354 },
      { lat: 30.3318, lng: 78.0350 },
      { lat: 30.3317, lng: 78.0335 },
      { lat: 30.3318, lng: 78.0320 },
      { lat: 30.3326, lng: 78.0318 },
      { lat: 30.3335, lng: 78.0320 },
    ],
  },
  {
    id: 'road-rosebowl-circuit',
    name: 'Rose Bowl Amphitheatre Circuit',
    type: 'campus_loop',
    distanceKm: 0.38,
    claimYieldKm2: 0.032,
    description: 'Scenic loop around the iconic stone Rose Bowl amphitheater and wooded hillside terraces.',
    path: [
      { lat: 30.3355, lng: 78.0332 },
      { lat: 30.3360, lng: 78.0345 },
      { lat: 30.3358, lng: 78.0356 },
      { lat: 30.3348, lng: 78.0358 },
      { lat: 30.3344, lng: 78.0345 },
      { lat: 30.3346, lng: 78.0332 },
      { lat: 30.3355, lng: 78.0332 },
    ],
  },
  {
    id: 'road-west-houses',
    name: 'Boarding Houses West Avenue',
    type: 'avenue',
    distanceKm: 0.58,
    claimYieldKm2: 0.048,
    description: 'Western corridor connecting Jaipur House, Tata House, Kashmir House, and Oberoi House.',
    path: [
      { lat: 30.3374, lng: 78.0268 },
      { lat: 30.3360, lng: 78.0268 },
      { lat: 30.3345, lng: 78.0268 },
      { lat: 30.3330, lng: 78.0270 },
      { lat: 30.3318, lng: 78.0276 },
    ],
  },
  {
    id: 'road-south-sports',
    name: 'South Sports Complex Circuit',
    type: 'campus_loop',
    distanceKm: 0.52,
    claimYieldKm2: 0.045,
    description: 'Connects the Olympic swimming pool, squash courts, gymnasium, and Chakrata Road Gate.',
    path: [
      { lat: 30.3318, lng: 78.0280 },
      { lat: 30.3308, lng: 78.0295 },
      { lat: 30.3298, lng: 78.0302 },
      { lat: 30.3300, lng: 78.0325 },
      { lat: 30.3312, lng: 78.0325 },
      { lat: 30.3318, lng: 78.0305 },
      { lat: 30.3318, lng: 78.0280 },
    ],
  },
  {
    id: 'road-east-ridge',
    name: 'East Riverbank Ridge Path',
    type: 'perimeter',
    distanceKm: 0.55,
    claimYieldKm2: 0.046,
    description: 'Eastern estate boundary path along the forest ridge and stream boundary of Chandbagh.',
    path: [
      { lat: 30.3365, lng: 78.0354 },
      { lat: 30.3355, lng: 78.0362 },
      { lat: 30.3340, lng: 78.0365 },
      { lat: 30.3325, lng: 78.0362 },
      { lat: 30.3312, lng: 78.0352 },
    ],
  },
];

// Helper to retrieve runnable roads strictly within The Doon School
export const getRunnableRoads = (_lat?: number, _lng?: number): RunnableRoad[] => {
  return DOON_SCHOOL_RUNNABLE_ROADS;
};
