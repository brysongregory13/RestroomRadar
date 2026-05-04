import React, { createContext, useContext, useReducer, useState } from 'react';
import { Gender, AccessType, Amenity } from '../types/Restroom';

export interface Filters {
  openNowOnly: boolean;
  gender: Gender[];
  accessType: AccessType[];
  minRating: number;
  amenities: Amenity[];
  radiusMiles: number;
  darkMode: boolean;
}

const defaultFilters: Filters = {
  openNowOnly: false,
  gender: [],
  accessType: [],
  minRating: 0,
  amenities: [],
  radiusMiles: 2,
  darkMode: false,
};

type Action =
  | { type: 'SET_FILTERS'; payload: Partial<Filters> }
  | { type: 'RESET' };

function reducer(state: Filters, action: Action): Filters {
  switch (action.type) {
    case 'SET_FILTERS':
      return { ...state, ...action.payload };
    case 'RESET':
      return defaultFilters;
    default:
      return state;
  }
}

interface FiltersContextType {
  filters: Filters;
  setFilters: (updates: Partial<Filters>) => void;
  resetFilters: () => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const FiltersContext = createContext<FiltersContextType | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, dispatch] = useReducer(reducer, defaultFilters);
  const [refreshKey, setRefreshKey] = useState(0);

  function setFilters(updates: Partial<Filters>) {
    dispatch({ type: 'SET_FILTERS', payload: updates });
  }

  function resetFilters() {
    dispatch({ type: 'RESET' });
  }

  function triggerRefresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <FiltersContext.Provider value={{ filters, setFilters, resetFilters, refreshKey, triggerRefresh }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider');
  return ctx;
}
