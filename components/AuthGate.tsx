import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

interface Props {
  onSignIn: () => void;
  onSignUp: () => void;
  message?: string;
}

export function AuthGate({ onSignIn, onSignUp, message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Sign in required</Text>
      <Text style={styles.message}>
        {message ?? 'You need an account to continue.'}
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onSignIn}>
        <Text style={styles.primaryBtnText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={onSignUp}>
        <Text style={styles.secondaryBtnText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xxl,
    backgroundColor: Colors.background,
  },
  icon: { fontSize: 48, marginBottom: Theme.spacing.lg },
  title: {
    fontSize: Theme.typography.fontSizeXL,
    fontWeight: Theme.typography.weightBold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  message: {
    fontSize: Theme.typography.fontSizeBase,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Theme.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: Theme.typography.fontSizeMD,
    fontWeight: Theme.typography.weightBold,
  },
  secondaryBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Theme.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontSize: Theme.typography.fontSizeMD,
    fontWeight: Theme.typography.weightBold,
  },
});
