const API_KEY = 'AIzaSyBe1gYpo04xF3oUM_wiWOolwy63Vf9LoaQ';

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
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.status !== 'OK') return [];
    return (json.predictions as Array<{ place_id: string; description: string }>).map((p) => ({
      placeId: p.place_id,
      description: p.description,
    }));
  } catch {
    return [];
  }
}

export async function getPlaceLocation(placeId: string): Promise<PlaceLocation | null> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry,formatted_address&key=${API_KEY}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.status !== 'OK') return null;
    return {
      lat: json.result.geometry.location.lat,
      lng: json.result.geometry.location.lng,
      formattedAddress: json.result.formatted_address,
    };
  } catch {
    return null;
  }
}
