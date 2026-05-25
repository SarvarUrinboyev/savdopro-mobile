// Login screen — three fields (server URL, username, password) plus
// an optional TOTP code that's only shown after the server rejects
// the first attempt with a "TOTP required" hint. The URL field
// defaults to whatever's stored in MMKV (or the LAN-IP fallback) so
// most users never see it after first launch.

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { getLicenseUrl, setLicenseUrl, LicenseError } from '../api/licenseClient';
import { useColors } from '../theme/brand';

export default function LoginScreen() {
  const { login } = useAuth();
  const colors = useColors();

  const [serverUrl, setServerUrl] = useState(getLicenseUrl());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist URL on every change so a relaunch picks it up — saves the
  // user re-typing the LAN address each time the dev server moves.
  useEffect(() => {
    if (serverUrl.trim()) setLicenseUrl(serverUrl.trim());
  }, [serverUrl]);

  const onSubmit = async () => {
    if (!username.trim() || !password) {
      setError('Login va parolni kiriting');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password, totpCode.trim() || undefined);
      // AuthProvider flips user → RootNavigator swaps to tabs.
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kirish muvaffaqiyatsiz';
      // The server signals "TOTP required" via the LoginRequest validation
      // path — if the message hints at TOTP, reveal the second field
      // instead of confusing the user with a generic error.
      if (err instanceof LicenseError && /totp|2fa|kod/i.test(msg)) {
        setNeedsTotp(true);
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onPickServer = () => {
    Alert.alert(
      'Server manzili',
      "Telefon va kompyuter bir Wi-Fi tarmoqda bo'lishi shart. " +
        'Standart: http://192.168.100.6:9090',
    );
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
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Akkauntingizga kiring</Text>

          <Field
            label="Server URL"
            value={serverUrl}
            onChange={setServerUrl}
            autoCapitalize="none"
            keyboardType="url"
            onLabelPress={onPickServer}
            colors={colors}
          />
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
  keyboardType?: 'default' | 'url' | 'number-pad' | 'email-address';
  secureTextEntry?: boolean;
  maxLength?: number;
  onLabelPress?: () => void;
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
  onLabelPress,
  colors,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text
        style={[styles.label, { color: colors.textMuted }]}
        onPress={onLabelPress}
      >
        {label}
        {onLabelPress ? '  ⓘ' : ''}
      </Text>
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
