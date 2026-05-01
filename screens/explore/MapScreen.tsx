import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../../navigation/types';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyRestrooms } from '../../hooks/useNearbyRestrooms';
import { useFilters } from '../../context/FiltersContext';
import { RestroomPin } from '../../components/RestroomPin';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import { distanceMiles } from '../../services/geoService';
import { geocodeAddress } from '../../services/geocodingService';

type Props = NativeStackScreenProps<ExploreStackParamList, 'Map'>;

const DELTA = 0.05;
const PAN_THRESHOLD_MILES = 0.5;

export function MapScreen({ navigation }: Props) {
  const { lat, lng, loading: locLoading } = useLocation();
  const { filters } = useFilters();
  const { restrooms, loading: restroomsLoading, refetch } = useNearbyRestrooms(lat, lng, filters);

  const mapRef = useRef<MapView>(null);
  const lastFetchCenter = useRef<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      const center = { lat: region.latitude, lng: region.longitude };
      if (!lastFetchCenter.current) {
        lastFetchCenter.current = center;
        return;
      }
      const dist = distanceMiles(
        lastFetchCenter.current.lat,
        lastFetchCenter.current.lng,
        center.lat,
        center.lng
      );
      if (dist >= PAN_THRESHOLD_MILES) {
        lastFetchCenter.current = center;
        refetch(center.lat, center.lng);
      }
    },
    [refetch]
  );

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const result = await geocodeAddress(searchQuery.trim());
      if (result) {
        mapRef.current?.animateToRegion({
          latitude: result.lat,
          longitude: result.lng,
          latitudeDelta: DELTA,
          longitudeDelta: DELTA,
        });
        refetch(result.lat, result.lng);
        setSearchQuery(result.formattedAddress);
      }
    } finally {
      setSearchLoading(false);
    }
  }

  const initialRegion =
    lat !== null && lng !== null
      ? { latitude: lat, longitude: lng, latitudeDelta: DELTA, longitudeDelta: DELTA }
      : undefined;

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
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={styles.searchSpinner}
          />
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
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton={false}
            onMapReady={() => setMapReady(true)}
            onRegionChangeComplete={handleRegionChangeComplete}
            provider={Platform.OS === 'android' ? 'google' : undefined}
          >
            {mapReady &&
              restrooms.map((r) => (
                <RestroomPin
                  key={r.id}
                  restroom={r}
                  onPress={() => navigation.push('Detail', { id: r.id })}
                />
              ))}
          </MapView>
        )}

        {/* Map/List toggle */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggle}>
            <View style={[styles.toggleOption, styles.toggleActive]}>
              <Text style={[styles.toggleText, styles.toggleTextActive]}>Map</Text>
            </View>
            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() => navigation.replace('List')}
            >
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

        {/* Recenter button */}
        {lat !== null && lng !== null && (
          <TouchableOpacity
            style={styles.recenterBtn}
            onPress={() => {
              mapRef.current?.animateToRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: DELTA,
                longitudeDelta: DELTA,
              });
            }}
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
  searchBarFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
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
  toggleOption: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
  },
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
  loadingOverlayText: {
    fontSize: Theme.typography.fontSizeSM,
    color: Colors.textHint,
  },
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
