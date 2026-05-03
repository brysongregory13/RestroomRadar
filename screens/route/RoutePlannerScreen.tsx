import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RouteStackParamList } from '../../navigation/types';
import { useRouteRestrooms } from '../../hooks/useRouteRestrooms';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type Props = NativeStackScreenProps<RouteStackParamList, 'RoutePlanner'>;

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

function buildRouteHtml(
  polylinePoints: Array<{ lat: number; lng: number }>,
  restrooms: Array<{ id: string; lat: number; lng: number }>,
  startLocation: { lat: number; lng: number } | null,
  endLocation: { lat: number; lng: number } | null
): string {
  const polylineData = JSON.stringify(polylinePoints);
  const restroomsData = JSON.stringify(
    restrooms.map((r, i) => ({ id: r.id, lat: r.lat, lng: r.lng, index: i + 1 }))
  );
  const startData = startLocation ? JSON.stringify(startLocation) : 'null';
  const endData = endLocation ? JSON.stringify(endLocation) : 'null';

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
    var polylinePoints = ${polylineData};
    var routeRestrooms = ${restroomsData};
    var startLocation = ${startData};
    var endLocation = ${endData};

    function makePinIcon(label) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">' +
        '<circle cx="14" cy="14" r="14" fill="#00897B"/>' +
        '<text x="14" y="19" text-anchor="middle" fill="white" font-size="12" font-weight="bold">' + label + '</text>' +
        '</svg>';
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(28, 28),
        anchor: new google.maps.Point(14, 14),
      };
    }

    function makeLetterIcon(letter, color) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">' +
        '<circle cx="14" cy="14" r="14" fill="' + color + '"/>' +
        '<text x="14" y="19" text-anchor="middle" fill="white" font-size="12" font-weight="bold">' + letter + '</text>' +
        '</svg>';
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(28, 28),
        anchor: new google.maps.Point(14, 14),
      };
    }

    function initMap() {
      var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: startLocation || polylinePoints[0] || { lat: 37.7749, lng: -122.4194 },
        disableDefaultUI: true,
        gestureHandling: 'none',
      });

      if (polylinePoints.length > 0) {
        var bounds = new google.maps.LatLngBounds();
        polylinePoints.forEach(function(p) { bounds.extend(p); });
        map.fitBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 });

        new google.maps.Polyline({
          path: polylinePoints,
          strokeColor: '#00897B',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: map,
        });
      }

      if (startLocation) {
        new google.maps.Marker({
          position: startLocation,
          map: map,
          icon: makeLetterIcon('A', '#43A047'),
          zIndex: 100,
        });
      }

      if (endLocation) {
        new google.maps.Marker({
          position: endLocation,
          map: map,
          icon: makeLetterIcon('B', '#E53935'),
          zIndex: 100,
        });
      }

      routeRestrooms.forEach(function(r) {
        var m = new google.maps.Marker({
          position: { lat: r.lat, lng: r.lng },
          map: map,
          icon: makePinIcon(r.index),
          zIndex: 50,
        });
        (function(id) {
          m.addListener('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pin_tap', id: id }));
          });
        })(r.id);
      });
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&callback=initMap" async defer></script>
</body>
</html>`;
}

export function RoutePlannerScreen({ navigation }: Props) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [corridor] = useState(5);
  const [originError, setOriginError] = useState(false);
  const [destError, setDestError] = useState(false);
  const { restrooms, polylinePoints, startLocation, endLocation, loading, error, search } = useRouteRestrooms();
  const webviewRef = useRef<WebView>(null);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'pin_tap') {
        navigation.push('Detail', { id: msg.id });
      }
    } catch {}
  }, [navigation]);

  function handleSearch() {
    const oErr = !origin.trim();
    const dErr = !destination.trim();
    setOriginError(oErr);
    setDestError(dErr);
    if (oErr || dErr) return;
    search(origin, destination, corridor);
  }

  const routeHtml = polylinePoints.length > 0
    ? buildRouteHtml(polylinePoints, restrooms, startLocation, endLocation)
    : null;

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

        {routeHtml !== null && (
          <WebView
            ref={webviewRef}
            style={styles.map}
            source={{ html: routeHtml }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
          />
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
  map: { height: 280, marginHorizontal: Theme.spacing.lg, borderRadius: Theme.radius.lg, overflow: 'hidden' },
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
