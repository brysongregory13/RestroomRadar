import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Review } from '../types/Review';
import { StarRating } from './StarRating';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface Props {
  review: Review;
}

export function ReviewItem({ review }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{review.displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.name}>{review.displayName}</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={review.rating} size={13} />
            <Text style={styles.time}>{timeAgo(review.createdAt)}</Text>
          </View>
        </View>
      </View>
      {review.text ? <Text style={styles.text}>{review.text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.sm },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  avatarText: {
    fontSize: Theme.typography.fontSizeMD,
    color: Colors.primary,
    fontWeight: Theme.typography.weightBold,
  },
  meta: { flex: 1 },
  name: {
    fontSize: Theme.typography.fontSizeBase,
    fontWeight: Theme.typography.weightSemibold,
    color: Colors.textPrimary,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  time: {
    fontSize: Theme.typography.fontSizeXS,
    color: Colors.textHint,
    marginLeft: Theme.spacing.sm,
  },
  text: {
    fontSize: Theme.typography.fontSizeBase,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
