/**
 * Calculates great-circle distance between two GPS coordinates in meters
 * using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

/**
 * Reverse geocodes coordinates to human-readable address using OpenStreetMap Nominatim
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "HRIS-CamStamp-App/1.0",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("Geocode fetch failed");
    const data = await res.json();
    return (
      data.display_name ||
      `${data.address?.road || ""}, ${data.address?.city || data.address?.town || ""}, ${data.address?.country || ""}`.trim() ||
      `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
    );
  } catch (error) {
    console.warn("Reverse geocode fallback:", error);
    return `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export const getReverseGeocodeAddress = reverseGeocode;

/**
 * Validates timestamp drift to prevent clock spoofing
 * Returns true if client timestamp is within allowed tolerance (e.g. 5 minutes)
 */
export function validateTimestampDrift(
  clientTimestampIso: string | number | Date,
  maxDriftSeconds = 300
): { isValid: boolean; driftSeconds: number } {
  const clientTime = new Date(clientTimestampIso).getTime();
  const serverTime = Date.now();
  const driftSeconds = Math.abs(serverTime - clientTime) / 1000;

  return {
    isValid: driftSeconds <= maxDriftSeconds,
    driftSeconds: Math.round(driftSeconds),
  };
}
