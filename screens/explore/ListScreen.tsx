import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
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
  const { filters } = useFilters();
  const { restrooms } = useNearbyRestrooms(lat, lng, filters);
  const [sort, setSort] = useState<SortKey>('closest');

  function sorted(): Restroom[] {
    const copy = [...restrooms];
    if (sort === 'rating') return copy.sort((a, b) => b.avgRating - a.avgRating);
    if (sort === 'recent') return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (lat !== null && lng !== null) {
      return copy.sort(
        (a, b) => distanceMiles(lat, lng, a.lat, a.lng) - distanceMiles(lat, lng, b.lat, b.lng)
      );
    }
    return copy;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
      </View>

      <FlatList
        data={sorted()}
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No restrooms found nearby.</Text>
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
  sortBar: {
    flexDirection: 'row',
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
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textHint, fontSize: Theme.typography.fontSizeMD },
});
