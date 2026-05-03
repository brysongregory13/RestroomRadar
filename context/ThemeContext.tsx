import React, { createContext, useContext } from 'react';
import { LightColors, DarkColors, ColorScheme } from '../constants/Colors';
import { useFilters } from './FiltersContext';

const ThemeContext = createContext<ColorScheme>(LightColors);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { filters } = useFilters();
  return (
    <ThemeContext.Provider value={filters.darkMode ? DarkColors : LightColors}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColors(): ColorScheme {
  return useContext(ThemeContext);
}
