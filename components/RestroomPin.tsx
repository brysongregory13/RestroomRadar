import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Restroom } from '../types/Restroom';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

interface Props {
  restroom: Restroom;
  label?: string;
  onPress: () => void;
}

export function RestroomPin({ restroom, label, onPress }: Props) {
  const color = restroom.isOpen && !restroom.isClosed ? Colors.primary : Colors.danger;

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.pin, { backgroundColor: color }]}>
        {label ? (
          <Text style={styles.label}>{label}</Text>
        ) : (
          <Text style={styles.icon}>🚻</Text>
        )}
      </View>
      <View style={[styles.tip, { borderTopColor: color }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pin: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    ...Theme.shadow.sm,
  },
  tip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
  },
  icon: { fontSize: 14 },
  label: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
