// Buyurtmalar (Orders) — pending and completed orders.

import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { OrderApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDate, todayIso, usd } from '../../lib/format';
import { Badge, Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

export default function OrdersScreen() {
  const colors = useColors();
  const [modal, setModal] = useState<null | 'add' | { type: 'edit'; item: any } | { type: 'delete'; item: any }>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, reload } = useApi(() => OrderApi.grouped(), [refreshKey]);
  const grouped: any = data ?? {};

  const today    = grouped.today    ?? [];
  const tomorrow = grouped.tomorrow ?? [];
  const overdue  = grouped.overdue  ?? [];
  const upcoming = grouped.upcoming ?? [];
  const done     = grouped.completed ?? [];

  const handleComplete = async (item: any) => {
    try {
      await OrderApi.complete(item.id, {});
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      Alert.alert('Xatolik', err.message);
    }
  };

  const handleDelete = async (item: any) => {
    try {
      await OrderApi.remove(item.id);
      setModal(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      Alert.alert('Xatolik', err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Loader loading={loading} error={error} onRetry={reload}>
          <>
            {overdue.length > 0 && <OrderGroup title="Kelmagan (kechikkan)" orders={overdue} badgeVariant="red" onComplete={handleComplete} onDelete={(item: any) => setModal({ type: 'delete', item })} />}
            {today.length > 0 && <OrderGroup title="Bugun keladi" orders={today} badgeVariant="amber" onComplete={handleComplete} onDelete={(item: any) => setModal({ type: 'delete', item })} />}
            {tomorrow.length > 0 && <OrderGroup title="Ertaga keladi" orders={tomorrow} badgeVariant="blue" onComplete={handleComplete} onDelete={(item: any) => setModal({ type: 'delete', item })} />}
            {upcoming.length > 0 && <OrderGroup title="Kutilmoqda" orders={upcoming} badgeVariant="gray" onComplete={handleComplete} onDelete={(item: any) => setModal({ type: 'delete', item })} />}
            {done.length > 0 && <OrderGroup title="Tugallangan" orders={done} badgeVariant="green" onComplete={handleComplete} onDelete={(item: any) => setModal({ type: 'delete', item })} />}
            {today.length === 0 && tomorrow.length === 0 && overdue.length === 0 && upcoming.length === 0 && done.length === 0 && (
              <EmptyState icon="📋" text="Hozircha buyurtma yo'q" />
            )}
          </>
        </Loader>
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModal('add')} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {modal === 'add' && (
        <OrderFormModal
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setRefreshKey((k) => k + 1); }}
        />
      )}

      {typeof modal === 'object' && modal?.type === 'delete' && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setModal(null)}>
          <View style={styles.overlay}>
            <View style={[styles.confirmBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.confirmTitle, { color: colors.text }]}>Buyurtmani o'chirish</Text>
              <Text style={[{ color: colors.textMuted, marginBottom: 20 }]}>Bu buyurtmani o'chirmoqchimisiz?</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setModal(null)}><Text style={{ color: colors.text }}>Bekor</Text></TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(modal.item)}><Text style={{ color: '#fff', fontWeight: '600' }}>O'chirish</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function OrderGroup({ title, orders, badgeVariant, onComplete, onDelete }: any) {
  const colors = useColors();
  return (
    <Card>
      <CardHeader title={title} hint={`${orders.length} ta`} />
      {orders.map((o: any, idx: number) => (
        <View key={o.id} style={[styles.orderRow, idx < orders.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.orderName, { color: colors.text }]}>{o.name}</Text>
            <Text style={[styles.orderMeta, { color: colors.textMuted }]}>
              {o.supplier || ''}{o.deliveryDate ? ` · ${formatDate(o.deliveryDate)}` : ''}
              {o.amount ? ` · ${usd(o.amount)}` : ''}
            </Text>
            {o.note ? <Text style={[styles.orderNote, { color: colors.textMuted }]}>{o.note}</Text> : null}
          </View>
          <View style={{ gap: 6 }}>
            <Badge label={badgeVariant === 'green' ? 'Tugallangan' : "Kutilmoqda"} variant={badgeVariant} />
            {o.status !== 'DONE' && (
              <TouchableOpacity onPress={() => onComplete(o)} style={[styles.completeBtn, { backgroundColor: '#DCFCE7' }]}>
                <Text style={{ color: '#166534', fontSize: 11, fontWeight: '600' }}>✓ Qabul</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onDelete(o)}>
              <Text style={{ color: colors.error, fontSize: 11 }}>🗑 O'chir</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </Card>
  );
}

function OrderFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');
  const [delivery, setDelivery] = useState(todayIso());
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!name.trim()) { setErr('Buyurtma nomini kiriting'); return; }
    setBusy(true);
    try {
      await OrderApi.create({ name: name.trim(), supplier: supplier.trim() || null, amount: amount ? Number(amount) : null, deliveryDate: delivery, note: note.trim() || null });
      onSaved();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Yangi buyurtma</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={name} onChangeText={setName} placeholder="Buyurtma nomi *" placeholderTextColor={colors.textMuted} autoFocus />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={supplier} onChangeText={setSupplier} placeholder="Yetkazib beruvchi" placeholderTextColor={colors.textMuted} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={amount} onChangeText={setAmount} placeholder="Summa (ixtiyoriy)" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={delivery} onChangeText={setDelivery} placeholder="Yetkazib berish sanasi (YYYY-MM-DD)" placeholderTextColor={colors.textMuted} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={note} onChangeText={setNote} placeholder="Izoh" placeholderTextColor={colors.textMuted} />
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
  container:    { padding: 12, paddingBottom: 80 },
  orderRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  orderName:    { fontSize: 14, fontWeight: '600' },
  orderMeta:    { fontSize: 12, marginTop: 2 },
  orderNote:    { fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  completeBtn:  { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  fab:          { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabIcon:      { color: '#fff', fontSize: 28, lineHeight: 32 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  formBox:      { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  formTitle:    { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input:        { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  cancelBtn:    { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:      { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confirmBox:   { width: 300, borderRadius: 16, padding: 20 },
  confirmTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  deleteBtn:    { flex: 1, height: 46, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
});
