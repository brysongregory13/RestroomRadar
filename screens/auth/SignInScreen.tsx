import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: unknown) {
      Alert.alert('Sign In Failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>RestroomRadar</Text>
      <Text style={styles.subtitle}>Find clean restrooms wherever you are.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={Colors.textHint}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={Colors.textHint}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.linkText}>Don't have an account? Create one</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Theme.spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: Theme.typography.fontSizeXXL,
    fontWeight: Theme.typography.weightBold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.typography.fontSizeBase,
    color: Colors.textHint,
    textAlign: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 13,
    fontSize: Theme.typography.fontSizeMD,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Theme.radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: Theme.typography.fontSizeMD,
    fontWeight: Theme.typography.weightBold,
  },
  link: { alignItems: 'center' },
  linkText: { color: Colors.primary, fontSize: Theme.typography.fontSizeBase },
});
