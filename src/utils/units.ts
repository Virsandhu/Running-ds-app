// All user-facing measurements are shown in metres (data is stored in km / km²)

export const kmToMetres = (km: number): number => Math.round(km * 1000);

export const km2ToSquareMetres = (km2: number): number => Math.round(km2 * 1_000_000);

export const formatMetres = (km: number): string => kmToMetres(km).toLocaleString();

export const formatSquareMetres = (km2: number): string => km2ToSquareMetres(km2).toLocaleString();

// Pace as min:sec per 100 m, from seconds per km
export const formatPacePer100m = (secondsPerKm: number): string => {
  const secs = Math.round(secondsPerKm / 10);
  return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
};
