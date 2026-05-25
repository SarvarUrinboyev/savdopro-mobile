// Xarajatlar (Shift expenses).

import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { ExpenseApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDate, shiftIso, todayIso, usd } from '../../lib/format';
import { Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

export default function ExpensesScreen() {
  const colors = useColors();
  const [modal, setModal] = useState<null | 'add' | { type: 'delete'; item: any }>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const from = shiftIso(-29);
  const to = todayIso();

  const { data, loading, error, reload } = useApi(() => ExpenseApi.list({ from, to }), [refreshKey]);
  const expenses: any[] = (data as any) ?? [];

  const total = expenses.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);

  const handleDelete = async (item: any) => {
    try {
      await ExpenseApi.remove(item.id);
      setModal(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) { Alert.alert('Xatolik', err.message); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.totalBanner, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
          <Text style={{ color: '#991B1B', fontWeight: '700' }}>🧾 Jami (30 kun): {usd(total)}</Text>
        </View>
        <Card>
          <CardHeader title="Xarajatlar" hint={`${expenses.length} ta`} />
          <Loader loading={loading} error={error} onRetry={reload}>
            {expenses.length === 0 ? (
              <EmptyState icon="🧾" text="Bu davrda xarajat yo'q" />
            ) : (
              expenses.map((e: any, idx: number) => (
                <View key={e.id} style={[styles.row, idx < expenses.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{e.name}</Text>
                    <Text style={[styles.meta, { color: colors.textMuted }]}>{formatDate(e.date)}{e.category ? ` · ${e.category}` : ''}</Text>
                    {e.note ? <Text style={[styles.note, { color: colors.textMuted }]}>{e.note}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={[styles.amount, { color: '#EF4444' }]}>−{usd(e.amount)}</Text>
                    <TouchableOpacity onPress={() => setModal({ type: 'delete', item: e })}>
                      <Text style={{ color: colors.error, fontSize: 12 }}>🗑</Text>
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

      {modal === 'add' && <ExpenseFormModal title="Yangi xarajat" onClose={() => setModal(null)} onSave={async (body) => { await ExpenseApi.create(body); setModal(null); setRefreshKey((k) => k + 1); }} />}
      {typeof modal === 'object' && modal?.type === 'delete' && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setModal(null)}>
          <View style={styles.overlay}>
            <View style={[styles.confirmBox, { backgroundColor: colors.surface }]}>
              <Text style={[{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 8 }]}>O'chirish</Text>
              <Text style={[{ color: colors.textMuted, marginBottom: 20 }]}>Bu xarajatni o'chirmoqchimisiz?</Text>
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

export function ExpenseFormModal({ title, onClose, onSave }: { title: string; onClose: () => void; onSave: (body: any) => Promise<void> }) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!name.trim()) { setErr('Nom kiriting'); return; }
    if (!amount || Number(amount) <= 0) { setErr("Summa musbat bo'lishi kerak"); return; }
    setBusy(true);
    try {
      await onSave({ name: name.trim(), amount: Number(amount), date, note: note.trim() || null });
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>{title}</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={name} onChangeText={setName} placeholder="Xarajat nomi *" placeholderTextColor={colors.textMuted} autoFocus />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={amount} onChangeText={setAmount} placeholder="Summa (USD) *" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={date} onChangeText={setDate} placeholder="Sana (YYYY-MM-DD)" placeholderTextColor={colors.textMuted} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={note} onChangeText={setNote} placeholder="Izoh (ixtiyoriy)" placeholderTextColor={colors.textMuted} />
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
  container:   { padding: 12, paddingBottom: 80 },
  totalBanner: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12 },
  row:         { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  name:        { fontSize: 14, fontWeight: '600' },
  meta:        { fontSize: 12, marginTop: 2 },
  note:        { fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  amount:      { fontSize: 15, fontWeight: '700' },
  fab:         { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabIcon:     { color: '#fff', fontSize: 28, lineHeight: 32 },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  formBox:     { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  formTitle:   { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input:       { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  cancelBtn:   { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:     { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confirmBox:  { width: 300, borderRadius: 16, padding: 20 },
  deleteBtn:   { flex: 1, height: 46, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
});
