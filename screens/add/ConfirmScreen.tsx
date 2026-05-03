import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AddStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type Props = NativeStackScreenProps<AddStackParamList, 'Confirm'>;

export function ConfirmScreen({ navigation, route }: Props) {
  const { restroomLat, restroomLng } = route.params;

  function handleViewOnMap() {
    if (restroomLat !== undefined && restroomLng !== undefined) {
      // Navigate to Explore tab > Map screen, passing re-center params
      (navigation.getParent() as any)?.navigate('Explore', {
        screen: 'Map',
        params: { centerLat: restroomLat, centerLng: restroomLng },
      });
    } else {
      (navigation.getParent() as any)?.navigate('Explore');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
        <Text style={styles.heading}>Restroom added!</Text>
        <Text style={styles.message}>
          Thank you for contributing to the community. Your submission helps others find clean
          restrooms nearby.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleViewOnMap}>
          <Text style={styles.primaryBtnText}>View on Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('AddRestroom')}>
          <Text style={styles.secondaryBtnText}>Add Another</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Theme.spacing.xxl },
  checkCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.xl },
  checkIcon: { fontSize: 48, color: '#fff' },
  heading: { fontSize: Theme.typography.fontSizeXXL, fontWeight: Theme.typography.weightBold, color: Colors.textPrimary, marginBottom: Theme.spacing.md },
  message: { fontSize: Theme.typography.fontSizeBase, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Theme.spacing.xxl },
  primaryBtn: { width: '100%', backgroundColor: Colors.primary, borderRadius: Theme.radius.pill, paddingVertical: 15, alignItems: 'center', marginBottom: Theme.spacing.md },
  primaryBtnText: { color: '#fff', fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold },
  secondaryBtn: { width: '100%', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Theme.radius.pill, paddingVertical: 15, alignItems: 'center' },
  secondaryBtnText: { color: Colors.primary, fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold },
});
