import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface Props {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export function StarRating({ rating, maxStars = 5, size = 16, interactive = false, onRate }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.round(rating);
        const star = filled ? '★' : '☆';
        const color = filled ? Colors.accent : Colors.border;

        if (interactive && onRate) {
          return (
            <TouchableOpacity key={i} onPress={() => onRate(i + 1)}>
              <StarChar char={star} color={color} size={size} />
            </TouchableOpacity>
          );
        }
        return <StarChar key={i} char={star} color={color} size={size} />;
      })}
    </View>
  );
}

function StarChar({ char, color, size }: { char: string; color: string; size: number }) {
  const { Text } = require('react-native');
  return (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>{char}</Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
