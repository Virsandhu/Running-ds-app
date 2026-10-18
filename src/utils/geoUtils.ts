export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_METERS = 6371000; // Earth mean radius in meters

/**
 * Calculates distance between two coordinates in meters using the Haversine formula
 */
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

/**
 * Calculates distance between two coordinates in kilometers
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  return calculateDistanceMeters(lat1, lon1, lat2, lon2) / 1000;
};

/**
 * Calculates initial bearing / heading (0 - 360 degrees) from point 1 to point 2
 */
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  const bearing = ((theta * 180) / Math.PI + 360) % 360;
  return Math.round(bearing);
};

/**
 * Returns human-readable compass cardinal direction
 */
export const getCompassDirection = (bearing: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Calculates straight-line displacement (shortest distance) between start and end coordinates
 */
export const calculateDisplacement = (
  points: LatLng[]
): { meters: number; km: number } => {
  if (points.length < 2) return { meters: 0, km: 0 };
  const start = points[0];
  const end = points[points.length - 1];
  const meters = calculateDistanceMeters(start.lat, start.lng, end.lat, end.lng);
  return {
    meters: Math.round(meters),
    km: parseFloat((meters / 1000).toFixed(3)),
  };
};

/**
 * Calculates real-world geographic area of an enclosed polygon loop formed by joining
 * start and end points of a GPS trail. Uses metric planar projection + Shoelace formula.
 */
export const calculatePolygonArea = (
  points: LatLng[]
): {
  areaM2: number;
  areaKm2: number;
  acres: number;
} => {
  if (!points || points.length < 3) {
    return { areaM2: 0, areaKm2: 0, acres: 0 };
  }

  // Calculate centroid as projection reference origin
  let sumLat = 0;
  let sumLng = 0;
  for (const pt of points) {
    sumLat += pt.lat;
    sumLng += pt.lng;
  }
  const refLat = sumLat / points.length;
  const refLng = sumLng / points.length;

  const latToMeters = (Math.PI / 180) * EARTH_RADIUS_METERS;
  const lngToMeters =
    (Math.PI / 180) * EARTH_RADIUS_METERS * Math.cos((refLat * Math.PI) / 180);

  // Convert geodesic coordinates to local metric Cartesian coordinates (x, y)
  const cartesian = points.map((pt) => ({
    x: (pt.lng - refLng) * lngToMeters,
    y: (pt.lat - refLat) * latToMeters,
  }));

  // Ensure polygon is closed for Shoelace calculation
  const closed = [...cartesian];
  if (
    closed[0].x !== closed[closed.length - 1].x ||
    closed[0].y !== closed[closed.length - 1].y
  ) {
    closed.push(closed[0]);
  }

  // Shoelace formula
  let areaSum = 0;
  for (let i = 0; i < closed.length - 1; i++) {
    areaSum += closed[i].x * closed[i + 1].y - closed[i + 1].x * closed[i].y;
  }

  const areaM2 = Math.abs(areaSum) / 2;
  const areaKm2 = parseFloat((areaM2 / 1000000).toFixed(4));
  const acres = parseFloat((areaM2 * 0.000247105).toFixed(2));

  return {
    areaM2: Math.round(areaM2),
    areaKm2,
    acres,
  };
};
