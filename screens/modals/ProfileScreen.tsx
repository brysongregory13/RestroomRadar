import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { useColors } from '../../context/ThemeContext';
import { getRestroomsByUser } from '../../services/restroomService';
import { Restroom } from '../../types/Restroom';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, appUser, logOut } = useAuth();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [submissions, setSubmissions] = useState<Restroom[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    console.log('[ProfileScreen] fetching submissions for uid:', user.uid);
    setSubmissionsLoading(true);
    getRestroomsByUser(user.uid)
      .then((results) => {
        console.log('[ProfileScreen] submissions received:', results.length);
        setSubmissions(results);
      })
      .catch((e) => {
        console.log('[ProfileScreen] submissions error:', e?.message ?? e);
      })
      .finally(() => setSubmissionsLoading(false));
  }, [user?.uid]);

  if (!user || !appUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Sign in to view your profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = appUser.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const memberSince = appUser.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{appUser.displayName}</Text>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCell label="Added" value={appUser.restroomsAdded} C={C} />
          <StatCell label="Reviews" value={appUser.reviewCount} C={C} />
          <StatCell label="Edits" value={appUser.editCount} C={C} />
        </View>

        {/* My Submissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Submissions</Text>
          {submissionsLoading ? (
            <ActivityIndicator color={C.primary} style={styles.loader} />
          ) : submissions.length === 0 ? (
            <Text style={styles.noSubmissions}>No submissions yet.</Text>
          ) : (
            submissions.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.submissionItem}
                onPress={() =>
                  (navigation as any).navigate('Main', {
                    screen: 'Explore',
                    params: { screen: 'Detail', params: { id: r.id } },
                  })
                }
              >
                <View style={styles.submissionInfo}>
                  <Text style={styles.submissionName} numberOfLines={1}>{r.name}</Text>
                  {r.address ? (
                    <Text style={styles.submissionAddress} numberOfLines={1}>{r.address}</Text>
                  ) : null}
                </View>
                <View style={styles.submissionMeta}>
                  <Text style={styles.submissionDate}>
                    {r.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={styles.submissionRating}>★ {r.avgRating.toFixed(1)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={async () => {
            await logOut();
            navigation.goBack();
          }}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ label, value, C }: { label: string; value: number; C: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: Theme.spacing.md }}>
      <Text style={{ fontSize: Theme.typography.fontSizeXXL, fontWeight: Theme.typography.weightBold, color: C.primary }}>
        {value}
      </Text>
      <Text style={{ fontSize: Theme.typography.fontSizeSM, color: C.textHint, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: C.textHint },
    header: {
      backgroundColor: C.surface,
      alignItems: 'center',
      paddingTop: Theme.spacing.xl,
      paddingBottom: Theme.spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    closeBtn: { position: 'absolute', top: Theme.spacing.md, right: Theme.spacing.lg, padding: Theme.spacing.sm },
    closeBtnText: { fontSize: 18, color: C.textHint },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Theme.spacing.md,
    },
    avatarText: { fontSize: 28, color: '#fff', fontWeight: Theme.typography.weightBold },
    displayName: { fontSize: Theme.typography.fontSizeXL, fontWeight: Theme.typography.weightBold, color: C.textPrimary },
    memberSince: { fontSize: Theme.typography.fontSizeSM, color: C.textHint, marginTop: 4 },
    statsRow: {
      flexDirection: 'row',
      backgroundColor: C.surface,
      marginTop: Theme.spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: C.border,
    },
    section: {
      marginTop: Theme.spacing.lg,
      paddingHorizontal: Theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: Theme.typography.fontSizeMD,
      fontWeight: Theme.typography.weightBold,
      color: C.textPrimary,
      marginBottom: Theme.spacing.md,
    },
    loader: { marginVertical: Theme.spacing.lg },
    noSubmissions: {
      color: C.textHint,
      fontSize: Theme.typography.fontSizeBase,
      textAlign: 'center',
      paddingVertical: Theme.spacing.xl,
    },
    submissionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.surface,
      borderRadius: Theme.radius.lg,
      padding: Theme.spacing.md,
      marginBottom: Theme.spacing.sm,
      borderWidth: 1,
      borderColor: C.border,
    },
    submissionInfo: { flex: 1, marginRight: Theme.spacing.md },
    submissionName: {
      fontSize: Theme.typography.fontSizeBase,
      fontWeight: Theme.typography.weightSemibold,
      color: C.textPrimary,
    },
    submissionAddress: {
      fontSize: Theme.typography.fontSizeSM,
      color: C.textHint,
      marginTop: 2,
    },
    submissionMeta: { alignItems: 'flex-end' },
    submissionDate: { fontSize: Theme.typography.fontSizeXS, color: C.textHint },
    submissionRating: {
      fontSize: Theme.typography.fontSizeSM,
      color: Colors.accent,
      fontWeight: Theme.typography.weightBold,
      marginTop: 2,
    },
    signOutBtn: {
      margin: Theme.spacing.xl,
      borderWidth: 1.5,
      borderColor: C.danger,
      borderRadius: Theme.radius.pill,
      paddingVertical: 14,
      alignItems: 'center',
    },
    signOutText: { color: C.danger, fontSize: Theme.typography.fontSizeMD, fontWeight: Theme.typography.weightBold },
  });
}
