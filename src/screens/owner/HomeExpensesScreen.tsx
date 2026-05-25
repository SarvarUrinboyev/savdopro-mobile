// Do'kon xarajatlari (Home/overhead expenses — general shop costs).

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { HomeExpenseApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { shiftIso, todayIso, usd } from '../../lib/format';
import { Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExpenseFormModal } from './ExpensesScreen';
import { formatDate } from '../../lib/format';

export default function HomeExpensesScreen() {
  const colors = useColors();
  const [modal, setModal] = useState<null | 'add'>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const from = shiftIso(-29);
  const to = todayIso();

  const { data, loading, error, reload } = useApi(() => HomeExpenseApi.list({ from, to }), [refreshKey]);
  const expenses: any[] = (data as any) ?? [];
  const total = expenses.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.totalBanner, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
          <Text style={{ color: '#991B1B', fontWeight: '700' }}>🏠 Jami (30 kun): {usd(total)}</Text>
        </View>
        <Card>
          <CardHeader title="Do'kon xarajatlari" hint={`${expenses.length} ta`} />
          <Loader loading={loading} error={error} onRetry={reload}>
            {expenses.length === 0 ? (
              <EmptyState icon="🏠" text="Bu davrda xarajat yo'q" />
            ) : (
              expenses.map((e: any, idx: number) => (
                <View key={e.id} style={[styles.row, idx < expenses.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{e.name}</Text>
                    <Text style={[styles.meta, { color: colors.textMuted }]}>{formatDate(e.date)}</Text>
                    {e.note ? <Text style={[styles.note, { color: colors.textMuted }]}>{e.note}</Text> : null}
                  </View>
                  <Text style={[styles.amount, { color: '#EF4444' }]}>−{usd(e.amount)}</Text>
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
        <ExpenseFormModal
          title="Yangi do'kon xarajati"
          onClose={() => setModal(null)}
          onSave={async (body) => { await HomeExpenseApi.create(body); setModal(null); setRefreshKey((k) => k + 1); }}
        />
      )}
    </View>
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
});
