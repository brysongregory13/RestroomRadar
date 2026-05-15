import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  StatusBar,
  FlatList,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExploreStackParamList } from '../../navigation/types';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyRestrooms } from '../../hooks/useNearbyRestrooms';
import { useFilters } from '../../context/FiltersContext';
import { useColors } from '../../context/ThemeContext';
import { useMapContext } from '../../context/MapContext';
import { useFavorites } from '../../hooks/useFavorites';
import { Theme } from '../../constants/Theme';
import { getPlacePredictions, getPlaceLocation, PlacePrediction } from '../../services/placesService';
import { distanceMiles } from '../../services/geoService';
import { Restroom } from '../../types/Restroom';
import { StarRating } from '../../components/StarRating';
import { FavoriteButton } from '../../components/FavoriteButton';

type Props = NativeStackScreenProps<ExploreStackParamList, 'Map'>;

const RECENT_SEARCHES_KEY = 'rr_recent_searches';
const SHEET_HEIGHT = 240;
const DEBOUNCE_PAN_MS = 600;

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type Cluster = { restrooms: Restroom[]; lat: number; lng: number };

function clusterMarkers(restrooms: Restroom[], region: Region): Cluster[] {
  if (region.latitudeDelta <= 0.04) {
    return restrooms.map((r) => ({ restrooms: [r], lat: r.lat, lng: r.lng }));
  }
  const threshold = region.latitudeDelta * 0.15;
  const clusters: Cluster[] = [];
  restrooms.forEach((r) => {
    const existing = clusters.find(
      (c) => Math.abs(c.lat - r.lat) < threshold && Math.abs(c.lng - r.lng) < threshold
    );
    if (existing) {
      existing.restrooms.push(r);
      existing.lat = existing.restrooms.reduce((s, x) => s + x.lat, 0) / existing.restrooms.length;
      existing.lng = existing.restrooms.reduce((s, x) => s + x.lng, 0) / existing.restrooms.length;
    } else {
      clusters.push({ restrooms: [r], lat: r.lat, lng: r.lng });
    }
  });
  return clusters;
}

type DropdownItem =
  | (PlacePrediction & { isRecent?: false })
  | { placeId: string; description: string; isRecent: true };

