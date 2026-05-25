// Qarz — "My debts" (shop owes someone) + "Customer debts" (customers owe shop).

import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { DebtApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDate, usd } from '../../lib/format';
import { Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

export default function DebtScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<'my' | 'cust'>('my');
  const [modal, setModal] = useState<null | 'add'>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: myData, loading: myLoading, reload: myReload } = useApi(() => DebtApi.myList(), [refreshKey]);
  const { data: custData, loading: custLoading, reload: custReload } = useApi(() => DebtApi.custList(), [refreshKey]);

  const myDebts: any[] = (myData as any) ?? [];
  const custDebts: any[] = (custData as any) ?? [];

  const myTotal = myDebts.reduce((s: number, d: any) => s + Number(d.remainingAmount ?? 0), 0);
  const custTotal = custDebts.reduce((s: number, d: any) => s + Number(d.remainingAmount ?? 0), 0);

  const handlePay = async (id: number, type: 'my' | 'cust', amount: number) => {
    try {
      if (type === 'my') {
        await DebtApi.myPay(id, { amount });
      } else {
        await DebtApi.custPay(id, { amount });
      }
      setRefreshKey((k) => k + 1);
    } catch (err: any) { Alert.alert('Xatolik', err.message); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Tab switch */}
      <View style={[styles.tabRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'my' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setTab('my')}>
          <Text style={[styles.tabLabel, { color: tab === 'my' ? colors.primary : colors.textMuted }]}>Mening qarzlarim</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'cust' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setTab('cust')}>
          <Text style={[styles.tabLabel, { color: tab === 'cust' ? colors.primary : colors.textMuted }]}>Mijozlar qarzi</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {tab === 'my' ? (
          <>
            <View style={[styles.totalBanner, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
              <Text style={{ color: '#991B1B', fontWeight: '700' }}>📒 Mening qarzim: {usd(myTotal)}</Text>
            </View>
            <Card>
              <CardHeader title="Mening qarzlarim" hint={`${myDebts.length} ta`} />
              <Loader loading={myLoading} error={null} onRetry={myReload}>
                {myDebts.length === 0 ? (
                  <EmptyState icon="✅" text="Qarz yo'q" />
                ) : (
                  myDebts.map((d: any, idx: number) => (
                    <DebtRow key={d.id} d={d} idx={idx} total={myDebts.length} onPay={(amt: number) => handlePay(d.id, 'my', amt)} colors={colors} />
                  ))
                )}
              </Loader>
            </Card>
          </>
        ) : (
          <>
            <View style={[styles.totalBanner, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
              <Text style={{ color: '#991B1B', fontWeight: '700' }}>📒 Mijozlar qarzi: {usd(custTotal)}</Text>
            </View>
            <Card>
              <CardHeader title="Mijozlar qarzi" hint={`${custDebts.length} ta`} />
              <Loader loading={custLoading} error={null} onRetry={custReload}>
                {custDebts.length === 0 ? (
                  <EmptyState icon="✅" text="Mijoz qarzi yo'q" />
                ) : (
                  custDebts.map((d: any, idx: number) => (
                    <DebtRow key={d.id} d={d} idx={idx} total={custDebts.length} onPay={(amt: number) => handlePay(d.id, 'cust', amt)} colors={colors} />
                  ))
                )}
              </Loader>
            </Card>
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModal('add')} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {modal === 'add' && (
        <AddDebtModal
          type={tab}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setRefreshKey((k) => k + 1); }}
        />
      )}
    </View>
  );
}

function DebtRow({ d, idx, total, onPay, colors }: any) {
  const [paying, setPaying] = useState(false);
  const [payAmt, setPayAmt] = useState('');
  return (
    <View style={[styles.row, idx < total - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.debtName, { color: colors.text }]}>{d.name || d.creditor || '—'}</Text>
        <Text style={[styles.debtMeta, { color: colors.textMuted }]}>
          {formatDate(d.date)}{d.note ? ` · ${d.note}` : ''}
        </Text>
        {paying && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TextInput style={[styles.payInput, { borderColor: colors.border, color: colors.text }]} value={payAmt} onChangeText={setPayAmt} keyboardType="numeric" placeholder="Summa" placeholderTextColor={colors.textMuted} autoFocus />
            <TouchableOpacity onPress={() => { if (payAmt) { onPay(Number(payAmt)); setPaying(false); setPayAmt(''); } }} style={[styles.payBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>To'la</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPaying(false)} style={[styles.payBtn, { borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={{ color: colors.text, fontSize: 12 }}>Bekor</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={[styles.debtAmt, { color: '#EF4444' }]}>{usd(d.remainingAmount)}</Text>
        {!paying && (
          <TouchableOpacity onPress={() => setPaying(true)} style={[styles.payBtnSmall, { borderColor: colors.primary }]}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>To'lash</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function AddDebtModal({ type, onClose, onSaved }: { type: 'my' | 'cust'; onClose: () => void; onSaved: () => void }) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!name.trim()) { setErr('Nom kiriting'); return; }
    if (!amount || Number(amount) <= 0) { setErr("Summa musbat bo'lishi kerak"); return; }
    setBusy(true);
    try {
      if (type === 'my') {
        await DebtApi.myCreate({ creditor: name.trim(), amount: Number(amount), note: note.trim() || null });
      } else {
        await DebtApi.custCreate({ name: name.trim(), amount: Number(amount), note: note.trim() || null });
      }
      onSaved();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>{type === 'my' ? 'Mening yangi qarzim' : 'Mijoz qarzi'}</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={name} onChangeText={setName} placeholder={type === 'my' ? 'Kim oldida qarz (kreditor)' : 'Mijoz ismi'} placeholderTextColor={colors.textMuted} autoFocus />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={amount} onChangeText={setAmount} placeholder="Summa (USD) *" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
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
  tabRow:      { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn:      { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabLabel:    { fontSize: 14, fontWeight: '600' },
  totalBanner: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12 },
  row:         { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  debtName:    { fontSize: 14, fontWeight: '600' },
  debtMeta:    { fontSize: 12, marginTop: 2 },
  debtAmt:     { fontSize: 15, fontWeight: '700' },
  payInput:    { flex: 1, height: 36, borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, fontSize: 14 },
  payBtn:      { height: 36, borderRadius: 6, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  payBtnSmall: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  fab:         { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabIcon:     { color: '#fff', fontSize: 28, lineHeight: 32 },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  formBox:     { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  formTitle:   { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input:       { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  cancelBtn:   { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:     { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
