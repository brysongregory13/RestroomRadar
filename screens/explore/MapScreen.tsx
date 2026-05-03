import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../../navigation/types';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyRestrooms } from '../../hooks/useNearbyRestrooms';
import { useFilters } from '../../context/FiltersContext';
import { useColors } from '../../context/ThemeContext';
import { Theme } from '../../constants/Theme';
import { getPlacePredictions, getPlaceLocation, PlacePrediction } from '../../services/placesService';

type Props = NativeStackScreenProps<ExploreStackParamList, 'Map'>;

export function MapScreen({ navigation, route }: Props) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const { lat, lng, loading: locLoading } = useLocation();
  const [center, setCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const locationInitialized = useRef(false);

  const { filters, refreshKey } = useFilters();
  const { restrooms, loading: restroomsLoading } = useNearbyRestrooms(center.lat, center.lng, filters, refreshKey);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (lat !== null && lng !== null && !locationInitialized.current) {
      locationInitialized.current = true;
      setCenter({ lat, lng });
    }
  }, [lat, lng]);

  // Re-center when arriving from ConfirmScreen
  useEffect(() => {
    const p = route.params;
    if (p?.centerLat !== undefined && p?.centerLng !== undefined) {
      setCenter({ lat: p.centerLat, lng: p.centerLng });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.centerLat, route.params?.centerLng]);

  // Debounced Places Autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim() || !searchFocused) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await getPlacePredictions(searchQuery);
      setPredictions(results);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, searchFocused]);

  async function handleSelectPrediction(prediction: PlacePrediction) {
    setSearchQuery(prediction.description);
    setPredictions([]);
    setSearchFocused(false);
    setSearchLoading(true);
    try {
      const loc = await getPlaceLocation(prediction.placeId);
      if (loc) {
        setCenter({ lat: loc.lat, lng: loc.lng });
        setSearchQuery(loc.formattedAddress);
      }
    } finally {
      setSearchLoading(false);
    }
  }

  const showDropdown = searchFocused && predictions.length > 0;

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

      {/* Search Bar + Autocomplete Dropdown */}
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
            data={predictions}
            keyExtractor={(p) => p.placeId}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleSelectPrediction(item)}
              >
                <Text style={styles.dropdownIcon}>📍</Text>
                <Text style={styles.dropdownText} numberOfLines={2}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {locLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={C.primary} />
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
                <ActivityIndicator size="large" color={C.primary} />
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

        {!restroomsLoading && restrooms.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{restrooms.length} nearby</Text>
          </View>
        )}

        {restroomsLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={styles.loadingOverlayText}>Loading…</Text>
          </View>
        )}

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
    dropdownText: {
      flex: 1,
      fontSize: Theme.typography.fontSizeBase,
      color: C.textPrimary,
    },
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
      bottom: Theme.spacing.xl,
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
      bottom: Theme.spacing.xl,
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
  });
}
