// Customer detail — transactions, balance, ledger history.

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
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDate, formatMoney, usd } from '../../lib/format';
import { Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';
import type { OwnerStackParamList } from '../../navigation/OwnerStack';

type Props = NativeStackScreenProps<OwnerStackParamList, 'CustomerDetail'>;

export default function CustomerDetailScreen({ route }: Props) {
  const colors = useColors();
  const { id } = route.params;
  const [modal, setModal] = useState<null | 'add'>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, reload } = useApi(() => CustomerApi.detail(id), [id, refreshKey]);
  const customer: any = data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Loader loading={loading} error={error} onRetry={reload}>
          {customer && (
            <>
              {/* Customer info card */}
              <Card style={{ padding: 16 }}>
                <View style={styles.headerRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.custName, { color: colors.text }]}>{customer.name}</Text>
                    {customer.phone && <Text style={[styles.custPhone, { color: colors.textMuted }]}>{customer.phone}</Text>}
                  </View>
                </View>
                <View style={styles.balanceRow}>
                  <View style={[styles.balanceCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                    <Text style={{ color: '#991B1B', fontSize: 11, fontWeight: '600' }}>QARZ BALANSI</Text>
                    <Text style={{ color: '#991B1B', fontSize: 20, fontWeight: '700' }}>{usd(customer.balance)}</Text>
                  </View>
                  {customer.loyaltyPoints > 0 && (
                    <View style={[styles.balanceCard, { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }]}>
                      <Text style={{ color: '#92400E', fontSize: 11, fontWeight: '600' }}>BONUS BALLLAR</Text>
                      <Text style={{ color: '#92400E', fontSize: 20, fontWeight: '700' }}>{customer.loyaltyPoints}</Text>
                    </View>
                  )}
                </View>
              </Card>

              {/* Transactions */}
              <Card>
                <CardHeader title="Tranzaksiyalar" hint={`${customer.transactions?.length ?? 0} ta`} />
                {!customer.transactions?.length ? (
                  <EmptyState icon="💳" text="Tranzaksiya yo'q" />
                ) : (
                  customer.transactions.map((tx: any, idx: number) => {
                    const isDebt = tx.type === 'DEBT';
                    return (
                      <View key={tx.id} style={[styles.txRow, idx < customer.transactions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <View style={[styles.txDot, { backgroundColor: isDebt ? '#EF4444' : '#10B981' }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.txDesc, { color: colors.text }]}>{tx.description || (isDebt ? 'Qarz' : "To'lov")}</Text>
                          <Text style={[styles.txDate, { color: colors.textMuted }]}>{formatDate(tx.date)}</Text>
                        </View>
                        <Text style={[styles.txAmt, { color: isDebt ? '#EF4444' : '#10B981' }]}>
                          {isDebt ? '+' : '−'}{formatMoney(tx.amount, tx.currency)}
                        </Text>
                      </View>
                    );
                  })
                )}
              </Card>
            </>
          )}
        </Loader>
      </ScrollView>

      {/* FAB: Add transaction */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModal('add')} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {modal === 'add' && (
        <AddTxModal
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setRefreshKey((k) => k + 1); }}
          customerId={id}
        />
      )}
    </View>
  );
}

function AddTxModal({ customerId, onClose, onSaved }: { customerId: number; onClose: () => void; onSaved: () => void }) {
  const colors = useColors();
  const [type, setType] = useState<'DEBT' | 'PAYMENT'>('DEBT');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!amount || Number(amount) <= 0) { setErr("Summa musbat bo'lishi kerak"); return; }
    setBusy(true);
    try {
      await CustomerApi.addTransaction(customerId, { type, amount: Number(amount), currency, description: desc.trim() || null });
      onSaved();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Tranzaksiya qo'shish</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggleBtn, type === 'DEBT' && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]} onPress={() => setType('DEBT')}>
                <Text style={{ color: type === 'DEBT' ? '#991B1B' : colors.textMuted, fontWeight: '600' }}>+ Qarz</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, type === 'PAYMENT' && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]} onPress={() => setType('PAYMENT')}>
                <Text style={{ color: type === 'PAYMENT' ? '#166534' : colors.textMuted, fontWeight: '600' }}>− To'lov</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              {['USD', 'UZS'].map((c) => (
                <TouchableOpacity key={c} style={[styles.toggleBtn, { flex: 1 }, currency === c && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setCurrency(c)}>
                  <Text style={{ color: currency === c ? '#fff' : colors.textMuted, fontWeight: '600' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="Summa *" placeholderTextColor={colors.textMuted} autoFocus />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={desc} onChangeText={setDesc} placeholder="Izoh (ixtiyoriy)" placeholderTextColor={colors.textMuted} />
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
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar:     { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  custName:   { fontSize: 18, fontWeight: '700' },
  custPhone:  { fontSize: 13, marginTop: 2 },
  balanceRow: { flexDirection: 'row', gap: 10 },
  balanceCard:{ flex: 1, borderRadius: 10, borderWidth: 1, padding: 12 },
  txRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  txDot:      { width: 8, height: 8, borderRadius: 4 },
  txDesc:     { fontSize: 14, fontWeight: '500' },
  txDate:     { fontSize: 11, marginTop: 1 },
  txAmt:      { fontSize: 15, fontWeight: '700' },
  fab:        { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabIcon:    { color: '#fff', fontSize: 28, lineHeight: 32 },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  formBox:    { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  formTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  toggleRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  toggleBtn:  { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  input:      { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  cancelBtn:  { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:    { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
