import { useState, useEffect, useRef } from 'react';
import { Restroom } from '../types/Restroom';
import { subscribeNearbyRestrooms } from '../services/restroomService';
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
  filters: Filters,
  refreshKey?: number
) {
  const [restrooms, setRestrooms] = useState<Restroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always-current ref so snapshot callbacks never use stale filter values
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Raw Firestore results before client-side filtering
  const rawRef = useRef<Restroom[]>([]);

  // Re-subscribe when position, radius, or refreshKey changes
  useEffect(() => {
    if (lat === null || lng === null) {
      console.log('[useNearbyRestrooms] waiting for location (lat/lng is null)');
      return;
    }

    console.log(`[useNearbyRestrooms] subscribing — lat=${lat} lng=${lng} radius=${filtersRef.current.radiusMiles}mi refreshKey=${refreshKey}`);
    setLoading(true);
    setError(null);
    rawRef.current = [];

    const unsub = subscribeNearbyRestrooms(
      lat,
      lng,
      filtersRef.current.radiusMiles,
      (raw, allShardsReady) => {
        console.log(`[useNearbyRestrooms] received ${raw.length} raw docs, allReady=${allShardsReady}`);
        rawRef.current = raw;
        const filtered = applyFilters(raw, filtersRef.current);
        console.log(`[useNearbyRestrooms] after client filters: ${filtered.length} restrooms (openNowOnly=${filtersRef.current.openNowOnly})`);
        setRestrooms(filtered);
        if (allShardsReady) setLoading(false);
      },
      (e) => {
        console.log('[useNearbyRestrooms] subscription error:', e.message);
        setError(e.message);
        setLoading(false);
      }
    );

    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, filters.radiusMiles, refreshKey]);

  // Re-apply client-side filters without tearing down Firestore subscription
  useEffect(() => {
    const filtered = applyFilters(rawRef.current, filters);
    console.log(`[useNearbyRestrooms] filter re-apply: ${filtered.length} restrooms from ${rawRef.current.length} raw`);
    setRestrooms(filtered);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.openNowOnly, filters.gender, filters.accessType, filters.minRating, filters.amenities]);

  return { restrooms, loading, error };
}
