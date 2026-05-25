// Shared React Native UI components — mobile equivalents of the desktop's
// src/components/ui.jsx. No browser APIs; pure React Native.

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { useColors } from '../theme/brand';

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        cardStyles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
});

// ─── CardHeader ──────────────────────────────────────────────────────────────

export function CardHeader({ title, hint }: { title: string; hint?: string }) {
  const colors = useColors();
  return (
    <View style={[headerStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[headerStyles.title, { color: colors.text }]}>{title}</Text>
      {hint && <Text style={[headerStyles.hint, { color: colors.textMuted }]}>{hint}</Text>}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 12 },
});

// ─── MetricCard ──────────────────────────────────────────────────────────────

type Tone = 'green' | 'red' | 'amber' | 'blue' | 'purple';

const TONE_COLORS: Record<Tone, { bg: string; text: string; border: string }> = {
  green:  { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
  red:    { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5' },
  amber:  { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
  blue:   { bg: '#EFF6FF', text: '#1E40AF', border: '#93C5FD' },
  purple: { bg: '#F5F3FF', text: '#5B21B6', border: '#C4B5FD' },
};

interface MetricCardProps {
  tone: Tone;
  icon: string;
  label: string;
  value: number | string | null | undefined;
  sub?: string;
}

export function MetricCard({ tone, icon, label, value, sub }: MetricCardProps) {
  const tc = TONE_COLORS[tone];
  return (
    <View style={[metricStyles.card, { backgroundColor: tc.bg, borderColor: tc.border }]}>
      <Text style={metricStyles.icon}>{icon}</Text>
      <Text style={[metricStyles.label, { color: tc.text }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[metricStyles.value, { color: tc.text }]} numberOfLines={1}>
        {value ?? '—'}
      </Text>
      {sub && (
        <Text style={[metricStyles.sub, { color: tc.text }]} numberOfLines={1}>
          {sub}
        </Text>
      )}
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    margin: 4,
    minWidth: 140,
  },
  icon:  { fontSize: 22, marginBottom: 6 },
  label: { fontSize: 11, fontWeight: '600', marginBottom: 4, opacity: 0.75 },
  value: { fontSize: 20, fontWeight: '700' },
  sub:   { fontSize: 11, marginTop: 2, opacity: 0.65 },
});

// ─── MetricGrid ──────────────────────────────────────────────────────────────

export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <View style={gridStyles.row}>{children}</View>;
}

const gridStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
});

// ─── EmptyState ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  const colors = useColors();
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>{icon}</Text>
      <Text style={[emptyStyles.text, { color: colors.textMuted }]}>{text}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  icon:  { fontSize: 32, marginBottom: 10 },
  text:  { fontSize: 14, textAlign: 'center' },
});

// ─── Loader ──────────────────────────────────────────────────────────────────

interface LoaderProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function Loader({ loading, error, onRetry, children }: LoaderProps) {
  const colors = useColors();
  if (loading) {
    return (
      <View style={loaderStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={loaderStyles.center}>
        <Text style={[loaderStyles.errorText, { color: colors.error }]}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={[loaderStyles.retryBtn, { borderColor: colors.primary }]} onPress={onRetry}>
            <Text style={[loaderStyles.retryLabel, { color: colors.primary }]}>Qayta urinish</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  return <>{children}</>;
}

const loaderStyles = StyleSheet.create({
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText:  { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryBtn:   { borderWidth: 1, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryLabel: { fontSize: 14, fontWeight: '600' },
});

// ─── Badge ───────────────────────────────────────────────────────────────────

type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'gray';

const BADGE_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  green: { bg: '#DCFCE7', text: '#166534' },
  red:   { bg: '#FEE2E2', text: '#991B1B' },
  amber: { bg: '#FEF3C7', text: '#92400E' },
  blue:  { bg: '#DBEAFE', text: '#1E40AF' },
  gray:  { bg: '#F3F4F6', text: '#374151' },
};

export function Badge({ label, variant = 'gray' }: { label: string; variant?: BadgeVariant }) {
  const bc = BADGE_COLORS[variant];
  return (
    <View style={[badgeStyles.pill, { backgroundColor: bc.bg }]}>
      <Text style={[badgeStyles.label, { color: bc.text }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  pill:  { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  label: { fontSize: 11, fontWeight: '600' },
});

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider() {
  const colors = useColors();
  return <View style={[dividerStyles.line, { backgroundColor: colors.border }]} />;
}

const dividerStyles = StyleSheet.create({
  line: { height: 1, marginVertical: 4 },
});

// ─── Row ─────────────────────────────────────────────────────────────────────

export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[rowStyles.row, style]}>
      {children}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

// ─── SectionLabel ────────────────────────────────────────────────────────────

export function SectionLabel({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Text style={[sectionStyles.text, { color: colors.textMuted }]}>{text}</Text>
  );
}

const sectionStyles = StyleSheet.create({
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
});

// ─── PrimaryButton ───────────────────────────────────────────────────────────

export function PrimaryButton({
  label,
  onPress,
  loading: busy = false,
  disabled = false,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  const colors = useColors();
  const bg = danger ? '#DC2626' : colors.primary;
  return (
    <TouchableOpacity
      style={[btnStyles.btn, { backgroundColor: bg, opacity: disabled || busy ? 0.6 : 1 }]}
      onPress={onPress}
      disabled={disabled || busy}
      activeOpacity={0.8}
    >
      {busy ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={btnStyles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export function GhostButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[btnStyles.ghost, { borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[btnStyles.ghostLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const btnStyles = StyleSheet.create({
  btn:        { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  label:      { color: '#fff', fontSize: 15, fontWeight: '600' },
  ghost:      { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderWidth: 1 },
  ghostLabel: { fontSize: 15, fontWeight: '500' },
});
