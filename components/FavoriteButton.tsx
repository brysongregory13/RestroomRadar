import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface Props {
  isFavorited: boolean;
  onPress: () => void;
  size?: number;
}

export function FavoriteButton({ isFavorited, onPress, size = 20 }: Props) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.btn}>
      <Text style={{ fontSize: size, color: isFavorited ? Colors.danger : Colors.textHint }}>
        {isFavorited ? '♥' : '♡'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
});
