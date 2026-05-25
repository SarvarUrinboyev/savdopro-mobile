// "Ko'proq" (More) tab — lists all sections not on the bottom tabs.
// Tapping an item pushes the screen via the parent OwnerStack.

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OwnerStackParamList } from '../../navigation/OwnerStack';
import { useColors } from '../../theme/brand';
import { useAuth } from '../../auth/AuthContext';

type Nav = NativeStackNavigationProp<OwnerStackParamList>;

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sub?: string;
  screen: keyof OwnerStackParamList;
  superAdminOnly?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { icon: 'receipt-outline',   label: 'Buyurtmalar',           sub: 'Kutilayotgan va tugallangan',    screen: 'Orders' },
  { icon: 'person-add-outline',label: 'Yetkazib beruvchilar',  sub: 'Kontragentlar ro\'yxati',         screen: 'Suppliers' },
  { icon: 'card-outline',      label: 'Qarz',                  sub: 'Mening va mijoz qarzlarim',      screen: 'Debt' },
  { icon: 'wallet-outline',    label: 'Xarajatlar',            sub: 'Smena xarajatlari',              screen: 'Expenses' },
  { icon: 'home-outline',      label: "Do'kon xarajatlari",    sub: 'Umumiy xarajatlar',              screen: 'HomeExpenses' },
  { icon: 'swap-horizontal-outline', label: 'Tovar transferi', sub: "Do'konlar orasida",              screen: 'Transfers' },
  { icon: 'bar-chart-outline', label: 'Menejment',             sub: 'Sotuvlar tahlili, foydalar',     screen: 'Management' },
  { icon: 'storefront-outline',label: "Do'konlar",             sub: "Do'konlar va sozlamalar",        screen: 'Shops' },
  { icon: 'time-outline',      label: 'Smena tarixi',          sub: 'Barcha smenalar',                screen: 'ShiftHistory' },
  { icon: 'document-text-outline', label: 'Hisobot',           sub: 'Kunlik hisobot',                 screen: 'Reports' },
  { icon: 'calculator-outline',label: 'Kalkulyator',           sub: '',                               screen: 'Calculator' },
  { icon: 'settings-outline',  label: 'Sozlamalar',            sub: 'Profil, server URL',             screen: 'Settings' },
  { icon: 'shield-outline',    label: 'Admin panel',           sub: 'Akkauntlar, foydalanuvchilar',   screen: 'Admin', superAdminOnly: true },
];

export default function MenuScreen() {
  const navigation = useNavigation<Nav>();
  const colors = useColors();
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const items = MENU_ITEMS.filter((m) => !m.superAdminOnly || isSuperAdmin);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* User info card */}
      <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {(user?.fullName ?? user?.username ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.fullName ?? user?.username}
          </Text>
          <Text style={[styles.userRole, { color: colors.textMuted }]}>
            {user?.accountName ?? ''} · {user?.role ?? ''}
          </Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.screen}
            style={[
              styles.row,
              idx < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
            onPress={() => navigation.navigate(item.screen as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
              {!!item.sub && (
                <Text style={[styles.sub, { color: colors.textMuted }]}>{item.sub}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.error }]}
        onPress={logout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={[styles.logoutLabel, { color: colors.error }]}>Chiqish</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 16, paddingBottom: 32 },
  userCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  avatar:       { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: '#fff', fontSize: 20, fontWeight: '700' },
  userName:     { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  userRole:     { fontSize: 12 },
  section:      { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  iconWrap:     { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label:        { fontSize: 15, fontWeight: '500' },
  sub:          { fontSize: 12, marginTop: 1 },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 14 },
  logoutLabel:  { fontSize: 15, fontWeight: '600' },
});
