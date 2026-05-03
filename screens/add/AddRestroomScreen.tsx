import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { addRestroom } from '../../services/restroomService';
import { StarRating } from '../../components/StarRating';
import { NumStepper } from '../../components/NumStepper';
import { ToggleGroup } from '../../components/ToggleGroup';
import { AuthGate } from '../../components/AuthGate';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import { Gender, AccessType, Amenity } from '../../types/Restroom';

type Props = NativeStackScreenProps<AddStackParamList, 'AddRestroom'>;

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

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
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: '#00897B',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }
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
  const [pinLat, setPinLat] = useState(lat ?? 37.7749);
  const [pinLng, setPinLng] = useState(lng ?? -122.4194);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState(3);
  const [gender, setGender] = useState<Gender[]>([]);
  const [stalls, setStalls] = useState(1);
  const [urinals, setUrinals] = useState(0);
  const [accessType, setAccessType] = useState<AccessType[]>([]);
  const [hoursOpen, setHoursOpen] = useState('');
  const [hoursClose, setHoursClose] = useState('');
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

  function toggleAmenity(a: Amenity) {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  function toggleGender(g: string) {
    const v = g as Gender;
    setGender((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  async function handleSubmit() {
    if (!user) return;
    if (!name || gender.length === 0 || accessType.length === 0) {
      Alert.alert('Missing Fields', 'Please fill in name, gender type, and access type.');
      return;
    }
    setLoading(true);
    try {
      await addRestroom({
        name, address, lat: pinLat, lng: pinLng, gender,
        accessType: accessType[0], stalls, urinals,
        hoursOpen, hoursClose, isOpen: false,
        amenities, photos: [], description,
        addedBy: user.uid, isClosed: false,
      });
      navigation.navigate('Confirm', { mode: 'add' });
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add restroom');
    } finally {
      setLoading(false);
    }
  }

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
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Central Park Restroom" placeholderTextColor={Colors.textHint} />
        </Field>
        <Field label="Address">
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Street address" placeholderTextColor={Colors.textHint} />
        </Field>
        <Field label="Cleanliness Rating *">
          <StarRating rating={rating} size={28} interactive onRate={setRating} />
        </Field>
        <Field label="Gender *">
          <ToggleGroup options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }, { label: 'Unisex', value: 'unisex' }]} selected={gender} multiSelect onToggle={toggleGender} />
        </Field>
        <Field label="Stalls">
          <NumStepper value={stalls} onChange={setStalls} />
        </Field>
        <Field label="Urinals">
          <NumStepper value={urinals} onChange={setUrinals} />
        </Field>
        <Field label="Access Type *">
          <ToggleGroup options={[{ label: 'Public', value: 'public' }, { label: 'Customers Only', value: 'customer' }, { label: 'Key Required', value: 'key' }, { label: 'Password', value: 'password' }]} selected={accessType as string[]} onToggle={(v) => setAccessType([v as AccessType])} />
        </Field>
        <Field label="Hours">
          <View style={styles.hoursRow}>
            <TextInput style={[styles.input, { flex: 1 }]} value={hoursOpen} onChangeText={setHoursOpen} placeholder="Opens" placeholderTextColor={Colors.textHint} />
            <Text style={styles.hoursDash}>–</Text>
            <TextInput style={[styles.input, { flex: 1 }]} value={hoursClose} onChangeText={setHoursClose} placeholder="Closes" placeholderTextColor={Colors.textHint} />
          </View>
        </Field>
        <Field label="Amenities">
          <ToggleGroup options={[{ label: '♿ Handicap', value: 'handicap' }, { label: '👶 Baby Change', value: 'baby_change' }, { label: 'Free Entry', value: 'free' }, { label: 'Gender Neutral', value: 'gender_neutral' }]} selected={amenities} multiSelect onToggle={(v) => toggleAmenity(v as Amenity)} />
        </Field>
        <Field label="Description">
          <TextInput style={[styles.input, { height: 90 }]} value={description} onChangeText={setDescription} placeholder="Any additional info…" placeholderTextColor={Colors.textHint} multiline numberOfLines={3} textAlignVertical="top" />
        </Field>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Restroom</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: Theme.spacing.lg }}>
      <Text style={{ fontSize: Theme.typography.fontSizeSM, fontWeight: Theme.typography.weightSemibold, color: Colors.textSecondary, marginBottom: Theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
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
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  hoursDash: { color: Colors.textHint, fontSize: Theme.typography.fontSizeMD },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Theme.radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: Theme.spacing.sm },
  submitBtnText: { color: '#fff', fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold },
});
