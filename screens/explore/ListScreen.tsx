import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../../navigation/types';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyRestrooms } from '../../hooks/useNearbyRestrooms';
import { useFilters } from '../../context/FiltersContext';
import { RestroomCard } from '../../components/RestroomCard';
import { Restroom } from '../../types/Restroom';
import { distanceMiles } from '../../services/geoService';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type SortKey = 'closest' | 'rating' | 'recent';
type Props = NativeStackScreenProps<ExploreStackParamList, 'List'>;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'closest', label: 'Closest' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'recent', label: 'Most Recent' },
];

export function ListScreen({ navigation }: Props) {
  const { lat, lng } = useLocation();
  const { filters, refreshKey } = useFilters();
  const { restrooms, loading, error } = useNearbyRestrooms(lat, lng, filters, refreshKey);
  const [sort, setSort] = useState<SortKey>('closest');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return restrooms;
    return restrooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [restrooms, searchQuery]);

  const sorted = useMemo((): Restroom[] => {
    const copy = [...filtered];
    if (sort === 'rating') return copy.sort((a, b) => b.avgRating - a.avgRating);
    if (sort === 'recent')
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (lat !== null && lng !== null) {
      return copy.sort(
        (a, b) =>
          distanceMiles(lat, lng, a.lat, a.lng) - distanceMiles(lat, lng, b.lat, b.lng)
      );
    }
    return copy;
  }, [filtered, sort, lat, lng]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>RestroomRadar</Text>
        <View style={styles.toggle}>
          <TouchableOpacity style={styles.toggleOption} onPress={() => navigation.replace('Map')}>
            <Text style={styles.toggleText}>Map</Text>
          </TouchableOpacity>
          <View style={[styles.toggleOption, styles.toggleActive]}>
            <Text style={[styles.toggleText, styles.toggleTextActive]}>List</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or address…"
            placeholderTextColor={Colors.textHint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortBtn, sort === opt.key && styles.sortBtnActive]}
            onPress={() => setSort(opt.key)}
          >
            <Text style={[styles.sortBtnText, sort === opt.key && styles.sortBtnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.resultCount}>
          {sorted.length} result{sorted.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading restrooms…</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      <FlatList
        data={sorted}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <RestroomCard
            restroom={item}
            distanceMi={
              lat !== null && lng !== null
                ? distanceMiles(lat, lng, item.lat, item.lng)
                : undefined
            }
            onPress={() => navigation.push('Detail', { id: item.id })}
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚻</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? `No results for "${searchQuery}"` : 'No restrooms found nearby.'}
            </Text>
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearch}>Clear search</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appName: {
    fontSize: Theme.typography.fontSizeLG,
    fontWeight: Theme.typography.weightBold,
    color: Colors.primary,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  toggleOption: { paddingHorizontal: Theme.spacing.lg, paddingVertical: Theme.spacing.sm },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: {
    fontSize: Theme.typography.fontSizeSM,
    fontWeight: Theme.typography.weightSemibold,
    color: Colors.textSecondary,
  },
  toggleTextActive: { color: '#fff' },
  searchContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
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
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Theme.spacing.sm,
  },
  sortBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  sortBtnText: {
    fontSize: Theme.typography.fontSizeSM,
    color: Colors.textSecondary,
    fontWeight: Theme.typography.weightSemibold,
  },
  sortBtnTextActive: { color: Colors.primary },
  resultCount: {
    fontSize: Theme.typography.fontSizeXS,
    color: Colors.textHint,
    marginLeft: 'auto',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  loadingText: { fontSize: Theme.typography.fontSizeSM, color: Colors.textHint },
  errorBanner: {
    backgroundColor: '#FFF3F3',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCCCC',
  },
  errorText: { fontSize: Theme.typography.fontSizeSM, color: Colors.danger },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: Theme.spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: Theme.spacing.md },
  emptyText: {
    color: Colors.textHint,
    fontSize: Theme.typography.fontSizeMD,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  clearSearch: { color: Colors.primary, fontSize: Theme.typography.fontSizeBase },
});
