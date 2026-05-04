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

  // Keep a ref to the latest filters so snapshot callbacks always apply current filters
  // even when the subscription hasn't been recreated (e.g. only openNowOnly changed)
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Raw data from Firestore — updated by the subscription callback
  const rawRef = useRef<Restroom[]>([]);

  // Re-subscribe when position or radius changes (requires a new geohash query).
  // refreshKey forces a full re-subscribe (e.g. after adding a restroom).
  useEffect(() => {
    if (lat === null || lng === null) return;

    setLoading(true);
    setError(null);
    rawRef.current = [];

    const unsub = subscribeNearbyRestrooms(
      lat,
      lng,
      filtersRef.current.radiusMiles,
      (raw, allShardsReady) => {
        rawRef.current = raw;
        setRestrooms(applyFilters(raw, filtersRef.current));
        if (allShardsReady) setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      }
    );

    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, filters.radiusMiles, refreshKey]);

  // When non-radius filters change, re-apply them to the current raw data without
  // re-subscribing to Firestore.
  useEffect(() => {
    setRestrooms(applyFilters(rawRef.current, filters));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.openNowOnly, filters.gender, filters.accessType, filters.minRating, filters.amenities]);

  return { restrooms, loading, error };
}
