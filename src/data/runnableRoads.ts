export interface RunnableRoad {
  id: string;
  name: string;
  type: 'arterial' | 'campus_loop' | 'track' | 'perimeter' | 'avenue';
  distanceKm: number;
  claimYieldKm2: number;
  path: { lat: number; lng: number }[];
  description: string;
}

// Named claimable roads around The Doon School (Chandbagh Estate, Dehradun)
export const DOON_SCHOOL_RUNNABLE_ROADS: RunnableRoad[] = [
  {
    id: 'road-mall-rd',
    name: 'Mall Road Arterial',
    type: 'arterial',
    distanceKm: 1.2,
    claimYieldKm2: 0.85,
    description: 'Main northern perimeter road bounding The Doon School campus.',
    path: [
      { lat: 30.3358, lng: 78.0255 },
      { lat: 30.3355, lng: 78.0280 },
      { lat: 30.3352, lng: 78.0302 },
      { lat: 30.3350, lng: 78.0335 },
      { lat: 30.3347, lng: 78.0375 },
    ],
  },
  {
    id: 'road-chakrata-rd',
    name: 'Chakrata Road (NH-72 Corridor)',
    type: 'arterial',
    distanceKm: 1.4,
    claimYieldKm2: 1.1,
    description: 'Southwest main corridor connecting to Clock Tower and Cantt.',
    path: [
      { lat: 30.3312, lng: 78.0250 },
      { lat: 30.3315, lng: 78.0285 },
      { lat: 30.3318, lng: 78.0325 },
      { lat: 30.3321, lng: 78.0365 },
      { lat: 30.3323, lng: 78.0390 },
    ],
  },
  {
    id: 'road-cantt-link',
    name: 'New Cantt Road Link',
    type: 'perimeter',
    distanceKm: 0.65,
    claimYieldKm2: 0.45,
    description: 'West perimeter connecting Mall Road to Chakrata Road.',
    path: [
      { lat: 30.3370, lng: 78.0282 },
      { lat: 30.3353, lng: 78.0285 },
      { lat: 30.3332, lng: 78.0284 },
      { lat: 30.3315, lng: 78.0285 },
    ],
  },
  {
    id: 'road-kaulagarh-link',
    name: 'Kaulagarh Road Connector',
    type: 'arterial',
    distanceKm: 0.8,
    claimYieldKm2: 0.6,
    description: 'Northwest arterial branch through Dehradun residential sector.',
    path: [
      { lat: 30.3375, lng: 78.0260 },
      { lat: 30.3355, lng: 78.0275 },
      { lat: 30.3338, lng: 78.0268 },
      { lat: 30.3312, lng: 78.0250 },
    ],
  },
  {
    id: 'road-chandbagh-avenue',
    name: 'Chandbagh Central Avenue',
    type: 'avenue',
    distanceKm: 0.35,
    claimYieldKm2: 0.28,
    description: 'Tree-lined spine of The Doon School connecting Mall Gate to Main Building.',
    path: [
      { lat: 30.3352, lng: 78.0302 },
      { lat: 30.3344, lng: 78.0304 },
      { lat: 30.3338, lng: 78.0305 },
      { lat: 30.3329, lng: 78.0306 },
    ],
  },
  {
    id: 'road-skinners-track',
    name: "Skinner's Field 400m Oval Track",
    type: 'track',
    distanceKm: 0.4,
    claimYieldKm2: 0.22,
    description: 'Athletic 400-meter loop enclosing the prestigious Skinner Field turf.',
    path: [
      { lat: 30.3335, lng: 78.0310 },
      { lat: 30.3335, lng: 78.0316 },
      { lat: 30.3332, lng: 78.0317 },
      { lat: 30.3328, lng: 78.0316 },
      { lat: 30.3328, lng: 78.0310 },
      { lat: 30.3331, lng: 78.0309 },
      { lat: 30.3335, lng: 78.0310 },
    ],
  },
  {
    id: 'road-rosebowl-loop',
    name: 'Rose Bowl Amphitheatre Circuit',
    type: 'campus_loop',
    distanceKm: 0.28,
    claimYieldKm2: 0.18,
    description: 'Scenic circuit looping around the historic Rose Bowl stone amphitheater.',
    path: [
      { lat: 30.3348, lng: 78.0312 },
      { lat: 30.3348, lng: 78.0319 },
      { lat: 30.3344, lng: 78.0320 },
      { lat: 30.3343, lng: 78.0313 },
      { lat: 30.3348, lng: 78.0312 },
    ],
  },
  {
    id: 'road-north-quad',
    name: 'North Quad & Masters Loop',
    type: 'campus_loop',
    distanceKm: 0.45,
    claimYieldKm2: 0.32,
    description: 'North campus loop connecting residential boarding houses.',
    path: [
      { lat: 30.3352, lng: 78.0302 },
      { lat: 30.3350, lng: 78.0325 },
      { lat: 30.3344, lng: 78.0322 },
      { lat: 30.3344, lng: 78.0304 },
    ],
  },
  {
    id: 'road-south-pavilion',
    name: 'South Pavilion & Gymnasium Circuit',
    type: 'campus_loop',
    distanceKm: 0.5,
    claimYieldKm2: 0.38,
    description: 'Connects indoor sports facilities, tennis courts, and swimming pavilion.',
    path: [
      { lat: 30.3338, lng: 78.0305 },
      { lat: 30.3335, lng: 78.0325 },
      { lat: 30.3325, lng: 78.0324 },
      { lat: 30.3324, lng: 78.0306 },
    ],
  },
  {
    id: 'road-east-perimeter',
    name: 'East Perimeter & River Trail',
    type: 'perimeter',
    distanceKm: 0.48,
    claimYieldKm2: 0.35,
    description: 'Eastern boundary road running along the Chandbagh estate perimeter.',
    path: [
      { lat: 30.3350, lng: 78.0335 },
      { lat: 30.3338, lng: 78.0338 },
      { lat: 30.3325, lng: 78.0335 },
      { lat: 30.3319, lng: 78.0330 },
    ],
  },
  {
    id: 'road-clocktower-link',
    name: 'Rajpur Road / Clock Tower Link',
    type: 'arterial',
    distanceKm: 1.1,
    claimYieldKm2: 0.75,
    description: 'Major arterial road heading east toward the historic Dehradun Clock Tower.',
    path: [
      { lat: 30.3323, lng: 78.0390 },
      { lat: 30.3300, lng: 78.0415 },
      { lat: 30.3280, lng: 78.0430 },
      { lat: 30.3256, lng: 78.0437 },
    ],
  },
];

