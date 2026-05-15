import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Restroom } from '../types/Restroom';
import { StarRating } from './StarRating';
import { BadgePill } from './BadgePill';
import { FavoriteButton } from './FavoriteButton';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

interface Props {
  restroom: Restroom;
  distanceMi?: number;
  onPress: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

const ACCESS_LABELS: Record<string, string> = {
  public: 'Public',
  customer: 'Customers',
  key: 'Key Required',
  password: 'Password',
};

function daysAgo(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function RestroomCard({ restroom, distanceMi, onPress, isFavorited, onToggleFavorite }: Props) {
  const open = restroom.isOpen && !restroom.isClosed;
  const statusColor = open ? Colors.success : Colors.danger;
  const isVerified = restroom.reviewCount >= 3;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{restroom.name}</Text>
        {onToggleFavorite !== undefined && (
          <FavoriteButton isFavorited={!!isFavorited} onPress={onToggleFavorite} size={18} />
        )}
        <Text style={[styles.status, { color: statusColor }]}>{open ? 'Open' : 'Closed'}</Text>
      </View>

      <View style={styles.ratingRow}>
        <StarRating rating={restroom.avgRating} size={13} />
        <Text style={styles.avgRating}>{restroom.avgRating.toFixed(1)}</Text>
        <Text style={styles.reviewCount}>({restroom.reviewCount} reviews)</Text>
        {distanceMi !== undefined && (
          <Text style={styles.distance}>{distanceMi.toFixed(1)} mi</Text>
        )}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.timeAdded}>Added {daysAgo(restroom.createdAt)}</Text>
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        )}
      </View>

      <View style={styles.badgeRow}>
        {restroom.gender.map((g) => (
          <BadgePill key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} />
        ))}
        <BadgePill
          label={ACCESS_LABELS[restroom.accessType] ?? restroom.accessType}
          color="#EEF2FF"
          textColor="#3B4FD8"
        />
        {restroom.amenities.includes('handicap') && (
          <BadgePill label="♿" color="#FFF3E0" textColor="#E65100" />
        )}
        {restroom.amenities.includes('baby_change') && (
          <BadgePill label="👶" color="#FFF3E0" textColor="#E65100" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.lg,
    marginVertical: Theme.spacing.sm,
    ...Theme.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    gap: Theme.spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: Theme.typography.fontSizeMD,
    fontWeight: Theme.typography.weightSemibold,
    color: Colors.textPrimary,
  },
  status: {
    fontSize: Theme.typography.fontSizeSM,
    fontWeight: Theme.typography.weightSemibold,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    gap: 4,
  },
  avgRating: {
    fontSize: Theme.typography.fontSizeSM,
    fontWeight: Theme.typography.weightSemibold,
    color: Colors.textPrimary,
  },
  reviewCount: {
    fontSize: Theme.typography.fontSizeXS,
    color: Colors.textHint,
  },
  distance: {
    fontSize: Theme.typography.fontSizeXS,
    color: Colors.textHint,
    marginLeft: Theme.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  timeAdded: {
    fontSize: Theme.typography.fontSizeXS,
    color: Colors.textHint,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: Theme.radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: Theme.typography.fontSizeXS,
    color: '#2E7D32',
    fontWeight: Theme.typography.weightSemibold,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap' },
});
