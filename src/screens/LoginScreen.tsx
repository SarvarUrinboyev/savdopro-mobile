// Login screen — username + password only.
// Server URL is hidden (hardcoded via DEFAULT_URL in licenseClient.ts).
// Last-used credentials are saved to MMKV so the user never has to
// re-type them after the first login.

import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { LicenseError } from '../api/licenseClient';
import { storage, STORAGE_KEYS } from '../storage/mmkv';
import { useColors } from '../theme/brand';

export default function LoginScreen() {
  const { login } = useAuth();
  const colors = useColors();

  const [username, setUsername] = useState(
    () => storage.getString(STORAGE_KEYS.SAVED_USERNAME) ?? '',
  );
  const [password, setPassword] = useState(
    () => storage.getString(STORAGE_KEYS.SAVED_PASSWORD) ?? '',
  );
  const [totpCode, setTotpCode] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!username.trim() || !password) {
      setError('Login va parolni kiriting');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password, totpCode.trim() || undefined);

      // Save credentials only after a successful login.
      storage.set(STORAGE_KEYS.SAVED_USERNAME, username.trim());
      storage.set(STORAGE_KEYS.SAVED_PASSWORD, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kirish muvaffaqiyatsiz';
      if (err instanceof LicenseError && /totp|2fa|kod/i.test(msg)) {
        setNeedsTotp(true);
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>SavdoPRO</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Akkauntingizga kiring
          </Text>

          <Field
            label="Login"
            value={username}
            onChange={setUsername}
            autoCapitalize="none"
            colors={colors}
          />
          <Field
            label="Parol"
            value={password}
            onChange={setPassword}
            secureTextEntry
            colors={colors}
          />
          {needsTotp && (
            <Field
              label="6 raqamli kod (2FA)"
              value={totpCode}
              onChange={setTotpCode}
              keyboardType="number-pad"
              maxLength={6}
              colors={colors}
            />
          )}

          {error && (
            <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Kirish</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'number-pad' | 'email-address';
  secureTextEntry?: boolean;
  maxLength?: number;
  colors: ReturnType<typeof useColors>;
}

function Field({
  label,
  value,
  onChange,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  secureTextEntry,
  maxLength,
  colors,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
        ]}
        value={value}
        onChangeText={onChange}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: {
    backgroundColor: 'transparent',
    padding: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  field: { marginBottom: 14 },
  label: { fontSize: 12, marginBottom: 6, fontWeight: '500' },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  error: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 13,
  },
  button: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
