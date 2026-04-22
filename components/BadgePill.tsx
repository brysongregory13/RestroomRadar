import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

interface Props {
  label: string;
  color?: string;
  textColor?: string;
}

export function BadgePill({ label, color = Colors.primaryLight, textColor = Colors.primary }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.radius.pill,
    marginRight: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },
  text: {
    fontSize: Theme.typography.fontSizeXS,
    fontWeight: Theme.typography.weightSemibold,
  },
});
