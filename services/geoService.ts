import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';

export function computeGeohash(lat: number, lng: number): string {
  return geohashForLocation([lat, lng]);
}

export function getGeohashBounds(lat: number, lng: number, radiusMiles: number) {
  const radiusKm = radiusMiles * 1.60934;
  return geohashQueryBounds([lat, lng], radiusKm * 1000);
}

export function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const km = distanceBetween([lat1, lng1], [lat2, lng2]);
  return km / 1.60934;
}

export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

export function samplePolyline(
  points: { lat: number; lng: number }[],
  intervalMiles: number
): { lat: number; lng: number }[] {
  if (points.length === 0) return [];
  const sampled: { lat: number; lng: number }[] = [points[0]];
  let accumulated = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    accumulated += distanceMiles(prev.lat, prev.lng, curr.lat, curr.lng);
    if (accumulated >= intervalMiles) {
      sampled.push(curr);
      accumulated = 0;
    }
  }

  const last = points[points.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}
