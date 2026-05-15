import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { useColors } from '../../context/ThemeContext';
import { getRestroomsByUser } from '../../services/restroomService';
import { getFavoriteRestrooms } from '../../services/favoritesService';
import { Restroom } from '../../types/Restroom';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;
type Tab = 'submissions' | 'saved';

export function ProfileScreen({ navigation }: Props) {
  const { user, appUser, logOut } = useAuth();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [tab, setTab] = useState<Tab>('submissions');
  const [submissions, setSubmissions] = useState<Restroom[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [savedRestrooms, setSavedRestrooms] = useState<Restroom[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    console.log('[ProfileScreen] fetching submissions for uid:', user.uid);
    setSubmissionsLoading(true);
    getRestroomsByUser(user.uid)
      .then((results) => {
        console.log('[ProfileScreen] submissions received:', results.length);
        setSubmissions(results);
      })
      .catch((e) => console.log('[ProfileScreen] submissions error:', e?.message ?? e))
      .finally(() => setSubmissionsLoading(false));
  }, [user?.uid]);

  useEffect(() => {
    if (tab !== 'saved' || !user) return;
    setSavedLoading(true);
    getFavoriteRestrooms(user.uid)
      .then(setSavedRestrooms)
      .catch((e) => console.log('[ProfileScreen] favorites error:', e?.message ?? e))
      .finally(() => setSavedLoading(false));
  }, [tab, user?.uid]);

  function navigateToRestroom(id: string) {
    (navigation as any).navigate('Main', {
      screen: 'Explore',
      params: { screen: 'Detail', params: { id } },
    });
  }

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

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'submissions' && styles.tabBtnActive]}
            onPress={() => setTab('submissions')}
          >
            <Text style={[styles.tabBtnText, tab === 'submissions' && styles.tabBtnTextActive]}>
              My Submissions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'saved' && styles.tabBtnActive]}
            onPress={() => setTab('saved')}
          >
            <Text style={[styles.tabBtnText, tab === 'saved' && styles.tabBtnTextActive]}>
              Saved ♥
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submissions Tab */}
        {tab === 'submissions' && (
          <View style={styles.section}>
            {submissionsLoading ? (
              <ActivityIndicator color={C.primary} style={styles.loader} />
            ) : submissions.length === 0 ? (
              <Text style={styles.noItems}>No submissions yet.</Text>
            ) : (
              submissions.map((r) => (
                <RestroomListItem
                  key={r.id}
                  restroom={r}
                  onPress={() => navigateToRestroom(r.id)}
                  styles={styles}
                  C={C}
                />
              ))
            )}
          </View>
        )}

        {/* Saved Tab */}
        {tab === 'saved' && (
          <View style={styles.section}>
            {savedLoading ? (
              <ActivityIndicator color={C.primary} style={styles.loader} />
            ) : savedRestrooms.length === 0 ? (
              <Text style={styles.noItems}>No saved restrooms yet. Tap ♥ on any restroom to save it.</Text>
            ) : (
              savedRestrooms.map((r) => (
                <RestroomListItem
                  key={r.id}
                  restroom={r}
                  onPress={() => navigateToRestroom(r.id)}
                  styles={styles}
                  C={C}
                />
              ))
            )}
          </View>
        )}

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

function RestroomListItem({
  restroom,
  onPress,
  styles,
  C,
}: {
  restroom: Restroom;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  C: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={styles.listItemInfo}>
        <Text style={styles.listItemName} numberOfLines={1}>{restroom.name}</Text>
        {restroom.address ? (
          <Text style={styles.listItemAddress} numberOfLines={1}>{restroom.address}</Text>
        ) : null}
      </View>
      <View style={styles.listItemMeta}>
        <Text style={styles.listItemDate}>
          {restroom.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <Text style={styles.listItemRating}>★ {restroom.avgRating.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
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
    tabs: {
      flexDirection: 'row',
      backgroundColor: C.surface,
      marginTop: Theme.spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: C.border,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: Theme.spacing.md,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabBtnActive: { borderBottomColor: C.primary },
    tabBtnText: {
      fontSize: Theme.typography.fontSizeSM,
      fontWeight: Theme.typography.weightSemibold,
      color: C.textHint,
    },
    tabBtnTextActive: { color: C.primary },
    section: {
      marginTop: Theme.spacing.sm,
      paddingHorizontal: Theme.spacing.lg,
      paddingBottom: Theme.spacing.md,
    },
    loader: { marginVertical: Theme.spacing.lg },
    noItems: {
      color: C.textHint,
      fontSize: Theme.typography.fontSizeBase,
      textAlign: 'center',
      paddingVertical: Theme.spacing.xl,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.surface,
      borderRadius: Theme.radius.lg,
      padding: Theme.spacing.md,
      marginBottom: Theme.spacing.sm,
      marginTop: Theme.spacing.sm,
      borderWidth: 1,
      borderColor: C.border,
    },
    listItemInfo: { flex: 1, marginRight: Theme.spacing.md },
    listItemName: {
      fontSize: Theme.typography.fontSizeBase,
      fontWeight: Theme.typography.weightSemibold,
      color: C.textPrimary,
    },
    listItemAddress: {
      fontSize: Theme.typography.fontSizeSM,
      color: C.textHint,
      marginTop: 2,
    },
    listItemMeta: { alignItems: 'flex-end' },
    listItemDate: { fontSize: Theme.typography.fontSizeXS, color: C.textHint },
    listItemRating: {
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
