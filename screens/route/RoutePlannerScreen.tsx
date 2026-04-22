import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RouteStackParamList } from '../../navigation/types';
import { useRouteRestrooms } from '../../hooks/useRouteRestrooms';
import { RestroomPin } from '../../components/RestroomPin';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type Props = NativeStackScreenProps<RouteStackParamList, 'RoutePlanner'>;

export function RoutePlannerScreen({ navigation }: Props) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [corridor] = useState(5);
  const [originError, setOriginError] = useState(false);
  const [destError, setDestError] = useState(false);
  const { restrooms, polylinePoints, startLocation, endLocation, loading, error, search } = useRouteRestrooms();

  function handleSearch() {
    const oErr = !origin.trim();
    const dErr = !destination.trim();
    setOriginError(oErr);
    setDestError(dErr);
    if (oErr || dErr) return;
    search(origin, destination, corridor);
  }

  const polylineCoords = polylinePoints.map((p) => ({ latitude: p.lat, longitude: p.lng }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>FROM</Text>
          <TextInput style={[styles.input, originError && styles.inputError]} value={origin} onChangeText={(t) => { setOrigin(t); setOriginError(false); }} placeholder="Start location" placeholderTextColor={Colors.textHint} />
          <View style={styles.connector} />
          <Text style={styles.inputLabel}>TO</Text>
          <TextInput style={[styles.input, destError && styles.inputError]} value={destination} onChangeText={(t) => { setDestination(t); setDestError(false); }} placeholder="Destination" placeholderTextColor={Colors.textHint} />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>Find Restrooms Along Route</Text>}
          </TouchableOpacity>
        </View>

        {polylineCoords.length > 0 && (
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? 'google' : undefined}
            initialRegion={startLocation ? { latitude: startLocation.lat, longitude: startLocation.lng, latitudeDelta: 0.5, longitudeDelta: 0.5 } : undefined}
          >
            <Polyline coordinates={polylineCoords} strokeColor={Colors.primary} strokeWidth={3} />
            {startLocation && <Marker coordinate={{ latitude: startLocation.lat, longitude: startLocation.lng }} pinColor="green" />}
            {endLocation && <Marker coordinate={{ latitude: endLocation.lat, longitude: endLocation.lng }} pinColor={Colors.danger} />}
            {restrooms.map((r, i) => (
              <RestroomPin key={r.id} restroom={r} label={String(i + 1)} onPress={() => navigation.push('Detail', { id: r.id })} />
            ))}
          </MapView>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {restrooms.length > 0 && (
          <View style={styles.resultsList}>
            {restrooms.map((r, i) => {
              const open = r.isOpen && !r.isClosed;
              return (
                <TouchableOpacity key={r.id} style={styles.resultItem} onPress={() => navigation.push('Detail', { id: r.id })}>
                  <View style={styles.resultNumber}><Text style={styles.resultNumberText}>{i + 1}</Text></View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{r.name}</Text>
                    <Text style={[styles.resultStatus, { color: open ? Colors.success : Colors.danger }]}>{open ? 'Open' : 'Closed'}</Text>
                    <Text style={styles.resultAccess}>{r.accessType}</Text>
                  </View>
                  <Text style={styles.resultRating}>★ {r.avgRating.toFixed(1)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inputCard: { margin: Theme.spacing.lg, backgroundColor: Colors.surface, borderRadius: Theme.radius.lg, padding: Theme.spacing.lg, ...Theme.shadow.sm },
  inputLabel: { fontSize: Theme.typography.fontSizeXS, fontWeight: Theme.typography.weightBold, color: Colors.textHint, letterSpacing: 1, marginBottom: 4 },
  input: { backgroundColor: Colors.background, borderRadius: Theme.radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Theme.spacing.md, paddingVertical: 11, fontSize: Theme.typography.fontSizeBase, color: Colors.textPrimary, marginBottom: Theme.spacing.sm },
  inputError: { borderColor: Colors.danger },
  connector: { width: 2, height: 12, backgroundColor: Colors.border, marginLeft: 20, marginVertical: 2 },
  searchBtn: { backgroundColor: Colors.primary, borderRadius: Theme.radius.pill, paddingVertical: 14, alignItems: 'center', marginTop: Theme.spacing.sm },
  searchBtnText: { color: '#fff', fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold },
  map: { height: 280, marginHorizontal: Theme.spacing.lg, borderRadius: Theme.radius.lg },
  errorText: { color: Colors.danger, textAlign: 'center', margin: Theme.spacing.lg },
  resultsList: { margin: Theme.spacing.lg },
  resultItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm, ...Theme.shadow.sm },
  resultNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.md },
  resultNumberText: { color: '#fff', fontWeight: Theme.typography.weightBold },
  resultInfo: { flex: 1 },
  resultName: { fontSize: Theme.typography.fontSizeBase, fontWeight: Theme.typography.weightSemibold, color: Colors.textPrimary },
  resultStatus: { fontSize: Theme.typography.fontSizeSM, fontWeight: Theme.typography.weightSemibold },
  resultAccess: { fontSize: Theme.typography.fontSizeXS, color: Colors.textHint },
  resultRating: { fontSize: Theme.typography.fontSizeBase, color: Colors.accent, fontWeight: Theme.typography.weightBold },
});
