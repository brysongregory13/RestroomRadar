import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, appUser, logOut } = useAuth();

  if (!user || !appUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Sign in to view your profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = appUser.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const memberSince = appUser.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <Text style={styles.displayName}>{appUser.displayName}</Text>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>
        <View style={styles.statsRow}>
          <StatCell label="Added" value={appUser.restroomsAdded} />
          <StatCell label="Reviews" value={appUser.reviewCount} />
          <StatCell label="Edits" value={appUser.editCount} />
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={async () => { await logOut(); navigation.goBack(); }}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: Theme.spacing.md }}>
      <Text style={{ fontSize: Theme.typography.fontSizeXXL, fontWeight: Theme.typography.weightBold, color: Colors.primary }}>{value}</Text>
      <Text style={{ fontSize: Theme.typography.fontSizeSM, color: Colors.textHint, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Colors.textHint },
  header: { backgroundColor: Colors.surface, alignItems: 'center', paddingTop: Theme.spacing.xl, paddingBottom: Theme.spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { position: 'absolute', top: Theme.spacing.md, right: Theme.spacing.lg, padding: Theme.spacing.sm },
  closeBtnText: { fontSize: 18, color: Colors.textHint },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.md },
  avatarText: { fontSize: 28, color: '#fff', fontWeight: Theme.typography.weightBold },
  displayName: { fontSize: Theme.typography.fontSizeXL, fontWeight: Theme.typography.weightBold, color: Colors.textPrimary },
  memberSince: { fontSize: Theme.typography.fontSizeSM, color: Colors.textHint, marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surface, marginTop: Theme.spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  signOutBtn: { margin: Theme.spacing.xl, borderWidth: 1.5, borderColor: Colors.danger, borderRadius: Theme.radius.pill, paddingVertical: 14, alignItems: 'center' },
  signOutText: { color: Colors.danger, fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold },
});
