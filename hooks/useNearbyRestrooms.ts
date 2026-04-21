import { useState, useEffect, useCallback } from 'react';
import { Restroom } from '../types/Restroom';
import { getNearbyRestrooms } from '../services/restroomService';
import { Filters } from '../context/FiltersContext';

function applyFilters(restrooms: Restroom[], filters: Filters): Restroom[] {
  return restrooms.filter((r) => {
    if (filters.openNowOnly && !r.isOpen) return false;
    if (filters.gender.length > 0 && !r.gender.some((g) => filters.gender.includes(g))) return false;
    if (filters.accessType.length > 0 && !filters.accessType.includes(r.accessType)) return false;
    if (filters.minRating > 0 && r.avgRating < filters.minRating) return false;
    if (
      filters.amenities.length > 0 &&
      !filters.amenities.every((a) => r.amenities.includes(a))
    )
      return false;
    return true;
  });
}

export function useNearbyRestrooms(
  lat: number | null,
  lng: number | null,
  filters: Filters
) {
  const [restrooms, setRestrooms] = useState<Restroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (centerLat: number, centerLng: number) => {
      setLoading(true);
      setError(null);
      try {
        const raw = await getNearbyRestrooms(centerLat, centerLng, filters.radiusMiles);
        setRestrooms(applyFilters(raw, filters));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load restrooms');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (lat !== null && lng !== null) {
      fetch(lat, lng);
    }
  }, [lat, lng, fetch]);

  return { restrooms, loading, error, refetch: fetch };
}
