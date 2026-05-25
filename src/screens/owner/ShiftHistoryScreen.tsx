// Smena tarixi (Shift history) — open/close shift + history list.

import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { ShiftApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDate, formatDateTime, formatDuration, usd } from '../../lib/format';
import { Badge, Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

export default function ShiftHistoryScreen() {
  const colors = useColors();
  const [openModal, setOpenModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: current, loading: cl, reload: cr } = useApi(() => ShiftApi.current().catch(() => null), [refreshKey]);
  const { data: history, loading: hl, error: he, reload: hr } = useApi(() => ShiftApi.history(), [refreshKey]);

  const shifts: any[] = (history as any) ?? [];
  const activeShift: any = current;

  const closeShift = async () => {
    Alert.alert('Smenani yopish', 'Joriy smenani yopmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      {
        text: 'Yopish',
        style: 'destructive',
        onPress: async () => {
          try {
            await ShiftApi.close();
            setRefreshKey((k) => k + 1);
          } catch (err: any) { Alert.alert('Xatolik', err.message); }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Active shift card */}
        <Loader loading={cl} error={null} onRetry={cr}>
          {activeShift ? (
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Badge label="Ochiq smena" variant="green" />
                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: '#EF4444' }]} onPress={closeShift}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Smenani yopish</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.shiftInfo, { color: colors.text }]}>Ochildi: {formatDateTime(activeShift.openedAt)}</Text>
              {activeShift.openingCash != null && (
                <Text style={[styles.shiftInfo, { color: colors.textMuted }]}>Boshlang'ich balans: {usd(activeShift.openingCash)}</Text>
              )}
            </Card>
          ) : (
            <TouchableOpacity
              style={[styles.openBtn, { backgroundColor: colors.primary }]}
              onPress={() => setOpenModal(true)}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>+ Yangi smena ochish</Text>
            </TouchableOpacity>
          )}
        </Loader>

        {/* History */}
        <Card>
          <CardHeader title="Smena tarixi" hint={`${shifts.length} ta`} />
          <Loader loading={hl} error={he} onRetry={hr}>
            {shifts.length === 0 ? (
              <EmptyState icon="🕐" text="Smena tarixi yo'q" />
            ) : (
              shifts.map((s: any, idx: number) => (
                <View key={s.id} style={[styles.row, idx < shifts.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.shiftDate, { color: colors.text }]}>{formatDate(s.openedAt)}</Text>
                    <Text style={[styles.shiftMeta, { color: colors.textMuted }]}>
                      {formatDateTime(s.openedAt)} – {s.closedAt ? formatDateTime(s.closedAt) : 'Hali ochiq'}
                    </Text>
                    {s.durationMinutes && (
                      <Text style={[styles.shiftMeta, { color: colors.textMuted }]}>{formatDuration(s.durationMinutes)}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {s.totalRevenue != null && (
                      <Text style={[styles.revenue, { color: '#10B981' }]}>{usd(s.totalRevenue)}</Text>
                    )}
                    <Badge label={s.closedAt ? 'Yopiq' : 'Ochiq'} variant={s.closedAt ? 'gray' : 'green'} />
                  </View>
                </View>
              ))
            )}
          </Loader>
        </Card>
      </ScrollView>

      {openModal && (
        <OpenShiftModal onClose={() => setOpenModal(false)} onOpened={() => { setOpenModal(false); setRefreshKey((k) => k + 1); }} />
      )}
    </View>
  );
}

function OpenShiftModal({ onClose, onOpened }: { onClose: () => void; onOpened: () => void }) {
  const colors = useColors();
  const [cash, setCash] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const open = async () => {
    setBusy(true);
    try {
      await ShiftApi.open({ openingCash: cash ? Number(cash) : 0 });
      onOpened();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={[styles.formBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Yangi smena ochish</Text>
            <Text style={[{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }]}>Boshlang'ich balans (USD)</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={cash} onChangeText={setCash} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} autoFocus />
            {err ? <Text style={{ color: colors.error, fontSize: 12, marginBottom: 8 }}>{err}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}><Text style={{ color: colors.text }}>Bekor</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={open} disabled={busy}><Text style={{ color: '#fff', fontWeight: '600' }}>{busy ? 'Ochilmoqda...' : 'Smenani ochish'}</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 12, paddingBottom: 32 },
  openBtn:    { borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  closeBtn:   { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  shiftInfo:  { fontSize: 14, marginBottom: 4 },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  shiftDate:  { fontSize: 14, fontWeight: '600' },
  shiftMeta:  { fontSize: 12, marginTop: 2 },
  revenue:    { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  formBox:    { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  formTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input:      { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  cancelBtn:  { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:    { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
