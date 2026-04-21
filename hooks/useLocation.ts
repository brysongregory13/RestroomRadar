import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ lat: null, lng: null, error: 'Location permission denied', loading: false });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setState({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        error: null,
        loading: false,
      });
    })();
  }, []);

  return state;
}
