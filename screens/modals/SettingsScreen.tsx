import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useFilters, Filters } from '../../context/FiltersContext';
import { useColors } from '../../context/ThemeContext';
import { ToggleGroup } from '../../components/ToggleGroup';
import { StarRating } from '../../components/StarRating';
import { Theme } from '../../constants/Theme';
import { Gender, AccessType, Amenity } from '../../types/Restroom';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const defaultDraft: Filters = {
  openNowOnly: true,
  gender: [],
  accessType: [],
  minRating: 0,
  amenities: [],
  radiusMiles: 2,
  darkMode: false,
};

function RadiusSlider({ value, onChange, C }: { value: number; onChange: (v: number) => void; C: ReturnType<typeof useColors> }) {
  const trackWidthRef = useRef(0);

  const clamp = (raw: number) => {
    const stepped = Math.round(raw / 5) * 5 || 1;
    return Math.max(1, Math.min(100, stepped));
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidthRef.current));
      onChange(clamp(1 + ratio * 99));
    },
    onPanResponderMove: (e) => {
      const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidthRef.current));
      onChange(clamp(1 + ratio * 99));
    },
  }), [onChange]);

  const pct = ((value - 1) / 99) * 100;
  const thumbPct = Math.max(0, Math.min(100, pct));

  return (
    <View
      style={{ height: 40, justifyContent: 'center', paddingHorizontal: 10 }}
      onLayout={(e) => { trackWidthRef.current = e.nativeEvent.layout.width - 20; }}
      {...panResponder.panHandlers}
    >
      <View style={{ height: 4, backgroundColor: C.border, borderRadius: 2 }}>
        <View style={{ height: 4, width: `${thumbPct}%`, backgroundColor: C.primary, borderRadius: 2 }} />
      </View>
      <View
        style={{
          position: 'absolute',
          left: `${thumbPct}%` as unknown as number,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: C.primary,
          marginLeft: -1,
          top: 9,
          ...Theme.shadow.sm,
        }}
      />
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { filters, setFilters, resetFilters } = useFilters();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  // Draft holds all filter changes; only committed on Apply
  const [draft, setDraft] = useState<Filters>({ ...filters });

  function updateDraft(updates: Partial<Filters>) {
    setDraft((prev) => ({ ...prev, ...updates }));
  }

  // Dark mode applies immediately (it's a global preference, not a map filter)
  function handleDarkModeToggle(v: boolean) {
    updateDraft({ darkMode: v });
    setFilters({ darkMode: v });
  }

  function toggleGender(g: string) {
    const v = g as Gender;
    updateDraft({
      gender: draft.gender.includes(v)
        ? draft.gender.filter((x) => x !== v)
        : [...draft.gender, v],
    });
  }
  function toggleAccess(a: string) {
    const v = a as AccessType;
    updateDraft({
      accessType: draft.accessType.includes(v)
        ? draft.accessType.filter((x) => x !== v)
        : [...draft.accessType, v],
    });
  }
  function toggleAmenity(a: string) {
    const v = a as Amenity;
    updateDraft({
      amenities: draft.amenities.includes(v)
        ? draft.amenities.filter((x) => x !== v)
        : [...draft.amenities, v],
    });
  }

  function handleApply() {
    setFilters(draft);
    navigation.goBack();
  }

  function handleReset() {
    const reset = { ...defaultDraft, darkMode: filters.darkMode };
    setDraft(reset);
    resetFilters();
    setFilters({ darkMode: filters.darkMode });
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
          <Switch
            value={draft.openNowOnly}
            onValueChange={(v) => updateDraft({ openNowOnly: v })}
            trackColor={{ true: C.primary }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.fieldLabel}>Gender</Text>
        <ToggleGroup
          options={[{ label: 'All', value: '__all' }, { label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }, { label: 'Unisex', value: 'unisex' }]}
          selected={draft.gender.length === 0 ? ['__all'] : draft.gender}
          multiSelect
          onToggle={(v) => { if (v === '__all') updateDraft({ gender: [] }); else toggleGender(v); }}
        />

        <Text style={[styles.fieldLabel, { marginTop: Theme.spacing.md }]}>Access Type</Text>
        <ToggleGroup
          options={[{ label: 'All', value: '__all' }, { label: 'Public', value: 'public' }, { label: 'Customers', value: 'customer' }, { label: 'Key/Code', value: 'key' }]}
          selected={draft.accessType.length === 0 ? ['__all'] : draft.accessType}
          multiSelect
          onToggle={(v) => { if (v === '__all') updateDraft({ accessType: [] }); else toggleAccess(v); }}
        />

        <Text style={[styles.fieldLabel, { marginTop: Theme.spacing.md }]}>Min Star Rating</Text>
        <StarRating
          rating={draft.minRating}
          size={28}
          interactive
          onRate={(r) => updateDraft({ minRating: r === draft.minRating ? 0 : r })}
        />

        <Text style={[styles.fieldLabel, { marginTop: Theme.spacing.md }]}>Required Amenities</Text>
        <ToggleGroup
          options={[{ label: '♿ Handicap', value: 'handicap' }, { label: '👶 Baby Change', value: 'baby_change' }, { label: 'Free Entry', value: 'free' }, { label: 'Gender Neutral', value: 'gender_neutral' }]}
          selected={draft.amenities}
          multiSelect
          onToggle={toggleAmenity}
        />

        <Text style={[styles.sectionTitle, { marginTop: Theme.spacing.xl }]}>Search Radius</Text>
        <View style={styles.radiusHeader}>
          <Text style={styles.rowLabel}>Radius</Text>
          <Text style={styles.radiusValue}>{draft.radiusMiles} mi</Text>
        </View>
        <RadiusSlider
          value={draft.radiusMiles}
          onChange={(v) => updateDraft({ radiusMiles: v })}
          C={C}
        />
        <View style={styles.radiusLabels}>
          <Text style={styles.radiusLabelText}>1 mi</Text>
          <Text style={styles.radiusLabelText}>100 mi</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Theme.spacing.xl }]}>Appearance</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch
            value={draft.darkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ true: C.primary }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyBtnText}>Apply Filters</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>Reset all filters</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Theme.spacing.lg,
      backgroundColor: C.surface,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    title: { fontSize: Theme.typography.fontSizeLG, fontWeight: Theme.typography.weightBold, color: C.textPrimary },
    closeText: { fontSize: 18, color: C.textHint, padding: Theme.spacing.sm },
    content: { padding: Theme.spacing.lg, paddingBottom: 32 },
    sectionTitle: { fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold, color: C.textPrimary, marginBottom: Theme.spacing.md },
    fieldLabel: { fontSize: Theme.typography.fontSizeSM, fontWeight: Theme.typography.weightSemibold, color: C.textSecondary, marginBottom: Theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Theme.spacing.sm },
    rowLabel: { fontSize: Theme.typography.fontSizeBase, color: C.textPrimary },
    radiusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    radiusValue: { fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold, color: C.primary },
    radiusLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    radiusLabelText: { fontSize: Theme.typography.fontSizeXS, color: C.textHint },
    applyBtn: {
      backgroundColor: C.primary,
      borderRadius: Theme.radius.pill,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: Theme.spacing.xl,
    },
    applyBtnText: { color: '#fff', fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold },
    resetBtn: { alignItems: 'center', paddingVertical: Theme.spacing.md, marginTop: Theme.spacing.sm },
    resetText: { color: C.primary, fontSize: Theme.typography.fontSizeBase },
  });
}
