// Sozlamalar — server URL, profile info, app version.

import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useColors } from '../theme/brand';
import { getBackendUrl, setBackendUrl } from '../api/backendClient';
import { getLicenseUrl, setLicenseUrl } from '../api/licenseClient';

export default function SettingsScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();

  const [licenseUrl, setLicenseUrlState] = useState(getLicenseUrl);
  const [backendUrlState, setBackendUrlState] = useState(getBackendUrl);
  const [saved, setSaved] = useState(false);

  const saveUrls = () => {
    try {
      if (licenseUrl.trim()) setLicenseUrl(licenseUrl.trim());
      if (backendUrlState.trim()) setBackendUrl(backendUrlState.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      Alert.alert('Xatolik', err.message);
    }
  };

  const resetUrls = () => {
    setLicenseUrl(null);
    setBackendUrl(null);
    setLicenseUrlState(getLicenseUrl());
    setBackendUrlState(getBackendUrl());
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {/* Profile */}
      {user && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profil</Text>
          <Row label="Foydalanuvchi" value={user.fullName ?? user.username} colors={colors} />
          <Row label="Login" value={user.username} colors={colors} />
          <Row label="Rol" value={user.role} colors={colors} />
          {user.accountName && <Row label="Akkaunt" value={user.accountName} colors={colors} />}
          {user.subscriptionExpires && <Row label="Obuna tugash" value={user.subscriptionExpires.slice(0, 10)} colors={colors} />}
        </View>
      )}

      {/* Server URLs */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Server manzillari</Text>

        <Text style={[styles.label, { color: colors.textMuted }]}>Litsenziya serveri URL</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={licenseUrl}
          onChangeText={setLicenseUrlState}
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
        />

        <Text style={[styles.label, { color: colors.textMuted }]}>Backend URL</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={backendUrlState}
          onChangeText={setBackendUrlState}
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={[styles.ghostBtn, { borderColor: colors.border }]} onPress={resetUrls}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>Qayta tiklash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: saved ? '#10B981' : colors.primary }]} onPress={saveUrls}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{saved ? '✓ Saqlandi' : 'Saqlash'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.error }]} onPress={logout} activeOpacity={0.8}>
        <Text style={{ color: colors.error, fontWeight: '600', fontSize: 15 }}>Chiqish</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.textMuted }]}>SavdoPRO Mobile v1.0</Text>
    </ScrollView>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 16, paddingBottom: 40 },
  card:       { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle:{ fontSize: 16, fontWeight: '700', marginBottom: 14, },
  infoRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel:  { fontSize: 13 },
  infoValue:  { fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  label:      { fontSize: 12, fontWeight: '500', marginBottom: 6, marginTop: 4 },
  input:      { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 13 },
  ghostBtn:   { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:    { flex: 1, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoutBtn:  { borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  version:    { textAlign: 'center', fontSize: 12 },
});
