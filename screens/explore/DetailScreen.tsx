import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../../navigation/types';
import { Restroom } from '../../types/Restroom';
import { Review } from '../../types/Review';
import { getRestroomById } from '../../services/restroomService';
import { getReviews, addReview } from '../../services/reviewService';
import { useAuth } from '../../hooks/useAuth';
import { useFavorites } from '../../hooks/useFavorites';
import { useMapContext } from '../../context/MapContext';
import { StarRating } from '../../components/StarRating';
import { BadgePill } from '../../components/BadgePill';
import { InfoCell } from '../../components/InfoCell';
import { ReviewItem } from '../../components/ReviewItem';
import { FavoriteButton } from '../../components/FavoriteButton';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type Props = NativeStackScreenProps<ExploreStackParamList, 'Detail'>;
type ReviewSort = 'recent' | 'highest' | 'helpful';

const REVIEW_SORT_OPTIONS: { key: ReviewSort; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'highest', label: 'Highest' },
  { key: 'helpful', label: 'Helpful' },
];

const ACCESS_LABELS: Record<string, string> = {
  public: 'Public',
  customer: 'Customers Only',
  key: 'Key Required',
  password: 'Password Required',
};

export function DetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { setLastVisited } = useMapContext();

  const [restroom, setRestroom] = useState<Restroom | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewSort, setReviewSort] = useState<ReviewSort>('recent');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [r, rv] = await Promise.all([getRestroomById(id), getReviews(id)]);
      setRestroom(r);
      setReviews(rv);
      setLoading(false);
    })();
  }, [id]);

  // Set lastVisited in MapContext so MapScreen can prompt for a review
  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      if (restroom) {
        setLastVisited({ id: restroom.id, name: restroom.name });
      }
    });
  }, [navigation, restroom, setLastVisited]);

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    if (reviewSort === 'highest') return copy.sort((a, b) => b.rating - a.rating);
    if (reviewSort === 'helpful') return copy.sort((a, b) => b.helpfulCount - a.helpfulCount);
    return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [reviews, reviewSort]);

  async function handleSubmitReview() {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to leave a review.');
      return;
    }
    if (!reviewText.trim()) {
      Alert.alert('Missing text', 'Please write something before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const displayName = user.displayName ?? user.email ?? 'Anonymous';
      await addReview(id, user.uid, displayName, reviewRating, reviewText.trim());
      const updated = await getReviews(id);
      setReviews(updated);
      setReviewText('');
      setReviewRating(5);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShare() {
    if (!restroom) return;
    try {
      await Share.share({
        title: restroom.name,
        message: `Check out ${restroom.name} on RestroomRadar!\n${restroom.address}`,
      });
    } catch {}
  }

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
        {/* Photo banner */}
        <View style={styles.photoBanner}>
          <Text style={styles.photoPlaceholder}>{restroom.photos.length > 0 ? '📷' : '🚻'}</Text>
        </View>

        <View style={styles.body}>
          {/* Name, Favorite & Share row */}
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>{restroom.name}</Text>
            <View style={styles.nameActions}>
              <FavoriteButton
                isFavorited={favoriteIds.has(id)}
                onPress={() => toggleFavorite(id)}
                size={22}
              />
              <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
                <Text style={styles.shareBtnText}>⬆️</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Status & Address */}
          <View style={styles.statusRow}>
            <Text style={[styles.status, { color: open ? Colors.success : Colors.danger }]}>
              {open ? 'Open Now' : 'Closed'}
            </Text>
            {restroom.reviewCount >= 3 && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.address}>{restroom.address}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <StarRating rating={restroom.avgRating} size={18} />
            <Text style={styles.ratingText}>
              {restroom.avgRating.toFixed(1)} ({restroom.reviewCount} reviews)
            </Text>
          </View>

          {/* Info grid */}
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

          {/* Amenities */}
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

          {/* Description */}
          {restroom.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{restroom.description}</Text>
            </View>
          ) : null}

          {/* Actions */}
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

          {/* Write a review */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leave a Review</Text>
            {user ? (
              <View style={styles.reviewForm}>
                <StarRating rating={reviewRating} size={28} interactive onRate={setReviewRating} />
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Share your experience…"
                  placeholderTextColor={Colors.textHint}
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.submitReviewBtn, submitting && styles.submitReviewBtnDisabled]}
                  onPress={handleSubmitReview}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitReviewBtnText}>Submit Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.signInPrompt}
                onPress={() => navigation.getParent()?.navigate('Auth')}
              >
                <Text style={styles.signInPromptText}>Sign in to leave a review →</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
              <View style={styles.sortTabs}>
                {REVIEW_SORT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.sortTab, reviewSort === opt.key && styles.sortTabActive]}
                    onPress={() => setReviewSort(opt.key)}
                  >
                    <Text style={[styles.sortTabText, reviewSort === opt.key && styles.sortTabTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {sortedReviews.length === 0 ? (
              <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
            ) : (
              sortedReviews.map((r) => (
                <ReviewItem key={r.id} review={r} restroomId={id} />
              ))
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
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: Theme.spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: Theme.typography.fontSizeXL,
    fontWeight: Theme.typography.weightBold,
    color: Colors.textPrimary,
  },
  nameActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingTop: 4,
  },
  shareBtn: { padding: 4 },
  shareBtnText: { fontSize: 20 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: 4,
  },
  status: { fontSize: Theme.typography.fontSizeBase, fontWeight: Theme.typography.weightSemibold },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: Theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: Theme.typography.fontSizeXS,
    color: '#2E7D32',
    fontWeight: Theme.typography.weightBold,
  },
  address: {
    fontSize: Theme.typography.fontSizeBase,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
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
  description: {
    fontSize: Theme.typography.fontSizeBase,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.xl,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Theme.radius.pill,
    alignItems: 'center',
  },
  actionBtnOutline: { borderWidth: 1.5, borderColor: Colors.border },
  actionBtnText: { fontSize: Theme.typography.fontSizeBase, fontWeight: Theme.typography.weightSemibold },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  sortTabs: { flexDirection: 'row', gap: 4 },
  sortTab: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortTabActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  sortTabText: {
    fontSize: Theme.typography.fontSizeXS,
    color: Colors.textHint,
    fontWeight: Theme.typography.weightSemibold,
  },
  sortTabTextActive: { color: Colors.primary },
  noReviews: { color: Colors.textHint, fontStyle: 'italic' },
  reviewForm: { gap: Theme.spacing.md },
  reviewInput: {
    backgroundColor: Colors.background,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 10,
    fontSize: Theme.typography.fontSizeBase,
    color: Colors.textPrimary,
    minHeight: 80,
  },
  submitReviewBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Theme.radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitReviewBtnDisabled: { opacity: 0.6 },
  submitReviewBtnText: {
    color: '#fff',
    fontWeight: Theme.typography.weightBold,
    fontSize: Theme.typography.fontSizeBase,
  },
  signInPrompt: {
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  signInPromptText: {
    color: Colors.primary,
    fontWeight: Theme.typography.weightSemibold,
    fontSize: Theme.typography.fontSizeBase,
  },
});
