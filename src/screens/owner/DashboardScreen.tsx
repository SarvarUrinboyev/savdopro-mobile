// Bosh sahifa — port of desktop Dashboard.jsx.
// Shows today's balance, expenses, revenue breakdown, top expenses,
// order status, and a 7-day sales activity feed.

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
import { BalanceApi, DashboardApi, ExchangeRateApi, ManagementApi, PaymentApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDate, formatTime, shiftIso, todayIso, usd } from '../../lib/format';
import { Card, CardHeader, EmptyState, Loader, MetricCard, MetricGrid } from '../../components/ui';
import { useColors } from '../../theme/brand';

export default function DashboardScreen() {
  const colors = useColors();
  const [editBalance, setEditBalance] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, reload } = useApi(
    () => Promise.all([DashboardApi.today(), ExchangeRateApi.get()]),
    [refreshKey],
  );

  const dashboard = data ? (data[0] as any) : null;
  const rate = data ? (data[1] as any) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={undefined}
    >
      <Loader loading={loading} error={error} onRetry={reload}>
        {dashboard && (
          <>
            {/* Exchange rate banner */}
            {rate?.available && (
              <View style={[styles.rateBanner, { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' }]}>
                <Text style={{ color: '#1E40AF', fontWeight: '600' }}>
                  💵 1 USD = {Math.round(Number(rate.rate)).toLocaleString()} so'm
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 11 }}>Markaziy bank · {formatDate(rate.date)}</Text>
              </View>
            )}

            {/* Balance hero */}
            <Card style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View>
                  <Text style={[styles.heroLabel, { color: colors.textMuted }]}>ERTALABGI BALANS</Text>
                  <Text style={[styles.heroValue, { color: colors.text }]}>{usd(dashboard.startingCash)}</Text>
                  <TouchableOpacity onPress={() => setEditBalance(true)} style={styles.editBtn}>
                    <Text style={{ color: colors.primary, fontSize: 13 }}>✏️ Tahrirlash</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.heroSide}>
                  <Text style={[styles.sideLabel, { color: colors.textMuted }]}>Taxminiy qoldiq</Text>
                  <Text style={[styles.sideValue, { color: colors.text }]}>{usd(dashboard.estimatedCash)}</Text>
                </View>
              </View>
            </Card>

            {/* Metrics */}
            <MetricGrid>
              <MetricCard tone="red"   icon="🧾" label="Bugungi xarajat"  value={usd(dashboard.todayExpenseTotal)} />
              <MetricCard tone="amber" icon="🏦" label="Kassadan"         value={usd(dashboard.todayKassa)} />
              <MetricCard tone="green" icon="💵" label="Naqddan"          value={usd(dashboard.todayNaqd)} />
              <MetricCard tone="blue"  icon="💳" label="Kartadan"         value={usd(dashboard.todayKarta)} />
              <MetricCard tone="red"   icon="📒" label="Umumiy qarz"      value={usd(dashboard.totalDebt)} />
            </MetricGrid>

            {/* Top Expenses */}
            <Card>
              <CardHeader title="Smenaning xarajatlari" hint="Eng katta" />
              <View style={{ padding: 14 }}>
                {dashboard.topExpenses?.length === 0 ? (
                  <EmptyState icon="🧾" text="Bugun hali xarajat kiritilmagan" />
                ) : (
                  dashboard.topExpenses?.map((e: any, i: number) => (
                    <View key={i} style={styles.expenseRow}>
                      <Text style={[styles.expenseName, { color: colors.text }]}>{e.name}</Text>
                      <Text style={[styles.expenseAmt, { color: colors.textMuted }]}>{usd(e.amount)}</Text>
                    </View>
                  ))
                )}
              </View>
            </Card>

            {/* Orders status */}
            <Card>
              <CardHeader title="Buyurtmalar holati" />
              <View style={{ padding: 14 }}>
                <OrderGroup title="Bugun keladi"  orders={dashboard.ordersToday}    dotColor="#EF4444" />
                <OrderGroup title="Ertaga keladi" orders={dashboard.ordersTomorrow} dotColor="#F59E0B" />
                <OrderGroup title="Kelmagan"       orders={dashboard.ordersOverdue}  dotColor="#EF4444" />
              </View>
            </Card>

            {/* Activity feed */}
            <ActivityFeedCard />
          </>
        )}
      </Loader>

      {/* Balance modal */}
      {editBalance && (
        <BalanceEditModal
          current={dashboard?.startingCash}
          onClose={() => setEditBalance(false)}
          onSaved={() => {
            setEditBalance(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </ScrollView>
  );
}

function OrderGroup({ title, orders, dotColor }: { title: string; orders: any[]; dotColor: string }) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.ogHeader}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[styles.ogTitle, { color: colors.textMuted }]}>{title}</Text>
        <Text style={[styles.ogCount, { color: colors.textMuted }]}>({orders?.length ?? 0})</Text>
      </View>
      {!orders?.length ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>Buyurtma yo'q</Text>
      ) : (
        orders.map((o: any) => (
          <View key={o.id} style={styles.orderRow}>
            <Text style={[styles.orderName, { color: colors.text }]}>{o.name}</Text>
            <Text style={[styles.orderDate, { color: colors.textMuted }]}>{formatDate(o.deliveryDate)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function ActivityFeedCard() {
  const colors = useColors();
  const today = todayIso();
  const { data, loading } = useApi(
    () => Promise.all([
      ManagementApi.soldGoods({ from: today, to: today }),
      PaymentApi.list({ from: today, to: today }),
    ]),
    [],
  );

  const items: any[] = [];
  if (data) {
    const [report, paymentResp] = data as any[];
    (report?.lines ?? []).forEach((line: any) => {
      items.push({
        kind: 'sale', time: line.soldAt,
        desc: line.quantity > 1 ? `${line.productName} × ${line.quantity}` : line.productName,
        amount: Number(line.lineRevenue) || 0,
      });
    });
    (paymentResp?.payments ?? []).forEach((p: any) => {
      items.push({
        kind: p.direction === 'INCOMING' ? 'in' : 'out',
        time: p.createdAt || `${p.date}T00:00:00`,
        desc: p.party || (p.direction === 'INCOMING' ? 'Kirim' : 'Chiqim'),
        amount: Number(p.amount) || 0,
      });
    });
    items.sort((a, b) => String(b.time).localeCompare(String(a.time)));
  }

  const top = items.slice(0, 8);

  return (
    <Card>
      <CardHeader title="Kassa operatsiyalari" hint="⚡ Bugun" />
      <View style={{ padding: 14 }}>
        {loading ? (
          <EmptyState icon="⏳" text="Yuklanmoqda..." />
        ) : top.length === 0 ? (
          <EmptyState icon="⚡" text="Bugun amaliyot yo'q" />
        ) : (
          top.map((it, i) => (
            <View key={i} style={styles.feedRow}>
              <View style={[styles.feedDot, {
                backgroundColor: it.kind === 'sale' ? '#10B981' : it.kind === 'in' ? '#3B82F6' : '#EF4444',
              }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedDesc, { color: colors.text }]} numberOfLines={1}>{it.desc}</Text>
                <Text style={[styles.feedTime, { color: colors.textMuted }]}>{formatTime(it.time)}</Text>
              </View>
              <Text style={[styles.feedAmt, { color: it.kind === 'out' ? '#EF4444' : '#10B981' }]}>
                {it.kind === 'out' ? '−' : '+'}{usd(it.amount)}
              </Text>
            </View>
          ))
        )}
      </View>
    </Card>
  );
}

function BalanceEditModal({ current, onClose, onSaved }: { current: any; onClose: () => void; onSaved: () => void }) {
  const colors = useColors();
  const [value, setValue] = useState(current != null ? String(current) : '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const amount = Number(value);
    if (value === '' || isNaN(amount) || amount < 0) {
      Alert.alert('Xatolik', "Balansni to'g'ri kiriting");
      return;
    }
    setBusy(true);
    try {
      await BalanceApi.set({ startingCash: amount });
      onSaved();
    } catch (err: any) {
      Alert.alert('Xatolik', err.message);
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Ertalabgi balansni tahrirlash</Text>
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Ertalabgi balans (USD)</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={onClose} style={[styles.modalCancel, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textMuted }}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} disabled={busy} style={[styles.modalSave, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{busy ? 'Saqlanmoqda...' : 'Saqlash'}</Text>
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
  rateBanner:   { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroCard:     { padding: 16 },
  heroRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  heroLabel:    { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  heroValue:    { fontSize: 26, fontWeight: '700' },
  editBtn:      { marginTop: 8 },
  heroSide:     { alignItems: 'flex-end' },
  sideLabel:    { fontSize: 11, marginBottom: 4 },
  sideValue:    { fontSize: 20, fontWeight: '700' },
  expenseRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  expenseName:  { fontSize: 14, fontWeight: '500', flex: 1 },
  expenseAmt:   { fontSize: 14, fontWeight: '600' },
  ogHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  ogTitle:      { fontSize: 12, fontWeight: '600', flex: 1 },
  ogCount:      { fontSize: 12 },
  empty:        { fontSize: 12, marginBottom: 8 },
  orderRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderName:    { fontSize: 13, fontWeight: '500' },
  orderDate:    { fontSize: 12 },
  feedRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  feedDot:      { width: 8, height: 8, borderRadius: 4 },
  feedDesc:     { fontSize: 13, fontWeight: '500' },
  feedTime:     { fontSize: 11 },
  feedAmt:      { fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalBox:     { width: 320, borderRadius: 16, padding: 20 },
  modalTitle:   { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  modalLabel:   { fontSize: 12, marginBottom: 6 },
  modalInput:   { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, marginBottom: 16 },
  modalBtns:    { flexDirection: 'row', gap: 10 },
  modalCancel:  { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalSave:    { flex: 1, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
