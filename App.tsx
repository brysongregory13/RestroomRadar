import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './context/AuthContext';
import { FiltersProvider } from './context/FiltersContext';
import { ThemeProvider } from './context/ThemeContext';
import { MapProvider } from './context/MapContext';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <FiltersProvider>
            <ThemeProvider>
              <MapProvider>
                <AppNavigator />
              </MapProvider>
            </ThemeProvider>
          </FiltersProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
