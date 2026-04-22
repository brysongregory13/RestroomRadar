import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { submitReport, ReportReason } from '../../services/reportService';
import { AuthGate } from '../../components/AuthGate';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type Props = NativeStackScreenProps<ExploreStackParamList, 'Report'>;

const REASONS: { key: ReportReason; label: string }[] = [
  { key: 'closed_or_gone', label: 'Restroom is closed / no longer exists' },
  { key: 'wrong_location', label: 'Wrong location' },
  { key: 'incorrect_hours', label: 'Incorrect hours' },
  { key: 'not_accessible', label: 'Not accessible to public' },
  { key: 'spam', label: 'Spam or inappropriate content' },
  { key: 'other', label: 'Other' },
];

export function ReportScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <AuthGate
        onSignIn={() => navigation.navigate('Map')}
        onSignUp={() => navigation.navigate('Map')}
        message="Sign in to report an issue."
      />
    );
  }

  async function handleSubmit() {
    if (!reason || !user) return;
    setLoading(true);
    try {
      await submitReport(id, user.uid, reason, notes);
      navigation.goBack();
      Alert.alert('Report Submitted', 'Thank you for helping keep the community accurate!');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Report an Issue</Text>
        {REASONS.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.option, reason === r.key && styles.optionActive]}
            onPress={() => setReason(r.key)}
          >
            <View style={[styles.radio, reason === r.key && styles.radioActive]} />
            <Text style={styles.optionLabel}>{r.label}</Text>
          </TouchableOpacity>
        ))}
        <TextInput
          style={styles.notes}
          placeholder="Additional notes (optional)"
          placeholderTextColor={Colors.textHint}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity
          style={[styles.submitBtn, !reason && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!reason || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.lg },
  title: { fontSize: Theme.typography.fontSizeXL, fontWeight: Theme.typography.weightBold, color: Colors.textPrimary, marginBottom: Theme.spacing.xl },
  option: { flexDirection: 'row', alignItems: 'center', padding: Theme.spacing.md, backgroundColor: Colors.surface, borderRadius: Theme.radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Theme.spacing.sm },
  optionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border, marginRight: Theme.spacing.md },
  radioActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  optionLabel: { fontSize: Theme.typography.fontSizeBase, color: Colors.textPrimary, flex: 1 },
  notes: { backgroundColor: Colors.surface, borderRadius: Theme.radius.md, borderWidth: 1, borderColor: Colors.border, padding: Theme.spacing.md, fontSize: Theme.typography.fontSizeBase, color: Colors.textPrimary, height: 100, marginTop: Theme.spacing.lg, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Theme.radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: Theme.spacing.xl },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold },
});
