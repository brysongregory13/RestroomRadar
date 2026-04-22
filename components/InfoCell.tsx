import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

interface Props {
  label: string;
  value: string;
}

export function InfoCell({ label, value }: Props) {
  return (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    marginHorizontal: 4,
  },
  label: {
    fontSize: Theme.typography.fontSizeXS,
    color: Colors.textHint,
    marginBottom: 2,
    fontWeight: Theme.typography.weightSemibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: Theme.typography.fontSizeMD,
    color: Colors.textPrimary,
    fontWeight: Theme.typography.weightSemibold,
  },
});
