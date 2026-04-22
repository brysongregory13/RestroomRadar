import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  selected: string[];
  multiSelect?: boolean;
  onToggle: (value: string) => void;
}

export function ToggleGroup({ options, selected, multiSelect = false, onToggle }: Props) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.btn, active && styles.active]}
            onPress={() => onToggle(opt.value)}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm },
  btn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  active: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    fontSize: Theme.typography.fontSizeSM,
    color: Colors.textSecondary,
    fontWeight: Theme.typography.weightSemibold,
  },
  activeLabel: { color: Colors.surface },
});
