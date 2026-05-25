// Generic placeholder for stub screens during initial bring-up.
// Each tab gets its own thin wrapper that passes a title + hint —
// the wrappers will be replaced by real screens in later sessions.

import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '../theme/brand';
import { useAuth } from '../auth/AuthContext';

interface Props {
  title: string;
  hint?: string;
}

export default function PlaceholderScreen({ title, hint }: Props) {
  const colors = useColors();
  const { user, logout } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {hint && <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>}
      {user && (
        <View style={styles.userBlock}>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {user.fullName ?? user.username}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {user.accountName ?? '—'} · {user.role}
          </Text>
        </View>
      )}
      <Text
        style={[styles.link, { color: colors.primary }]}
        onPress={logout}
      >
        Chiqish
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  userBlock: { alignItems: 'center', marginBottom: 24 },
  meta: { fontSize: 13, marginBottom: 4 },
  link: { fontSize: 15, fontWeight: '600' },
});
