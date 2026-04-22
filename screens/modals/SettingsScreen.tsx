import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useFilters } from '../../context/FiltersContext';
import { ToggleGroup } from '../../components/ToggleGroup';
import { StarRating } from '../../components/StarRating';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import { Gender, AccessType, Amenity } from '../../types/Restroom';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { filters, setFilters, resetFilters } = useFilters();

  function toggleGender(g: string) {
    const v = g as Gender;
    setFilters({ gender: filters.gender.includes(v) ? filters.gender.filter((x) => x !== v) : [...filters.gender, v] });
  }
  function toggleAccess(a: string) {
    const v = a as AccessType;
    setFilters({ accessType: filters.accessType.includes(v) ? filters.accessType.filter((x) => x !== v) : [...filters.accessType, v] });
  }
  function toggleAmenity(a: string) {
    const v = a as Amenity;
    setFilters({ amenities: filters.amenities.includes(v) ? filters.amenities.filter((x) => x !== v) : [...filters.amenities, v] });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Settings & Filters</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Map Filters</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Open now only</Text>
          <Switch value={filters.openNowOnly} onValueChange={(v) => setFilters({ openNowOnly: v })} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
        </View>
        <Text style={styles.fieldLabel}>Gender</Text>
        <ToggleGroup
          options={[{ label: 'All', value: '__all' }, { label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }, { label: 'Unisex', value: 'unisex' }]}
          selected={filters.gender.length === 0 ? ['__all'] : filters.gender}
          multiSelect
          onToggle={(v) => { if (v === '__all') setFilters({ gender: [] }); else toggleGender(v); }}
        />
        <Text style={[styles.fieldLabel, { marginTop: Theme.spacing.md }]}>Access Type</Text>
        <ToggleGroup
          options={[{ label: 'All', value: '__all' }, { label: 'Public', value: 'public' }, { label: 'Customers', value: 'customer' }, { label: 'Key/Code', value: 'key' }]}
          selected={filters.accessType.length === 0 ? ['__all'] : filters.accessType}
          multiSelect
          onToggle={(v) => { if (v === '__all') setFilters({ accessType: [] }); else toggleAccess(v); }}
        />
        <Text style={[styles.fieldLabel, { marginTop: Theme.spacing.md }]}>Min Star Rating</Text>
        <StarRating rating={filters.minRating} size={28} interactive onRate={(r) => setFilters({ minRating: r === filters.minRating ? 0 : r })} />
        <Text style={[styles.fieldLabel, { marginTop: Theme.spacing.md }]}>Required Amenities</Text>
        <ToggleGroup
          options={[{ label: '♿ Handicap', value: 'handicap' }, { label: '👶 Baby Change', value: 'baby_change' }, { label: 'Free Entry', value: 'free' }, { label: 'Gender Neutral', value: 'gender_neutral' }]}
          selected={filters.amenities}
          multiSelect
          onToggle={toggleAmenity}
        />

        <Text style={[styles.sectionTitle, { marginTop: Theme.spacing.xl }]}>Preferences</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Distance Units</Text>
          <View style={styles.unitToggle}>
            {(['mi', 'km'] as const).map((u) => (
              <TouchableOpacity key={u} style={[styles.unitBtn, filters.distanceUnit === u && styles.unitBtnActive]} onPress={() => setFilters({ distanceUnit: u })}>
                <Text style={[styles.unitBtnText, filters.distanceUnit === u && { color: '#fff' }]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch value={filters.darkMode} onValueChange={(v) => setFilters({ darkMode: v })} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
          <Text style={styles.resetText}>Reset all filters</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: Theme.typography.fontSizeLG, fontWeight: Theme.typography.weightBold, color: Colors.textPrimary },
  closeText: { fontSize: 18, color: Colors.textHint, padding: Theme.spacing.sm },
  content: { padding: Theme.spacing.lg },
  sectionTitle: { fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold, color: Colors.textPrimary, marginBottom: Theme.spacing.md },
  fieldLabel: { fontSize: Theme.typography.fontSizeSM, fontWeight: Theme.typography.weightSemibold, color: Colors.textSecondary, marginBottom: Theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Theme.spacing.sm },
  rowLabel: { fontSize: Theme.typography.fontSizeBase, color: Colors.textPrimary },
  unitToggle: { flexDirection: 'row', borderRadius: Theme.radius.pill, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  unitBtn: { paddingHorizontal: Theme.spacing.md, paddingVertical: 6, backgroundColor: Colors.surface },
  unitBtnActive: { backgroundColor: Colors.primary },
  unitBtnText: { fontSize: Theme.typography.fontSizeBase, color: Colors.textSecondary },
  resetBtn: { alignItems: 'center', paddingVertical: Theme.spacing.md, marginTop: Theme.spacing.md },
  resetText: { color: Colors.primary, fontSize: Theme.typography.fontSizeBase },
});
