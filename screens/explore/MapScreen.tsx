import React, { useState, useEffect, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../../navigation/types';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyRestrooms } from '../../hooks/useNearbyRestrooms';
import { useFilters } from '../../context/FiltersContext';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import { geocodeAddress } from '../../services/geocodingService';

type Props = NativeStackScreenProps<ExploreStackParamList, 'Map'>;

export function MapScreen({ navigation }: Props) {
  const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const { lat, lng, loading: locLoading } = useLocation();
  const [center, setCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const locationInitialized = useRef(false);

  const { filters } = useFilters();
  const { restrooms, loading: restroomsLoading } = useNearbyRestrooms(center.lat, center.lng, filters);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (lat !== null && lng !== null && !locationInitialized.current) {
      locationInitialized.current = true;
      setCenter({ lat, lng });
    }
  }, [lat, lng]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const result = await geocodeAddress(searchQuery.trim());
      if (result) {
        setCenter({ lat: result.lat, lng: result.lng });
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
            style={StyleSheet.absoluteFill}
            source={{ html: `<html><head><meta name='viewport' content='initial-scale=1,maximum-scale=1,user-scalable=no'><style>*{margin:0;padding:0;}html,body{width:100%;height:100%;}</style></head><body><iframe width='100%' height='100%' style='border:0;' src='https://www.google.com/maps/embed/v1/view?key=AIzaSyBe1gYpo04xF3oUM_wiWOolwy63Vf9LoaQ&center=${center.lat},${center.lng}&zoom=15' allowfullscreen></iframe></body></html>` }}
            javaScriptEnabled
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

        {/* Nearby count badge */}
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
            onPress={() => setCenter({ lat, lng })}
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
