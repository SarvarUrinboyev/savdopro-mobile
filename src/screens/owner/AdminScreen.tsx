// Admin panel — account list (SUPER_ADMIN only).

import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { AdminApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../lib/format';
import { Badge, Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

export default function AdminScreen() {
  const colors = useColors();
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState<null | 'add'>(null);

  const { data, loading, error, reload } = useApi(() => AdminApi.listAccounts(), [refreshKey]);
  const accounts: any[] = (data as any) ?? [];

  const toggleBlock = async (account: any) => {
    const newBlocked = !account.blocked;
    Alert.alert(
      newBlocked ? "Bloklash" : "Blokdan chiqarish",
      `${account.name} akkauntini ${newBlocked ? 'bloklashni' : 'blokdan chiqarishni'} xohlaysizmi?`,
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: 'Ha',
          onPress: async () => {
            try {
              await AdminApi.setBlocked(account.id, newBlocked);
              setRefreshKey((k) => k + 1);
            } catch (err: any) { Alert.alert('Xatolik', err.message); }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <CardHeader title="Akkauntlar" hint={`${accounts.length} ta`} />
          <Loader loading={loading} error={error} onRetry={reload}>
            {accounts.length === 0 ? (
              <EmptyState icon="🔐" text="Akkaunt topilmadi" />
            ) : (
              accounts.map((acc: any, idx: number) => (
                <View key={acc.id} style={[styles.row, idx < accounts.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.accName, { color: colors.text }]}>{acc.name}</Text>
                      {acc.blocked && <Badge label="Bloklangan" variant="red" />}
                    </View>
                    <Text style={[styles.accMeta, { color: colors.textMuted }]}>
                      {acc.users?.length ?? 0} ta foydalanuvchi
                      {acc.subscriptionExpires ? ` · ${formatDate(acc.subscriptionExpires)} gacha` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.blockBtn, { borderColor: acc.blocked ? '#10B981' : '#EF4444' }]}
                    onPress={() => toggleBlock(acc)}
                  >
                    <Text style={{ color: acc.blocked ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: '600' }}>
                      {acc.blocked ? 'Ochish' : 'Blok'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Loader>
        </Card>
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModal('add')} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {modal === 'add' && (
        <CreateAccountModal onClose={() => setModal(null)} onSaved={() => { setModal(null); setRefreshKey((k) => k + 1); }} />
      )}
    </View>
  );
}

function CreateAccountModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!name.trim() || !username.trim() || !password) { setErr("Barcha maydonlarni to'ldiring"); return; }
    setBusy(true);
    try {
      await AdminApi.createAccount({ name: name.trim(), ownerUsername: username.trim(), ownerPassword: password });
      onSaved();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Yangi akkaunt</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={name} onChangeText={setName} placeholder="Biznes nomi *" placeholderTextColor={colors.textMuted} autoFocus />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={username} onChangeText={setUsername} placeholder="Egasi (username) *" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={password} onChangeText={setPassword} placeholder="Parol *" placeholderTextColor={colors.textMuted} secureTextEntry />
            {err ? <Text style={{ color: colors.error, fontSize: 12, marginBottom: 8 }}>{err}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}><Text style={{ color: colors.text }}>Bekor</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={save} disabled={busy}><Text style={{ color: '#fff', fontWeight: '600' }}>{busy ? 'Yaratilmoqda...' : 'Yaratish'}</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 12, paddingBottom: 80 },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  accName:    { fontSize: 14, fontWeight: '600' },
  accMeta:    { fontSize: 12, marginTop: 2 },
  blockBtn:   { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  fab:        { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabIcon:    { color: '#fff', fontSize: 28, lineHeight: 32 },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  formBox:    { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  formTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input:      { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  cancelBtn:  { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:    { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
