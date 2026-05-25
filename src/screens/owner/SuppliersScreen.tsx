// Yetkazib beruvchilar (Suppliers).

import { useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SupplierApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';
import type { OwnerStackParamList } from '../../navigation/OwnerStack';

type Nav = NativeStackNavigationProp<OwnerStackParamList>;

export default function SuppliersScreen() {
  const colors = useColors();
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<null | 'add'>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, reload } = useApi(() => SupplierApi.list(), [refreshKey]);
  const suppliers: any[] = (data as any) ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => s.name.toLowerCase().includes(q) || (s.phone && s.phone.toLowerCase().includes(q)));
  }, [suppliers, search]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <TextInput
          style={[styles.search, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
          placeholder="Qidirish..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <Card>
          <CardHeader title="Yetkazib beruvchilar" hint={`${filtered.length} ta`} />
          <Loader loading={loading} error={error} onRetry={reload}>
            {filtered.length === 0 ? (
              <EmptyState icon="🏭" text="Yetkazib beruvchi topilmadi" />
            ) : (
              filtered.map((s: any, idx: number) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.row, idx < filtered.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                  onPress={() => navigation.navigate('SupplierDetail', { id: s.id })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{s.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{s.name}</Text>
                    {s.phone && <Text style={[styles.phone, { color: colors.textMuted }]}>{s.phone}</Text>}
                    {s.address && <Text style={[styles.phone, { color: colors.textMuted }]}>{s.address}</Text>}
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </Loader>
        </Card>
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModal('add')} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {modal === 'add' && (
        <AddSupplierModal onClose={() => setModal(null)} onSaved={() => { setModal(null); setRefreshKey((k) => k + 1); }} />
      )}
    </View>
  );
}

function AddSupplierModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!name.trim()) { setErr('Ism kiriting'); return; }
    setBusy(true);
    try {
      await SupplierApi.create({ name: name.trim(), phone: phone.trim() || null, address: address.trim() || null });
      onSaved();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Yangi yetkazib beruvchi</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={name} onChangeText={setName} placeholder="Ism *" placeholderTextColor={colors.textMuted} autoFocus />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={phone} onChangeText={setPhone} placeholder="Telefon" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={address} onChangeText={setAddress} placeholder="Manzil" placeholderTextColor={colors.textMuted} />
            {err ? <Text style={{ color: colors.error, fontSize: 12, marginBottom: 8 }}>{err}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}><Text style={{ color: colors.text }}>Bekor</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={save} disabled={busy}><Text style={{ color: '#fff', fontWeight: '600' }}>{busy ? 'Saqlanmoqda...' : 'Saqlash'}</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 12, paddingBottom: 80 },
  search:     { height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, fontSize: 14, marginBottom: 12 },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  avatar:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  name:       { fontSize: 14, fontWeight: '600' },
  phone:      { fontSize: 12, marginTop: 1 },
  fab:        { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabIcon:    { color: '#fff', fontSize: 28, lineHeight: 32 },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  formBox:    { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  formTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input:      { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  cancelBtn:  { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:    { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
