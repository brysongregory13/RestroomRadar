// Read from Expo env var first; fall back to the hardcoded key used for Maps embeds
const API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  'AIzaSyBe1gYpo04xF3oUM_wiWOolwy63Vf9LoaQ';

export interface PlacePrediction {
  placeId: string;
  description: string;
}

export interface PlaceLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export async function getPlacePredictions(input: string): Promise<PlacePrediction[]> {
  if (!input.trim()) return [];

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${API_KEY}`;
  console.log('[Places] autocomplete request for:', input);
  console.log('[Places] using API key (last 6):', API_KEY.slice(-6));

  try {
    const res = await fetch(url);
    const json = await res.json();

    console.log('[Places] autocomplete status:', json.status);
    if (json.error_message) console.log('[Places] error_message:', json.error_message);
    if (json.predictions) console.log('[Places] prediction count:', json.predictions.length);

    if (json.status !== 'OK') return [];

    return (json.predictions as Array<{ place_id: string; description: string }>).map((p) => ({
      placeId: p.place_id,
      description: p.description,
    }));
  } catch (e) {
    console.log('[Places] autocomplete fetch error:', e);
    return [];
  }
}

export async function getPlaceLocation(placeId: string): Promise<PlaceLocation | null> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry,formatted_address&key=${API_KEY}`;
  console.log('[Places] details request for placeId:', placeId);

  try {
    const res = await fetch(url);
    const json = await res.json();

    console.log('[Places] details status:', json.status);
    if (json.error_message) console.log('[Places] error_message:', json.error_message);

    if (json.status !== 'OK') return null;

    return {
      lat: json.result.geometry.location.lat,
      lng: json.result.geometry.location.lng,
      formattedAddress: json.result.formatted_address,
    };
  } catch (e) {
    console.log('[Places] details fetch error:', e);
    return null;
  }
}
