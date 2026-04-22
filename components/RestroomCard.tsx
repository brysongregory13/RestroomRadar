import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Restroom } from '../types/Restroom';
import { StarRating } from './StarRating';
import { BadgePill } from './BadgePill';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

interface Props {
  restroom: Restroom;
  distanceMi?: number;
  onPress: () => void;
}

const ACCESS_LABELS: Record<string, string> = {
  public: 'Public',
  customer: 'Customers',
  key: 'Key Required',
  password: 'Password',
};

export function RestroomCard({ restroom, distanceMi, onPress }: Props) {
  const open = restroom.isOpen && !restroom.isClosed;
  const statusColor = open ? Colors.success : Colors.danger;
  const statusLabel = open ? 'Open' : 'Closed';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{restroom.name}</Text>
        <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
      </View>
      <View style={styles.ratingRow}>
        <StarRating rating={restroom.avgRating} size={14} />
        <Text style={styles.reviewCount}>({restroom.reviewCount})</Text>
        {distanceMi !== undefined && (
          <Text style={styles.distance}>{distanceMi.toFixed(1)} mi</Text>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: Theme.typography.fontSizeMD,
    fontWeight: Theme.typography.weightSemibold,
    color: Colors.textPrimary,
    marginRight: Theme.spacing.sm,
  },
  status: {
    fontSize: Theme.typography.fontSizeSM,
    fontWeight: Theme.typography.weightSemibold,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  reviewCount: {
    fontSize: Theme.typography.fontSizeXS,
    color: Colors.textHint,
    marginLeft: 4,
  },
  distance: {
    fontSize: Theme.typography.fontSizeXS,
    color: Colors.textHint,
    marginLeft: Theme.spacing.md,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap' },
});
