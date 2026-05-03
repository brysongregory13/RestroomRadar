import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../../navigation/types';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyRestrooms } from '../../hooks/useNearbyRestrooms';
import { useFilters } from '../../context/FiltersContext';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import { distanceMiles } from '../../services/geoService';
import { geocodeAddress } from '../../services/geocodingService';

type Props = NativeStackScreenProps<ExploreStackParamList, 'Map'>;

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const PAN_THRESHOLD_MILES = 0.5;

function buildMapHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #f5f7f5; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map, markers = [];

    function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: ${lat}, lng: ${lng} },
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
      });

      new google.maps.Marker({
        position: { lat: ${lat}, lng: ${lng} },
        map: map,
        zIndex: 999,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2.5,
        }
      });

      var lastLat = ${lat}, lastLng = ${lng};
      map.addListener('idle', function() {
        var c = map.getCenter();
        var lat = c.lat(), lng = c.lng();
        var d = Math.sqrt(Math.pow(lat - lastLat, 2) + Math.pow(lng - lastLng, 2));
        if (d > 0.005) {
          lastLat = lat; lastLng = lng;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'region_change', lat: lat, lng: lng }));
        }
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_ready' }));
    }

    function updateMarkers(restrooms) {
      markers.forEach(function(m) { m.setMap(null); });
      markers = [];
      restrooms.forEach(function(r) {
        var m = new google.maps.Marker({
          position: { lat: r.lat, lng: r.lng },
          map: map,
          title: r.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: r.isOpen ? '#00897B' : '#E53935',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }
        });
        (function(id) {
          m.addListener('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pin_tap', id: id }));
          });
        })(r.id);
        markers.push(m);
      });
    }

    function panTo(lat, lng) {
      map.panTo({ lat: lat, lng: lng });
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&callback=initMap" async defer></script>
</body>
</html>`;
}

export function MapScreen({ navigation }: Props) {
  const { lat, lng, loading: locLoading } = useLocation();
  const { filters } = useFilters();
  const { restrooms, loading: restroomsLoading, refetch } = useNearbyRestrooms(lat, lng, filters);

  const webviewRef = useRef<WebView>(null);
  const lastFetchCenter = useRef<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const mapLat = lat ?? 37.7749;
  const mapLng = lng ?? -122.4194;

  useEffect(() => {
    if (!mapReady || !webviewRef.current) return;
    const data = restrooms.map((r) => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      name: r.name,
      isOpen: r.isOpen && !r.isClosed,
    }));
    webviewRef.current.injectJavaScript(`updateMarkers(${JSON.stringify(data)}); true;`);
  }, [restrooms, mapReady]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'map_ready') {
          setMapReady(true);
        } else if (msg.type === 'pin_tap') {
          navigation.push('Detail', { id: msg.id });
        } else if (msg.type === 'region_change') {
          if (!lastFetchCenter.current) {
            lastFetchCenter.current = { lat: msg.lat, lng: msg.lng };
            return;
          }
          const dist = distanceMiles(
            lastFetchCenter.current.lat,
            lastFetchCenter.current.lng,
            msg.lat,
            msg.lng
          );
          if (dist >= PAN_THRESHOLD_MILES) {
            lastFetchCenter.current = { lat: msg.lat, lng: msg.lng };
            refetch(msg.lat, msg.lng);
          }
        }
      } catch {}
    },
    [navigation, refetch]
  );

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const result = await geocodeAddress(searchQuery.trim());
      if (result) {
        webviewRef.current?.injectJavaScript(`panTo(${result.lat}, ${result.lng}); true;`);
        refetch(result.lat, result.lng);
        setSearchQuery(result.formattedAddress);
      }
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>RestroomRadar</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.getParent()?.navigate('Profile')}
          >
            <Text style={styles.iconBtnText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.getParent()?.navigate('Settings')}
          >
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search location or address…"
            placeholderTextColor={Colors.textHint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {searchLoading && (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.searchSpinner} />
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {locLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Getting your location…</Text>
          </View>
        ) : (
          <WebView
            ref={webviewRef}
            style={StyleSheet.absoluteFill}
            source={{ html: buildMapHtml(mapLat, mapLng) }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={[StyleSheet.absoluteFill, styles.centered]}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            )}
          />
        )}

        {/* Map/List toggle */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggle}>
            <View style={[styles.toggleOption, styles.toggleActive]}>
              <Text style={[styles.toggleText, styles.toggleTextActive]}>Map</Text>
            </View>
            <TouchableOpacity style={styles.toggleOption} onPress={() => navigation.replace('List')}>
              <Text style={styles.toggleText}>List</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pin count badge */}
        {!restroomsLoading && restrooms.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{restrooms.length} nearby</Text>
          </View>
        )}

        {restroomsLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingOverlayText}>Loading…</Text>
          </View>
        )}

        {/* Recenter */}
        {lat !== null && lng !== null && (
          <TouchableOpacity
            style={styles.recenterBtn}
            onPress={() => webviewRef.current?.injectJavaScript(`panTo(${lat}, ${lng}); true;`)}
          >
            <Text style={styles.recenterIcon}>⊕</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  appName: {
    fontSize: Theme.typography.fontSizeLG,
    fontWeight: Theme.typography.weightBold,
    color: Colors.primary,
  },
  topBarActions: { flexDirection: 'row', gap: Theme.spacing.sm },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Theme.radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Theme.spacing.md,
    height: 42,
  },
  searchBarFocused: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  searchIcon: { fontSize: 15, marginRight: Theme.spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: Theme.typography.fontSizeBase,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: { padding: 4 },
  clearBtnText: { fontSize: 12, color: Colors.textHint },
  searchSpinner: { marginLeft: Theme.spacing.sm },
  mapContainer: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    color: Colors.textHint,
    fontSize: Theme.typography.fontSizeBase,
  },
  toggleContainer: {
    position: 'absolute',
    top: Theme.spacing.lg,
    right: Theme.spacing.lg,
    zIndex: 10,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Theme.shadow.sm,
  },
  toggleOption: { paddingHorizontal: Theme.spacing.lg, paddingVertical: Theme.spacing.sm },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: {
    fontSize: Theme.typography.fontSizeSM,
    fontWeight: Theme.typography.weightSemibold,
    color: Colors.textSecondary,
  },
  toggleTextActive: { color: '#fff' },
  countBadge: {
    position: 'absolute',
    top: Theme.spacing.lg,
    left: Theme.spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Theme.radius.pill,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 5,
    ...Theme.shadow.sm,
  },
  countBadgeText: {
    fontSize: Theme.typography.fontSizeSM,
    color: Colors.primary,
    fontWeight: Theme.typography.weightSemibold,
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: Theme.spacing.xl,
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Theme.radius.pill,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    ...Theme.shadow.sm,
  },
  loadingOverlayText: { fontSize: Theme.typography.fontSizeSM, color: Colors.textHint },
  recenterBtn: {
    position: 'absolute',
    bottom: Theme.spacing.xl,
    right: Theme.spacing.lg,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.md,
  },
  recenterIcon: { fontSize: 22, color: Colors.primary },
});
