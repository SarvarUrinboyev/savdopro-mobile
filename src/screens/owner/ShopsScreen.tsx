// Do'konlar — shop list, add/edit/set main.

import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { ShopApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { Badge, Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

export default function ShopsScreen() {
  const colors = useColors();
  const [modal, setModal] = useState<null | 'add' | { type: 'edit'; item: any }>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, reload } = useApi(() => ShopApi.list(), [refreshKey]);
  const shops: any[] = (data as any) ?? [];

  const setMain = async (id: number) => {
    try {
      await ShopApi.setMain(id);
      setRefreshKey((k) => k + 1);
    } catch (err: any) { Alert.alert('Xatolik', err.message); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <CardHeader title="Do'konlar" hint={`${shops.length} ta`} />
          <Loader loading={loading} error={error} onRetry={reload}>
            {shops.length === 0 ? (
              <EmptyState icon="🏪" text="Do'kon yo'q" />
            ) : (
              shops.map((s: any, idx: number) => (
                <View key={s.id} style={[styles.row, idx < shops.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={[styles.shopIcon, { backgroundColor: colors.primary }]}>
                    <Text style={{ fontSize: 20 }}>🏪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.shopName, { color: colors.text }]}>{s.name}</Text>
                      {s.isMain && <Badge label="Asosiy" variant="green" />}
                    </View>
                    {s.address && <Text style={[styles.shopMeta, { color: colors.textMuted }]}>{s.address}</Text>}
                  </View>
                  <View style={{ gap: 6 }}>
                    {!s.isMain && (
                      <TouchableOpacity onPress={() => setMain(s.id)} style={[styles.actionBtn, { borderColor: colors.primary }]}>
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>Asosiy qil</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => setModal({ type: 'edit', item: s })} style={[styles.actionBtn, { borderColor: colors.border }]}>
                      <Text style={{ color: colors.text, fontSize: 11 }}>✏️ Tahrir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </Loader>
        </Card>
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModal('add')} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {(modal === 'add' || (typeof modal === 'object' && (modal as any)?.type === 'edit')) && (
        <ShopFormModal
          initial={typeof modal === 'object' ? (modal as any).item : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setRefreshKey((k) => k + 1); }}
        />
      )}
    </View>
  );
}

function ShopFormModal({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: () => void }) {
  const colors = useColors();
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!name.trim()) { setErr('Nom kiriting'); return; }
    setBusy(true);
    try {
      if (initial) {
        await ShopApi.update(initial.id, { name: name.trim(), address: address.trim() || null });
      } else {
        await ShopApi.create({ name: name.trim(), address: address.trim() || null });
      }
      onSaved();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>{initial ? "Do'konni tahrirlash" : "Yangi do'kon"}</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={name} onChangeText={setName} placeholder="Do'kon nomi *" placeholderTextColor={colors.textMuted} autoFocus />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={address} onChangeText={setAddress} placeholder="Manzil (ixtiyoriy)" placeholderTextColor={colors.textMuted} />
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
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  shopIcon:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF' },
  shopName:   { fontSize: 15, fontWeight: '600' },
  shopMeta:   { fontSize: 12, marginTop: 2 },
  actionBtn:  { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  fab:        { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabIcon:    { color: '#fff', fontSize: 28, lineHeight: 32 },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  formBox:    { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  formTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input:      { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  cancelBtn:  { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:    { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