// Helper to generate runnable claiming roads dynamically around any location
export const getRunnableRoads = (lat: number, lng: number): RunnableRoad[] => {
  const isNearDoonSchool = Math.abs(lat - 30.3340) < 0.04 && Math.abs(lng - 78.0308) < 0.04;

  if (isNearDoonSchool) {
    return DOON_SCHOOL_RUNNABLE_ROADS;
  }

  // Generic procedural claimable road grid around runner's coordinates
  return [
    {
      id: 'road-north-ave',
      name: 'North Boulevard (Claim Corridor)',
      type: 'arterial',
      distanceKm: 1.0,
      claimYieldKm2: 0.65,
      description: 'Northern claiming avenue bounding local sectors.',
      path: [
        { lat: lat + 0.0035, lng: lng - 0.006 },
        { lat: lat + 0.0032, lng: lng - 0.002 },
        { lat: lat + 0.003, lng: lng + 0.002 },
        { lat: lat + 0.0028, lng: lng + 0.006 },
      ],
    },
    {
      id: 'road-south-ave',
      name: 'South Avenue (Claim Corridor)',
      type: 'arterial',
      distanceKm: 1.1,
      claimYieldKm2: 0.7,
      description: 'Southern arterial road for enclosing lower territory.',
      path: [
        { lat: lat - 0.0035, lng: lng - 0.006 },
        { lat: lat - 0.0032, lng: lng - 0.002 },
        { lat: lat - 0.003, lng: lng + 0.002 },
        { lat: lat - 0.0028, lng: lng + 0.006 },
      ],
    },
    {
      id: 'road-west-link',
      name: 'West Parkway',
      type: 'perimeter',
      distanceKm: 0.8,
      claimYieldKm2: 0.5,
      description: 'Connecting north and south boulevards.',
      path: [
        { lat: lat + 0.0035, lng: lng - 0.004 },
        { lat: lat + 0.001, lng: lng - 0.0042 },
        { lat: lat - 0.0015, lng: lng - 0.004 },
        { lat: lat - 0.0035, lng: lng - 0.004 },
      ],
    },
    {
      id: 'road-east-link',
      name: 'East Crossway',
      type: 'perimeter',
      distanceKm: 0.8,
      claimYieldKm2: 0.5,
      description: 'Eastern arterial connecting border sectors.',
      path: [
        { lat: lat + 0.003, lng: lng + 0.004 },
        { lat: lat + 0.001, lng: lng + 0.0038 },
        { lat: lat - 0.0015, lng: lng + 0.004 },
        { lat: lat - 0.003, lng: lng + 0.004 },
      ],
    },
    {
      id: 'road-center-loop',
      name: 'Central Turf Loop',
      type: 'campus_loop',
      distanceKm: 0.9,
      claimYieldKm2: 0.55,
      description: 'High-density runnable circuit enclosing the core sector.',
      path: [
        { lat: lat + 0.0015, lng: lng - 0.002 },
        { lat: lat + 0.0015, lng: lng + 0.002 },
        { lat: lat - 0.0015, lng: lng + 0.002 },
        { lat: lat - 0.0015, lng: lng - 0.002 },
        { lat: lat + 0.0015, lng: lng - 0.002 },
      ],
    },
  ];
};
