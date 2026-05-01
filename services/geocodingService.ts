const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export interface GeocodedLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export async function geocodeAddress(query: string): Promise<GeocodedLocation | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    query
  )}&key=${API_KEY}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== 'OK' || json.results.length === 0) return null;

  const result = json.results[0];
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}
