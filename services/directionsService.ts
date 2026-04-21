const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY ?? '';

export interface DirectionsResult {
  polyline: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
}

export async function getDirections(
  origin: string,
  destination: string
): Promise<DirectionsResult> {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}&key=${API_KEY}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== 'OK') {
    throw new Error(`Directions API error: ${json.status}`);
  }

  const route = json.routes[0];
  const leg = route.legs[0];
  return {
    polyline: route.overview_polyline.points,
    startLocation: leg.start_location,
    endLocation: leg.end_location,
  };
}
