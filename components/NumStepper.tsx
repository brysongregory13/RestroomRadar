import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

interface Props {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function NumStepper({ value, min = 0, max = 20, onChange }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, value <= min && styles.disabled]}
        onPress={() => value > min && onChange(value - 1)}
        disabled={value <= min}
      >
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity
        style={[styles.btn, value >= max && styles.disabled]}
        onPress={() => value < max && onChange(value + 1)}
        disabled={value >= max}
      >
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: {
    width: 36,
    height: 36,
    borderRadius: Theme.radius.circle,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  btnText: {
    fontSize: 20,
    color: Colors.primary,
    lineHeight: 24,
  },
  value: {
    marginHorizontal: Theme.spacing.md,
    fontSize: Theme.typography.fontSizeMD,
    fontWeight: Theme.typography.weightBold,
    minWidth: 24,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
});
