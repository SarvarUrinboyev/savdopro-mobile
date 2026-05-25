// To'lov (Payments) — payment journal with INCOMING / OUTGOING entries.
// Port of desktop Payments.jsx.

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
import { CustomerApi, PaymentApi, SupplierApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDate, formatMoney, methodLabel, todayIso } from '../../lib/format';
import { Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

const CATEGORIES = [
  ['CUSTOMER', "Mijoz to'lovi"],
  ['SUPPLIER', 'Yetkazib beruvchiga'],
  ['SALARY', 'Ish haqi'],
  ['TAX', 'Soliq'],
  ['OTHER', 'Boshqa'],
] as const;

const QUICK_METHODS = [
  { key: 'UZS_CASH', label: "UZS (so'm)", method: 'NAQD', currency: 'UZS' },
  { key: 'USD_CASH', label: 'USD (dollar)', method: 'NAQD', currency: 'USD' },
  { key: 'P2P',      label: 'Karta (P2P)', method: 'P2P', currency: null },
  { key: 'TRANSFER', label: 'Transfer',    method: 'TRANSFER', currency: null },
] as const;

type QuickKey = typeof QUICK_METHODS[number]['key'];
type ModalState =
  | null
  | { type: 'add'; direction: 'INCOMING' | 'OUTGOING' }
  | { type: 'edit'; item: any }
  | { type: 'delete'; item: any };

// Preset: last 30 days
function defaultRange() {
  const to = todayIso();
  const d = new Date(); d.setDate(d.getDate() - 29);
  const from = d.toISOString().slice(0, 10);
  return { from, to };
}

export default function PaymentsScreen() {
  const colors = useColors();
  const [range] = useState(defaultRange);
  const [modal, setModal] = useState<ModalState>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, reload } = useApi(
    () => PaymentApi.list({ from: range.from, to: range.to }),
    [range.from, range.to, refreshKey],
  );

  const rows: any[] = (data as any)?.payments ?? [];

  const handleDelete = async () => {
    if (modal?.type !== 'delete') return;
    try {
      await PaymentApi.remove(modal.item.id);
      setModal(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      Alert.alert("Xatolik", err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Quick action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}
            onPress={() => setModal({ type: 'add', direction: 'INCOMING' })}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>📥</Text>
            <Text style={{ color: '#166534', fontWeight: '700', fontSize: 15 }}>Kirim</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
            onPress={() => setModal({ type: 'add', direction: 'OUTGOING' })}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>📤</Text>
            <Text style={{ color: '#991B1B', fontWeight: '700', fontSize: 15 }}>Chiqim</Text>
          </TouchableOpacity>
        </View>

        {/* Payment list */}
        <Card>
          <CardHeader title="To'lovlar jurnali" hint={`${rows.length} ta`} />
          <Loader loading={loading} error={error} onRetry={reload}>
            {rows.length === 0 ? (
              <EmptyState icon="💰" text="Bu davrda to'lov yozuvi yo'q" />
            ) : (
              rows.map((p: any, idx: number) => {
                const incoming = p.direction === 'INCOMING';
                return (
                  <View
                    key={`${p.source ?? 'PAYMENT'}-${p.id}`}
                    style={[styles.payRow, idx < rows.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                  >
                    <View style={[styles.dirBadge, { backgroundColor: incoming ? '#DCFCE7' : '#FEE2E2' }]}>
                      <Text style={{ fontSize: 16 }}>{incoming ? '📥' : '📤'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.payParty, { color: colors.text }]} numberOfLines={1}>
                        {p.party || (incoming ? 'Kirim' : 'Chiqim')}
                      </Text>
                      <Text style={[styles.payMeta, { color: colors.textMuted }]}>
                        {formatDate(p.date)} · {methodLabel(p.method, p.currency)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.payAmt, { color: incoming ? '#10B981' : '#EF4444' }]}>
                        {incoming ? '+' : '−'}{formatMoney(p.amount, p.currency)}
                      </Text>
                      {(p.source === 'PAYMENT' || !p.source) && (
                        <View style={styles.payActions}>
                          <TouchableOpacity onPress={() => setModal({ type: 'edit', item: p })}>
                            <Text style={{ color: colors.textMuted, fontSize: 12 }}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setModal({ type: 'delete', item: p })}>
                            <Text style={{ color: colors.error, fontSize: 12 }}>🗑</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </Loader>
        </Card>
      </ScrollView>

      {/* Payment form modal */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <PaymentFormModal
          initial={modal.type === 'edit' ? modal.item : null}
          presetDirection={modal.type === 'add' ? modal.direction : undefined}
          onSubmit={async (body) => {
            if (modal.type === 'add') {
              await PaymentApi.create(body);
            } else {
              await PaymentApi.update(modal.item.id, body);
            }
            setModal(null);
            setRefreshKey((k) => k + 1);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {modal?.type === 'delete' && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setModal(null)}>
          <View style={styles.overlay}>
            <View style={[styles.confirmBox, { backgroundColor: useColors().surface }]}>
              <Text style={[styles.confirmTitle, { color: useColors().text }]}>To'lovni o'chirish</Text>
              <Text style={[styles.confirmMsg, { color: useColors().textMuted }]}>Bu to'lov yozuvini o'chirmoqchimisiz?</Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: useColors().border }]} onPress={() => setModal(null)}>
                  <Text style={{ color: useColors().text }}>Bekor</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.deleteBtn]} onPress={handleDelete}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>O'chirish</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function PaymentFormModal({
  initial,
  presetDirection,
  onSubmit,
  onClose,
}: {
  initial: any;
  presetDirection?: 'INCOMING' | 'OUTGOING';
  onSubmit: (body: any) => Promise<void>;
  onClose: () => void;
}) {
  const colors = useColors();
  const [direction, setDirection] = useState<'INCOMING' | 'OUTGOING'>(initial?.direction ?? presetDirection ?? 'INCOMING');
  const [category, setCategory] = useState(initial?.category ?? 'CUSTOMER');
  const [party, setParty] = useState(initial?.party ?? '');
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '');
  const [quickKey, setQuickKey] = useState<QuickKey>('UZS_CASH');
  const [altCurrency, setAltCurrency] = useState(initial?.currency ?? 'UZS');
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const picked = QUICK_METHODS.find((q) => q.key === quickKey) ?? QUICK_METHODS[0];
  const method = picked.method;
  const currency = picked.currency ?? altCurrency;
  const isIncoming = direction === 'INCOMING';

  const submit = async () => {
    if (!amount || Number(amount) <= 0) { setError("Summa musbat bo'lishi kerak"); return; }
    setBusy(true);
    try {
      await onSubmit({ direction, category, method, currency, party: party.trim() || null, amount: Number(amount), date, note: note.trim() || null });
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>
              {initial ? "To'lovni tahrirlash" : isIncoming ? 'Yangi kirim' : 'Yangi chiqim'}
            </Text>

            {/* Direction toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggleBtn, isIncoming && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]} onPress={() => setDirection('INCOMING')}>
                <Text style={{ color: isIncoming ? '#166534' : colors.textMuted, fontWeight: '600' }}>📥 Kirim</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, !isIncoming && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]} onPress={() => setDirection('OUTGOING')}>
                <Text style={{ color: !isIncoming ? '#991B1B' : colors.textMuted, fontWeight: '600' }}>📤 Chiqim</Text>
              </TouchableOpacity>
            </View>

            {/* Payment method */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>To'lov usuli</Text>
            <View style={styles.methodRow}>
              {QUICK_METHODS.map((q) => (
                <TouchableOpacity
                  key={q.key}
                  style={[styles.methodBtn, quickKey === q.key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setQuickKey(q.key)}
                >
                  <Text style={[styles.methodLabel, { color: quickKey === q.key ? '#fff' : colors.textMuted }]}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>To'lov turi</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CATEGORIES.map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.catChip, category === key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setCategory(key)}
                >
                  <Text style={{ fontSize: 12, color: category === key ? '#fff' : colors.textMuted }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Party */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Kim (ixtiyoriy)</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={party} onChangeText={setParty} placeholder="Ism..." placeholderTextColor={colors.textMuted} />

            {/* Amount & date */}
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Summa</Text>
                <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Sana</Text>
                <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
              </View>
            </View>

            {/* Note */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Izoh (ixtiyoriy)</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={note} onChangeText={setNote} placeholder="Izoh..." placeholderTextColor={colors.textMuted} />

            {error ? <Text style={{ color: colors.error, fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}

            <View style={styles.formBtns}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose} disabled={busy}>
                <Text style={{ color: colors.text }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: isIncoming ? '#10B981' : '#EF4444' }]} onPress={submit} disabled={busy}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{busy ? 'Saqlanmoqda...' : isIncoming ? 'Kirim qo\'shish' : 'Chiqim qo\'shish'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 12, paddingBottom: 32 },
  actionRow:    { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 16 },
  payRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  dirBadge:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  payParty:     { fontSize: 14, fontWeight: '500' },
  payMeta:      { fontSize: 11, marginTop: 2 },
  payAmt:       { fontSize: 15, fontWeight: '700' },
  payActions:   { flexDirection: 'row', gap: 8, marginTop: 4 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  formBox:      { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  formTitle:    { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  fieldLabel:   { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  input:        { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  toggleRow:    { flexDirection: 'row', gap: 10, marginBottom: 14 },
  toggleBtn:    { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  methodRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  methodBtn:    { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  methodLabel:  { fontSize: 12, fontWeight: '500' },
  catChip:      { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  row2:         { flexDirection: 'row', gap: 10 },
  formBtns:     { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:    { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deleteBtn:    { flex: 1, height: 46, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  submitBtn:    { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confirmBox:   { width: 300, borderRadius: 16, padding: 20 },
  confirmTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  confirmMsg:   { fontSize: 14, marginBottom: 20 },
  confirmBtns:  { flexDirection: 'row', gap: 10 },
});
