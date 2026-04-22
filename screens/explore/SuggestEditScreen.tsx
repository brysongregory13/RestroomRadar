import React, { useEffect, useState } from 'react';
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
import { ExploreStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { getRestroomById } from '../../services/restroomService';
import { submitSuggestedEdit } from '../../services/reportService';
import { ToggleGroup } from '../../components/ToggleGroup';
import { AuthGate } from '../../components/AuthGate';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type Props = NativeStackScreenProps<ExploreStackParamList, 'SuggestEdit'>;

export function SuggestEditScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [hoursOpen, setHoursOpen] = useState('');
  const [hoursClose, setHoursClose] = useState('');
  const [accessType, setAccessType] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRestroomById(id).then((r) => {
      if (r) {
        setName(r.name);
        setHoursOpen(r.hoursOpen);
        setHoursClose(r.hoursClose);
        setAccessType([r.accessType]);
      }
    });
  }, [id]);

  if (!user) {
    return (
      <AuthGate
        onSignIn={() => navigation.navigate('Map')}
        onSignUp={() => navigation.navigate('Map')}
        message="Sign in to suggest an edit."
      />
    );
  }

  async function handleSubmit() {
    if (!user) return;
    setLoading(true);
    try {
      await submitSuggestedEdit(id, user.uid, { name, hoursOpen, hoursClose, accessType: accessType[0] }, notes);
      navigation.goBack();
      Alert.alert('Edit Submitted', 'Thank you! Our team will review your suggestion.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit suggestion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Suggest an Edit</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={Colors.textHint} />
        <Text style={styles.label}>Hours Open</Text>
        <TextInput style={styles.input} value={hoursOpen} onChangeText={setHoursOpen} placeholder="e.g. 6:00 AM" placeholderTextColor={Colors.textHint} />
        <Text style={styles.label}>Hours Close</Text>
        <TextInput style={styles.input} value={hoursClose} onChangeText={setHoursClose} placeholder="e.g. 10:00 PM" placeholderTextColor={Colors.textHint} />
        <Text style={styles.label}>Access Type</Text>
        <ToggleGroup
          options={[
            { label: 'Public', value: 'public' },
            { label: 'Customers Only', value: 'customer' },
            { label: 'Key Required', value: 'key' },
            { label: 'Password', value: 'password' },
          ]}
          selected={accessType}
          onToggle={(v) => setAccessType([v])}
        />
        <Text style={[styles.label, { marginTop: Theme.spacing.lg }]}>Notes for Reviewer</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholder="Describe what's changed…"
          placeholderTextColor={Colors.textHint}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Suggestion</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.lg },
  title: { fontSize: Theme.typography.fontSizeXL, fontWeight: Theme.typography.weightBold, color: Colors.textPrimary, marginBottom: Theme.spacing.xl },
  label: { fontSize: Theme.typography.fontSizeSM, fontWeight: Theme.typography.weightSemibold, color: Colors.textSecondary, marginBottom: Theme.spacing.xs, marginTop: Theme.spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: Colors.surface, borderRadius: Theme.radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Theme.spacing.md, paddingVertical: 11, fontSize: Theme.typography.fontSizeBase, color: Colors.textPrimary },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Theme.radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: Theme.spacing.xl },
  submitBtnText: { color: '#fff', fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold },
});
