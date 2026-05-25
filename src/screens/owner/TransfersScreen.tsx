// Tovar transferi — transfer products between shops.

import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { ShopApi, TransferApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDate, usd } from '../../lib/format';
import { Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

export default function TransfersScreen() {
  const colors = useColors();
  const [modal, setModal] = useState<null | 'add'>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, reload } = useApi(() => TransferApi.list(), [refreshKey]);
  const transfers: any[] = (data as any) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <CardHeader title="Transferlar" hint={`${transfers.length} ta`} />
          <Loader loading={loading} error={error} onRetry={reload}>
            {transfers.length === 0 ? (
              <EmptyState icon="🔄" text="Transfer yo'q" />
            ) : (
              transfers.map((t: any, idx: number) => (
                <View key={t.id} style={[styles.row, idx < transfers.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{t.productName}</Text>
                    <Text style={[styles.meta, { color: colors.textMuted }]}>
                      {t.fromShopName} → {t.toShopName}
                    </Text>
                    <Text style={[styles.meta, { color: colors.textMuted }]}>{formatDate(t.date)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.qty, { color: colors.text }]}>{t.quantity} dona</Text>
                    {t.costPerUnit && <Text style={[{ fontSize: 12, color: colors.textMuted }]}>{usd(t.costPerUnit)}/dona</Text>}
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

      {modal === 'add' && (
        <AddTransferModal onClose={() => setModal(null)} onSaved={() => { setModal(null); setRefreshKey((k) => k + 1); }} />
      )}
    </View>
  );
}

function AddTransferModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const colors = useColors();
  const { data: shopsData } = useApi(() => ShopApi.list(), []);
  const shops: any[] = (shopsData as any) ?? [];

  const [productId, setProductId] = useState('');
  const [fromShopId, setFromShopId] = useState('');
  const [toShopId, setToShopId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!productId || !fromShopId || !toShopId || !quantity) { setErr("Barcha maydonlarni to'ldiring"); return; }
    if (fromShopId === toShopId) { setErr("Bir xil do'konni tanlash mumkin emas"); return; }
    setBusy(true);
    try {
      await TransferApi.create({ productId: Number(productId), fromShopId: Number(fromShopId), toShopId: Number(toShopId), quantity: Number(quantity) });
      onSaved();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Yangi transfer</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={productId} onChangeText={setProductId} placeholder="Mahsulot ID *" placeholderTextColor={colors.textMuted} keyboardType="numeric" autoFocus />
            <Text style={[{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }]}>Qayerdan:</Text>
            {shops.map((s: any) => (
              <TouchableOpacity key={s.id} style={[styles.shopBtn, fromShopId === String(s.id) && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setFromShopId(String(s.id))}>
                <Text style={{ color: fromShopId === String(s.id) ? '#fff' : colors.text, fontSize: 13 }}>{s.name}</Text>
              </TouchableOpacity>
            ))}
            <Text style={[{ color: colors.textMuted, fontSize: 12, marginBottom: 6, marginTop: 10 }]}>Qayerga:</Text>
            {shops.map((s: any) => (
              <TouchableOpacity key={s.id} style={[styles.shopBtn, toShopId === String(s.id) && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setToShopId(String(s.id))}>
                <Text style={{ color: toShopId === String(s.id) ? '#fff' : colors.text, fontSize: 13 }}>{s.name}</Text>
              </TouchableOpacity>
            ))}
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text, marginTop: 10 }]} value={quantity} onChangeText={setQuantity} placeholder="Miqdor *" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
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
  name:       { fontSize: 14, fontWeight: '600' },
  meta:       { fontSize: 12, marginTop: 2 },
  qty:        { fontSize: 15, fontWeight: '700' },
  fab:        { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabIcon:    { color: '#fff', fontSize: 28, lineHeight: 32 },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  formBox:    { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  formTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input:      { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  shopBtn:    { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6 },
  cancelBtn:  { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:    { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
