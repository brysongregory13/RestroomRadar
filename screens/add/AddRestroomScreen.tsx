import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { AddStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useFilters } from '../../context/FiltersContext';
import { addRestroom } from '../../services/restroomService';
import { StarRating } from '../../components/StarRating';
import { NumStepper } from '../../components/NumStepper';
import { ToggleGroup } from '../../components/ToggleGroup';
import { AuthGate } from '../../components/AuthGate';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import { Gender, AccessType, Amenity } from '../../types/Restroom';

type Props = NativeStackScreenProps<AddStackParamList, 'AddRestroom'>;

const MAPS_KEY = 'AIzaSyBe1gYpo04xF3oUM_wiWOolwy63Vf9LoaQ';

type TimeValue = { h: number; m: number; period: 'AM' | 'PM' };
type GenderDetails = { stalls: number; urinals: number };

function formatTime(t: TimeValue): string {
  return `${t.h}:${String(t.m).padStart(2, '0')} ${t.period}`;
}

function TimePicker({
  value,
  onChange,
  placeholder,
}: {
  value: TimeValue | null;
  onChange: (v: TimeValue) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = value ?? { h: 8, m: 0, period: 'AM' as const };

  if (!open) {
    return (
      <TouchableOpacity style={styles.timeBtn} onPress={() => setOpen(true)}>
        <Text style={value ? styles.timeValue : styles.timePlaceholder}>
          {value ? formatTime(value) : (placeholder ?? 'Set time')}
        </Text>
        <Text style={styles.timeEdit}>▾</Text>
      </TouchableOpacity>
    );
  }

  function cycleHour(dir: 1 | -1) {
    const next = current.h + dir;
    onChange({ ...current, h: next < 1 ? 12 : next > 12 ? 1 : next });
  }
  function cycleMinute(dir: 1 | -1) {
    const options = [0, 15, 30, 45];
    const idx = options.indexOf(current.m);
    const nextIdx = (idx + dir + options.length) % options.length;
    onChange({ ...current, m: options[nextIdx] });
  }

  return (
    <View style={styles.timePickerCard}>
      <View style={styles.timePickerRow}>
        <View style={styles.timePickerColumn}>
          <TouchableOpacity onPress={() => cycleHour(1)} style={styles.timeArrow}>
            <Text style={styles.timeArrowText}>▲</Text>
          </TouchableOpacity>
          <Text style={styles.timeNumber}>{String(current.h).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => cycleHour(-1)} style={styles.timeArrow}>
            <Text style={styles.timeArrowText}>▼</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.timeColon}>:</Text>
        <View style={styles.timePickerColumn}>
          <TouchableOpacity onPress={() => cycleMinute(1)} style={styles.timeArrow}>
            <Text style={styles.timeArrowText}>▲</Text>
          </TouchableOpacity>
          <Text style={styles.timeNumber}>{String(current.m).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => cycleMinute(-1)} style={styles.timeArrow}>
            <Text style={styles.timeArrowText}>▼</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.amPmToggle}>
          {(['AM', 'PM'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.amPmBtn, current.period === p && styles.amPmBtnActive]}
              onPress={() => onChange({ ...current, period: p })}
            >
              <Text style={[styles.amPmText, current.period === p && styles.amPmTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.timeDoneBtn} onPress={() => setOpen(false)}>
        <Text style={styles.timeDoneText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

function buildPickerHtml(lat: number, lng: number): string {
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
    var map, marker;
    function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: ${lat}, lng: ${lng} },
        zoom: 16,
        disableDefaultUI: true,
        gestureHandling: 'cooperative',
      });
      marker = new google.maps.Marker({
        position: { lat: ${lat}, lng: ${lng} },
        map: map,
        draggable: true,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 11, fillColor: '#00897B', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }
      });
      marker.addListener('dragend', function() {
        var pos = marker.getPosition();
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location_update', lat: pos.lat(), lng: pos.lng() }));
      });
      map.addListener('click', function(e) {
        marker.setPosition(e.latLng);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location_update', lat: e.latLng.lat(), lng: e.latLng.lng() }));
      });
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_ready' }));
    }
    function moveMarker(lat, lng) {
      var pos = { lat: lat, lng: lng };
      marker.setPosition(pos);
      map.panTo(pos);
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&callback=initMap" async defer></script>
</body>
</html>`;
}

export function AddRestroomScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { lat, lng } = useLocation();
  const { triggerRefresh } = useFilters();
  const [pinLat, setPinLat] = useState(lat ?? 37.7749);
  const [pinLng, setPinLng] = useState(lng ?? -122.4194);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState(3);
  const [gender, setGender] = useState<Gender[]>([]);
  const [genderDetails, setGenderDetails] = useState<Partial<Record<Gender, GenderDetails>>>({});
  const [accessType, setAccessType] = useState<AccessType[]>([]);
  const [openTime, setOpenTime] = useState<TimeValue | null>(null);
  const [closeTime, setCloseTime] = useState<TimeValue | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const webviewRef = useRef<WebView>(null);
  const pickerHtmlRef = useRef(buildPickerHtml(lat ?? 37.7749, lng ?? -122.4194));
  const locationInitialized = useRef(false);

  useEffect(() => {
    if (lat !== null && lng !== null && mapReady && !locationInitialized.current) {
      locationInitialized.current = true;
      setPinLat(lat);
      setPinLng(lng);
      webviewRef.current?.injectJavaScript(`moveMarker(${lat}, ${lng}); true;`);
    }
  }, [lat, lng, mapReady]);

  const handlePickerMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'location_update') {
        setPinLat(msg.lat);
        setPinLng(msg.lng);
      } else if (msg.type === 'map_ready') {
        setMapReady(true);
      }
    } catch {}
  }, []);

  if (!user) {
    return <AuthGate onSignIn={() => {}} onSignUp={() => {}} message="Sign in to add a restroom." />;
  }

  function toggleGender(g: Gender) {
    if (gender.includes(g)) {
      setGender((prev) => prev.filter((x) => x !== g));
      setGenderDetails((prev) => {
        const next = { ...prev };
        delete next[g];
        return next;
      });
    } else {
      setGender((prev) => [...prev, g]);
      setGenderDetails((prev) => ({
        ...prev,
        [g]: { stalls: 1, urinals: g === 'female' ? 0 : 1 },
      }));
    }
  }

  function updateGenderDetail(g: Gender, field: keyof GenderDetails, value: number) {
    setGenderDetails((prev) => ({
      ...prev,
      [g]: { ...prev[g]!, [field]: value },
    }));
  }

  function toggleAmenity(a: Amenity) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function handleSubmit() {
    if (!user) return;
    if (!name || gender.length === 0 || accessType.length === 0) {
      Alert.alert('Missing Fields', 'Please fill in name, gender type, and access type.');
      return;
    }
    setLoading(true);
    try {
      const totalStalls = Object.values(genderDetails).reduce((s, d) => s + (d?.stalls ?? 0), 0);
      const totalUrinals = Object.values(genderDetails).reduce((s, d) => s + (d?.urinals ?? 0), 0);
      await addRestroom({
        name,
        address,
        lat: pinLat,
        lng: pinLng,
        gender,
        accessType: accessType[0],
        stalls: totalStalls,
        urinals: totalUrinals,
        hoursOpen: openTime ? formatTime(openTime) : '',
        hoursClose: closeTime ? formatTime(closeTime) : '',
        isOpen: false,
        amenities,
        photos: [],
        description,
        addedBy: user.uid,
        isClosed: false,
      });
      triggerRefresh();
      navigation.navigate('Confirm', { mode: 'add', restroomLat: pinLat, restroomLng: pinLng });
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add restroom');
    } finally {
      setLoading(false);
    }
  }

  const GENDERS: { key: Gender; label: string }[] = [
    { key: 'male', label: 'Male' },
    { key: 'female', label: 'Female' },
    { key: 'unisex', label: 'Unisex' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add a Restroom</Text>

        <View style={styles.mapContainer}>
          <WebView
            ref={webviewRef}
            style={styles.map}
            source={{ html: pickerHtmlRef.current }}
            onMessage={handlePickerMessage}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
          />
          <Text style={styles.mapHint}>Tap map or drag pin to set location</Text>
        </View>

        <Field label="Name *">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Central Park Restroom"
            placeholderTextColor={Colors.textHint}
          />
        </Field>
        <Field label="Address">
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Street address"
            placeholderTextColor={Colors.textHint}
          />
        </Field>
        <Field label="Cleanliness Rating *">
          <StarRating rating={rating} size={28} interactive onRate={setRating} />
        </Field>

        <Field label="Gender *">
          <View style={styles.genderList}>
            {GENDERS.map(({ key, label }) => {
              const selected = gender.includes(key);
              return (
                <View key={key} style={styles.genderSection}>
                  <TouchableOpacity
                    style={[styles.genderBtn, selected && styles.genderBtnActive]}
                    onPress={() => toggleGender(key)}
                  >
                    <Text style={[styles.genderBtnText, selected && styles.genderBtnTextActive]}>
                      {label}
                    </Text>
                    {selected && <Text style={styles.genderChevron}>▾</Text>}
                  </TouchableOpacity>
                  {selected && (
                    <View style={styles.genderExpanded}>
                      <View style={styles.genderRow}>
                        <Text style={styles.genderFieldLabel}>Stalls</Text>
                        <NumStepper
                          value={genderDetails[key]?.stalls ?? 0}
                          onChange={(v) => updateGenderDetail(key, 'stalls', v)}
                        />
                      </View>
                      {(key === 'male' || key === 'unisex') && (
                        <View style={styles.genderRow}>
                          <Text style={styles.genderFieldLabel}>Urinals</Text>
                          <NumStepper
                            value={genderDetails[key]?.urinals ?? 0}
                            onChange={(v) => updateGenderDetail(key, 'urinals', v)}
                          />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </Field>

        <Field label="Access Type *">
          <ToggleGroup
            options={[
              { label: 'Public', value: 'public' },
              { label: 'Customers Only', value: 'customer' },
              { label: 'Key Required', value: 'key' },
              { label: 'Password', value: 'password' },
            ]}
            selected={accessType as string[]}
            onToggle={(v) => setAccessType([v as AccessType])}
          />
        </Field>

        <Field label="Hours">
          <View style={styles.hoursRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hoursLabel}>Opens</Text>
              <TimePicker value={openTime} onChange={setOpenTime} placeholder="Opens" />
            </View>
            <Text style={styles.hoursDash}>–</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.hoursLabel}>Closes</Text>
              <TimePicker value={closeTime} onChange={setCloseTime} placeholder="Closes" />
            </View>
          </View>
        </Field>

        <Field label="Amenities">
          <ToggleGroup
            options={[
              { label: '♿ Handicap', value: 'handicap' },
              { label: '👶 Baby Change', value: 'baby_change' },
              { label: 'Free Entry', value: 'free' },
              { label: 'Gender Neutral', value: 'gender_neutral' },
            ]}
            selected={amenities}
            multiSelect
            onToggle={(v) => toggleAmenity(v as Amenity)}
          />
        </Field>
        <Field label="Description">
          <TextInput
            style={[styles.input, { height: 90 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Any additional info…"
            placeholderTextColor={Colors.textHint}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Field>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Restroom</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: Theme.spacing.lg }}>
      <Text style={{ fontSize: Theme.typography.fontSizeSM, fontWeight: Theme.typography.weightSemibold, color: Colors.textSecondary, marginBottom: Theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.lg, paddingBottom: 40 },
  title: { fontSize: Theme.typography.fontSizeXL, fontWeight: Theme.typography.weightBold, color: Colors.textPrimary, marginBottom: Theme.spacing.xl },
  mapContainer: { marginBottom: Theme.spacing.lg },
  map: { height: 180, borderRadius: Theme.radius.lg, overflow: 'hidden' },
  mapHint: { fontSize: Theme.typography.fontSizeXS, color: Colors.textHint, textAlign: 'center', marginTop: 4 },
  input: { backgroundColor: Colors.surface, borderRadius: Theme.radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Theme.spacing.md, paddingVertical: 11, fontSize: Theme.typography.fontSizeBase, color: Colors.textPrimary },

  // Gender sections
  genderList: { gap: Theme.spacing.sm },
  genderSection: {},
  genderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  genderBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderBtnText: { fontSize: Theme.typography.fontSizeBase, fontWeight: Theme.typography.weightSemibold, color: Colors.textSecondary },
  genderBtnTextActive: { color: '#fff' },
  genderChevron: { color: '#fff', fontSize: 13 },
  genderExpanded: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    marginTop: 4,
    gap: Theme.spacing.sm,
  },
  genderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  genderFieldLabel: { fontSize: Theme.typography.fontSizeBase, color: Colors.textPrimary, fontWeight: Theme.typography.weightSemibold },

  // Time picker
  hoursRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Theme.spacing.sm },
  hoursLabel: { fontSize: Theme.typography.fontSizeXS, color: Colors.textHint, marginBottom: 4 },
  hoursDash: { color: Colors.textHint, fontSize: Theme.typography.fontSizeMD, marginTop: 22 },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 11,
  },
  timeValue: { fontSize: Theme.typography.fontSizeBase, color: Colors.textPrimary, fontWeight: Theme.typography.weightSemibold },
  timePlaceholder: { fontSize: Theme.typography.fontSizeBase, color: Colors.textHint },
  timeEdit: { fontSize: 14, color: Colors.textHint },
  timePickerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Theme.spacing.md,
  },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Theme.spacing.sm },
  timePickerColumn: { alignItems: 'center', width: 48 },
  timeArrow: { padding: 6 },
  timeArrowText: { fontSize: 16, color: Colors.primary, fontWeight: Theme.typography.weightBold },
  timeNumber: { fontSize: Theme.typography.fontSizeXL, fontWeight: Theme.typography.weightBold, color: Colors.textPrimary, minWidth: 40, textAlign: 'center' },
  timeColon: { fontSize: Theme.typography.fontSizeXL, fontWeight: Theme.typography.weightBold, color: Colors.textPrimary, marginBottom: 4 },
  amPmToggle: { flexDirection: 'column', gap: 4, marginLeft: Theme.spacing.sm },
  amPmBtn: { paddingHorizontal: Theme.spacing.md, paddingVertical: 6, borderRadius: Theme.radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  amPmBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  amPmText: { fontSize: Theme.typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Theme.typography.weightSemibold },
  amPmTextActive: { color: '#fff' },
  timeDoneBtn: { alignItems: 'center', marginTop: Theme.spacing.sm, paddingVertical: 8 },
  timeDoneText: { color: Colors.primary, fontWeight: Theme.typography.weightBold, fontSize: Theme.typography.fontSizeBase },

  submitBtn: { backgroundColor: Colors.primary, borderRadius: Theme.radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: Theme.spacing.sm },
  submitBtnText: { color: '#fff', fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold },
});
