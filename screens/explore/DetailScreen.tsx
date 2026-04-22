import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../../navigation/types';
import { Restroom } from '../../types/Restroom';
import { Review } from '../../types/Review';
import { getRestroomById } from '../../services/restroomService';
import { getReviews } from '../../services/reviewService';
import { StarRating } from '../../components/StarRating';
import { BadgePill } from '../../components/BadgePill';
import { InfoCell } from '../../components/InfoCell';
import { ReviewItem } from '../../components/ReviewItem';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type Props = NativeStackScreenProps<ExploreStackParamList, 'Detail'>;

const ACCESS_LABELS: Record<string, string> = {
  public: 'Public',
  customer: 'Customers Only',
  key: 'Key Required',
  password: 'Password Required',
};

export function DetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [restroom, setRestroom] = useState<Restroom | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [r, rv] = await Promise.all([getRestroomById(id), getReviews(id)]);
      setRestroom(r);
      setReviews(rv);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!restroom) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Restroom not found.</Text>
      </View>
    );
  }

  const open = restroom.isOpen && !restroom.isClosed;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.photoBanner}>
          <Text style={styles.photoPlaceholder}>🚻</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{restroom.name}</Text>
            <Text style={[styles.status, { color: open ? Colors.success : Colors.danger }]}>
              {open ? 'Open' : 'Closed'}
            </Text>
          </View>
          <Text style={styles.address}>{restroom.address}</Text>

          <View style={styles.ratingRow}>
            <StarRating rating={restroom.avgRating} size={18} />
            <Text style={styles.ratingText}>
              {restroom.avgRating.toFixed(1)} ({restroom.reviewCount} reviews)
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <InfoCell
              label="Gender"
              value={restroom.gender.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}
            />
            <InfoCell label="Access" value={ACCESS_LABELS[restroom.accessType] ?? restroom.accessType} />
          </View>
          <View style={[styles.infoGrid, { marginTop: 8 }]}>
            <InfoCell label="Stalls" value={String(restroom.stalls)} />
            <InfoCell label="Urinals" value={String(restroom.urinals)} />
          </View>
          <View style={[styles.infoGrid, { marginTop: 8 }]}>
            <InfoCell
              label="Hours"
              value={restroom.hoursOpen ? `${restroom.hoursOpen} – ${restroom.hoursClose}` : 'Unknown'}
            />
            <InfoCell label="Status" value={open ? 'Open Now' : 'Closed'} />
          </View>

          {restroom.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.badgeRow}>
                {restroom.amenities.includes('handicap') && (
                  <BadgePill label="♿ Handicap" color="#FFF3E0" textColor="#E65100" />
                )}
                {restroom.amenities.includes('baby_change') && (
                  <BadgePill label="👶 Baby Changing" color="#FFF3E0" textColor="#E65100" />
                )}
                {restroom.amenities.includes('free') && (
                  <BadgePill label="Free Entry" color="#E8F5E9" textColor="#2E7D32" />
                )}
                {restroom.amenities.includes('gender_neutral') && (
                  <BadgePill label="Gender Neutral" color={Colors.primaryLight} textColor={Colors.primary} />
                )}
              </View>
            </View>
          )}

          {restroom.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{restroom.description}</Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={() => navigation.push('Report', { id })}
            >
              <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Report Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={() => navigation.push('SuggestEdit', { id })}
            >
              <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Suggest Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.length === 0 ? (
              <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
            ) : (
              reviews.map((r) => <ReviewItem key={r.id} review={r} />)
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.danger },
  photoBanner: {
    height: 200,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: { fontSize: 72 },
  body: { padding: Theme.spacing.lg },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: Theme.typography.fontSizeXL,
    fontWeight: Theme.typography.weightBold,
    color: Colors.textPrimary,
    marginRight: Theme.spacing.sm,
  },
  status: { fontSize: Theme.typography.fontSizeBase, fontWeight: Theme.typography.weightSemibold },
  address: { fontSize: Theme.typography.fontSizeBase, color: Colors.textSecondary, marginBottom: Theme.spacing.md },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.lg },
  ratingText: { fontSize: Theme.typography.fontSizeBase, color: Colors.textSecondary, marginLeft: 8 },
  infoGrid: { flexDirection: 'row', marginHorizontal: -4 },
  section: { marginTop: Theme.spacing.xl },
  sectionTitle: {
    fontSize: Theme.typography.fontSizeMD,
    fontWeight: Theme.typography.weightBold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  description: { fontSize: Theme.typography.fontSizeBase, color: Colors.textSecondary, lineHeight: 22 },
  actionsRow: { flexDirection: 'row', gap: Theme.spacing.md, marginTop: Theme.spacing.xl },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: Theme.radius.pill, alignItems: 'center' },
  actionBtnOutline: { borderWidth: 1.5, borderColor: Colors.border },
  actionBtnText: { fontSize: Theme.typography.fontSizeBase, fontWeight: Theme.typography.weightSemibold },
  noReviews: { color: Colors.textHint, fontStyle: 'italic' },
});
