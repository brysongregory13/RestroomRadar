import { useState, useCallback } from 'react';
import { Restroom } from '../types/Restroom';
import { getDirections } from '../services/directionsService';
import { getNearbyRestrooms } from '../services/restroomService';
import { decodePolyline, samplePolyline } from '../services/geoService';

interface RouteResult {
  restrooms: Restroom[];
  polylinePoints: { lat: number; lng: number }[];
  startLocation: { lat: number; lng: number } | null;
  endLocation: { lat: number; lng: number } | null;
}

export function useRouteRestrooms() {
  const [result, setResult] = useState<RouteResult>({
    restrooms: [],
    polylinePoints: [],
    startLocation: null,
    endLocation: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (origin: string, destination: string, corridorMiles: number) => {
    setLoading(true);
    setError(null);
    try {
      const directions = await getDirections(origin, destination);
      const polylinePoints = decodePolyline(directions.polyline);
      const sampleInterval = Math.max(corridorMiles / 2, 1);
      const samples = samplePolyline(polylinePoints, sampleInterval);

      const seen = new Set<string>();
      const all: Restroom[] = [];

      await Promise.all(
        samples.map(async (pt) => {
          const nearby = await getNearbyRestrooms(pt.lat, pt.lng, corridorMiles);
          nearby.forEach((r) => {
            if (!seen.has(r.id)) {
              seen.add(r.id);
              all.push(r);
            }
          });
        })
      );

      setResult({
        restrooms: all,
        polylinePoints,
        startLocation: directions.startLocation,
        endLocation: directions.endLocation,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Route search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { ...result, loading, error, search };
}
