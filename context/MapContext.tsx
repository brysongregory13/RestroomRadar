import React, { createContext, useContext, useState } from 'react';
import { Restroom } from '../types/Restroom';

interface MapContextType {
  mapCenter: { lat: number; lng: number } | null;
  mapRestrooms: Restroom[];
  lastVisited: { id: string; name: string } | null;
  dismissedPrompts: Set<string>;
  updateMap: (center: { lat: number; lng: number }, restrooms: Restroom[]) => void;
  setLastVisited: (r: { id: string; name: string } | null) => void;
  dismissPrompt: (id: string) => void;
}

const MapContext = createContext<MapContextType>({
  mapCenter: null,
  mapRestrooms: [],
  lastVisited: null,
  dismissedPrompts: new Set(),
  updateMap: () => {},
  setLastVisited: () => {},
  dismissPrompt: () => {},
});

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapRestrooms, setMapRestrooms] = useState<Restroom[]>([]);
  const [lastVisited, setLastVisited] = useState<{ id: string; name: string } | null>(null);
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set());

  function updateMap(center: { lat: number; lng: number }, restrooms: Restroom[]) {
    setMapCenter(center);
    setMapRestrooms(restrooms);
  }

  function dismissPrompt(id: string) {
    setDismissedPrompts((prev) => new Set([...prev, id]));
  }

  return (
    <MapContext.Provider
      value={{ mapCenter, mapRestrooms, lastVisited, dismissedPrompts, updateMap, setLastVisited, dismissPrompt }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  return useContext(MapContext);
}