export function MapScreen({ navigation, route }: Props) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const { lat, lng, loading: locLoading } = useLocation();
  const { filters, refreshKey } = useFilters();
  const { updateMap, lastVisited, dismissedPrompts, dismissPrompt } = useMapContext();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const mapRef = useRef<MapView>(null);
  const locationInitialized = useRef(false);
  const panDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [selectedRestroom, setSelectedRestroom] = useState<Restroom | null>(null);
  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { restrooms, loading: restroomsLoading } = useNearbyRestrooms(
    region.latitude,
    region.longitude,
    filters,
    refreshKey
  );

  // Initialize map to user location
  useEffect(() => {
    if (lat !== null && lng !== null && !locationInitialized.current) {
      locationInitialized.current = true;
      const r: Region = { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 };
      setRegion(r);
      mapRef.current?.animateToRegion(r, 500);
    }
  }, [lat, lng]);

  // Re-center from ConfirmScreen params
  useEffect(() => {
    const p = route.params;
    if (p?.centerLat !== undefined && p?.centerLng !== undefined) {
      const r: Region = {
        latitude: p.centerLat,
        longitude: p.centerLng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(r);
      mapRef.current?.animateToRegion(r, 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.centerLat, route.params?.centerLng]);

  // Load recent searches
  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((raw) => { if (raw) setRecentSearches(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  // Sync restrooms to MapContext so ListScreen can read them
  useEffect(() => {
    updateMap({ lat: region.latitude, lng: region.longitude }, restrooms);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restrooms]);

  // Places autocomplete debounce
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim() || !searchFocused) { setPredictions([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      const results = await getPlacePredictions(searchQuery);
      setPredictions(results);
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery, searchFocused]);

  function showSheet(r: Restroom) {
    setSelectedRestroom(r);
    Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
  }

  function hideSheet() {
    Animated.timing(sheetAnim, { toValue: SHEET_HEIGHT, duration: 220, useNativeDriver: true }).start(() => {
      setSelectedRestroom(null);
    });
  }

  function handleRegionChangeComplete(r: Region) {
    if (panDebounceRef.current) clearTimeout(panDebounceRef.current);
    panDebounceRef.current = setTimeout(() => setRegion(r), DEBOUNCE_PAN_MS);
  }

  async function saveRecentSearch(query: string) {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
  }

  async function handleSelectPrediction(prediction: PlacePrediction) {
    setSearchQuery(prediction.description);
    setPredictions([]);
    setSearchFocused(false);
    setSearchLoading(true);
    await saveRecentSearch(prediction.description);
    try {
      const loc = await getPlaceLocation(prediction.placeId);
      if (loc) {
        const r: Region = { latitude: loc.lat, longitude: loc.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
        setRegion(r);
        mapRef.current?.animateToRegion(r, 500);
        setSearchQuery(loc.formattedAddress);
      }
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSelectRecent(query: string) {
    setSearchQuery(query);
    setSearchFocused(false);
  }

  const clusters = useMemo(() => clusterMarkers(restrooms, region), [restrooms, region]);

  const dropdownItems: DropdownItem[] = searchQuery.trim()
    ? predictions.map((p) => ({ ...p, isRecent: false as const }))
    : recentSearches.map((s, i) => ({ placeId: `recent_${i}`, description: s, isRecent: true as const }));
  const showDropdown = searchFocused && dropdownItems.length > 0;

  const showReviewPrompt = !!lastVisited && !dismissedPrompts.has(lastVisited.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

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

      {/* Search Bar + Autocomplete */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search location or address…"
              placeholderTextColor={C.textHint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              returnKeyType="search"
              onSubmitEditing={() => setPredictions([])}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => { setSearchQuery(''); setPredictions([]); }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {searchLoading && (
            <ActivityIndicator size="small" color={C.primary} style={styles.searchSpinner} />
          )}
        </View>

        {showDropdown && (
          <FlatList
            style={styles.dropdown}
            data={dropdownItems}
            keyExtractor={(item) => item.placeId}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() =>
                  item.isRecent
                    ? handleSelectRecent(item.description)
                    : handleSelectPrediction(item as PlacePrediction)
                }
              >
                <Text style={styles.dropdownIcon}>{item.isRecent ? '🕐' : '📍'}</Text>
                <Text style={styles.dropdownText} numberOfLines={2}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {locLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Getting your location…</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}
            onPress={() => { if (selectedRestroom) hideSheet(); }}
          >
            {clusters.map((cluster, i) => {
              const isCluster = cluster.restrooms.length > 1;
              const isSelected =
                selectedRestroom !== null &&
                cluster.restrooms.some((r) => r.id === selectedRestroom.id);
              return (
                <Marker
                  key={i}
                  coordinate={{ latitude: cluster.lat, longitude: cluster.lng }}
                  onPress={() => {
                    if (isCluster) {
                      const r: Region = {
                        latitude: cluster.lat,
                        longitude: cluster.lng,
                        latitudeDelta: region.latitudeDelta / 2,
                        longitudeDelta: region.longitudeDelta / 2,
                      };
                      setRegion(r);
                      mapRef.current?.animateToRegion(r, 400);
                    } else {
                      showSheet(cluster.restrooms[0]);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.markerPin,
                      isSelected && styles.markerPinSelected,
                      isCluster && styles.markerCluster,
                    ]}
                  >
                    <Text style={styles.markerText}>
                      {isCluster ? String(cluster.restrooms.length) : '🚻'}
                    </Text>
                  </View>
                </Marker>
              );
            })}
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

        {/* Count Badge */}
        {!restroomsLoading && restrooms.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{restrooms.length} nearby</Text>
          </View>
        )}

        {/* Loading overlay */}
        {restroomsLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={styles.loadingOverlayText}>Loading…</Text>
          </View>
        )}

        {/* Re-center button */}
        {lat !== null && lng !== null && (
          <TouchableOpacity
            style={styles.recenterBtn}
            onPress={() => {
              const r: Region = { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 };
              setRegion(r);
              mapRef.current?.animateToRegion(r, 500);
            }}
          >
            <Text style={styles.recenterIcon}>⊕</Text>
          </TouchableOpacity>
        )}

        {/* Review Prompt Banner */}
        {showReviewPrompt && lastVisited && (
          <View style={styles.reviewPrompt}>
            <View style={styles.reviewPromptContent}>
              <Text style={styles.reviewPromptText} numberOfLines={1}>
                Rate your visit to{' '}
                <Text style={styles.reviewPromptName}>{lastVisited.name}</Text>?
              </Text>
              <TouchableOpacity
                style={styles.reviewPromptBtn}
                onPress={() => {
                  dismissPrompt(lastVisited.id);
                  navigation.push('Detail', { id: lastVisited.id });
                }}
              >
                <Text style={styles.reviewPromptBtnText}>Leave Review</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => dismissPrompt(lastVisited.id)}
              style={styles.reviewPromptClose}
            >
              <Text style={styles.reviewPromptCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Sheet — always rendered, animated off-screen when hidden */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
          <View style={styles.sheetHandle} />
          {selectedRestroom && (
            <View style={styles.sheetContent}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetName} numberOfLines={1}>{selectedRestroom.name}</Text>
                <FavoriteButton
                  isFavorited={favoriteIds.has(selectedRestroom.id)}
                  onPress={() => toggleFavorite(selectedRestroom.id)}
                />
              </View>
              <Text style={styles.sheetAddress} numberOfLines={1}>{selectedRestroom.address}</Text>
              <View style={styles.sheetRatingRow}>
                <StarRating rating={selectedRestroom.avgRating} size={13} />
                <Text style={styles.sheetRatingText}>
                  {selectedRestroom.avgRating.toFixed(1)} ({selectedRestroom.reviewCount})
                </Text>
                {lat !== null && lng !== null && (
                  <Text style={styles.sheetDistance}>
                    {distanceMiles(lat, lng, selectedRestroom.lat, selectedRestroom.lng).toFixed(1)} mi
                  </Text>
                )}
              </View>
              <View style={styles.sheetStatusRow}>
                <Text
                  style={[
                    styles.sheetStatus,
                    { color: selectedRestroom.isOpen ? C.success : C.danger },
                  ]}
                >
                  {selectedRestroom.isOpen ? 'Open' : 'Closed'}
                </Text>
                {selectedRestroom.reviewCount >= 3 && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ Verified</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.sheetBtn}
                onPress={() => {
                  hideSheet();
                  navigation.push('Detail', { id: selectedRestroom.id });
                }}
              >
                <Text style={styles.sheetBtnText}>View Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.surface },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Theme.spacing.lg,
      paddingVertical: Theme.spacing.md,
      backgroundColor: C.surface,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      zIndex: 10,
    },
    appName: {
      fontSize: Theme.typography.fontSizeLG,
      fontWeight: Theme.typography.weightBold,
      color: C.primary,
    },
    topBarActions: { flexDirection: 'row', gap: Theme.spacing.sm },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: C.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnText: { fontSize: 18 },
    searchWrapper: {
      backgroundColor: C.surface,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      zIndex: 100,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Theme.spacing.lg,
      paddingVertical: Theme.spacing.sm,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.background,
      borderRadius: Theme.radius.pill,
      borderWidth: 1.5,
      borderColor: C.border,
      paddingHorizontal: Theme.spacing.md,
      height: 42,
    },
    searchBarFocused: { borderColor: C.primary, backgroundColor: C.surface },
    searchIcon: { fontSize: 15, marginRight: Theme.spacing.sm },
    searchInput: {
      flex: 1,
      fontSize: Theme.typography.fontSizeBase,
      color: C.textPrimary,
      paddingVertical: 0,
    },
    clearBtn: { padding: 4 },
    clearBtnText: { fontSize: 12, color: C.textHint },
    searchSpinner: { marginLeft: Theme.spacing.sm },
    dropdown: {
      backgroundColor: C.surface,
      borderTopWidth: 1,
      borderTopColor: C.border,
      maxHeight: 220,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Theme.spacing.lg,
      paddingVertical: Theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    dropdownIcon: { fontSize: 14, marginRight: Theme.spacing.sm },
    dropdownText: { flex: 1, fontSize: Theme.typography.fontSizeBase, color: C.textPrimary },
    mapContainer: { flex: 1 },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.background,
    },
    loadingText: {
      marginTop: Theme.spacing.md,
      color: C.textHint,
      fontSize: Theme.typography.fontSizeBase,
    },
    markerPin: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 4,
    },
    markerPinSelected: { backgroundColor: '#E53935', transform: [{ scale: 1.2 }] },
    markerCluster: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0277BD' },
    markerText: { fontSize: 14, color: '#fff', fontWeight: '700' },
    toggleContainer: {
      position: 'absolute',
      top: Theme.spacing.lg,
      right: Theme.spacing.lg,
      zIndex: 10,
    },
    toggle: {
      flexDirection: 'row',
      backgroundColor: C.surface,
      borderRadius: Theme.radius.pill,
      borderWidth: 1,
      borderColor: C.border,
      overflow: 'hidden',
      ...Theme.shadow.sm,
    },
    toggleOption: { paddingHorizontal: Theme.spacing.lg, paddingVertical: Theme.spacing.sm },
    toggleActive: { backgroundColor: C.primary },
    toggleText: {
      fontSize: Theme.typography.fontSizeSM,
      fontWeight: Theme.typography.weightSemibold,
      color: C.textSecondary,
    },
    toggleTextActive: { color: '#fff' },
    countBadge: {
      position: 'absolute',
      top: Theme.spacing.lg,
      left: Theme.spacing.lg,
      backgroundColor: C.surface,
      borderRadius: Theme.radius.pill,
      paddingHorizontal: Theme.spacing.md,
      paddingVertical: 5,
      ...Theme.shadow.sm,
    },
    countBadgeText: {
      fontSize: Theme.typography.fontSizeSM,
      color: C.primary,
      fontWeight: Theme.typography.weightSemibold,
    },
    loadingOverlay: {
      position: 'absolute',
      bottom: SHEET_HEIGHT + Theme.spacing.xl,
      alignSelf: 'center',
      backgroundColor: C.surface,
      borderRadius: Theme.radius.pill,
      paddingHorizontal: Theme.spacing.lg,
      paddingVertical: Theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Theme.spacing.sm,
      ...Theme.shadow.sm,
    },
    loadingOverlayText: { fontSize: Theme.typography.fontSizeSM, color: C.textHint },
    recenterBtn: {
      position: 'absolute',
      bottom: SHEET_HEIGHT + Theme.spacing.sm,
      right: Theme.spacing.lg,
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: C.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...Theme.shadow.md,
    },
    recenterIcon: { fontSize: 22, color: C.primary },
    reviewPrompt: {
      position: 'absolute',
      top: Theme.spacing.md,
      left: Theme.spacing.lg,
      right: Theme.spacing.lg,
      backgroundColor: C.surface,
      borderRadius: Theme.radius.lg,
      padding: Theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 3,
      borderLeftColor: C.primary,
      ...Theme.shadow.md,
    },
    reviewPromptContent: { flex: 1 },
    reviewPromptText: { fontSize: Theme.typography.fontSizeSM, color: C.textPrimary },
    reviewPromptName: { fontWeight: Theme.typography.weightBold, color: C.primary },
    reviewPromptBtn: {
      marginTop: 6,
      backgroundColor: C.primary,
      borderRadius: Theme.radius.pill,
      paddingHorizontal: Theme.spacing.md,
      paddingVertical: 4,
      alignSelf: 'flex-start',
    },
    reviewPromptBtnText: {
      color: '#fff',
      fontSize: Theme.typography.fontSizeXS,
      fontWeight: Theme.typography.weightBold,
    },
    reviewPromptClose: { padding: Theme.spacing.sm },
    reviewPromptCloseText: { fontSize: 16, color: C.textHint },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: SHEET_HEIGHT,
      backgroundColor: C.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      ...Theme.shadow.md,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: C.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 10,
    },
    sheetContent: { paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.sm },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: Theme.spacing.sm,
    },
    sheetName: {
      flex: 1,
      fontSize: Theme.typography.fontSizeMD,
      fontWeight: Theme.typography.weightBold,
      color: C.textPrimary,
    },
    sheetAddress: { fontSize: Theme.typography.fontSizeSM, color: C.textHint, marginBottom: 6 },
    sheetRatingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
      gap: 6,
    },
    sheetRatingText: { fontSize: Theme.typography.fontSizeSM, color: C.textSecondary },
    sheetDistance: { fontSize: Theme.typography.fontSizeSM, color: C.textHint, marginLeft: 4 },
    sheetStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Theme.spacing.sm,
      marginBottom: Theme.spacing.md,
    },
    sheetStatus: { fontSize: Theme.typography.fontSizeSM, fontWeight: Theme.typography.weightSemibold },
    verifiedBadge: {
      backgroundColor: '#E8F5E9',
      borderRadius: Theme.radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    verifiedText: {
      fontSize: Theme.typography.fontSizeXS,
      color: '#2E7D32',
      fontWeight: Theme.typography.weightBold,
    },
    sheetBtn: {
      backgroundColor: C.primary,
      borderRadius: Theme.radius.pill,
      paddingVertical: 12,
      alignItems: 'center',
    },
    sheetBtnText: {
      color: '#fff',
      fontWeight: Theme.typography.weightBold,
      fontSize: Theme.typography.fontSizeBase,
    },
  });
}
