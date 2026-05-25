// Menejment — sold goods analytics + summary.

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ManagementApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { shiftIso, todayIso, usd } from '../../lib/format';
import { Card, CardHeader, EmptyState, Loader, MetricCard, MetricGrid } from '../../components/ui';
import { useColors } from '../../theme/brand';

const PRESETS = [
  { label: 'Bugun',   from: () => todayIso(),  to: () => todayIso() },
  { label: '7 kun',   from: () => shiftIso(-6), to: () => todayIso() },
  { label: '30 kun',  from: () => shiftIso(-29), to: () => todayIso() },
] as const;

export default function ManagementScreen() {
  const colors = useColors();
  const [preset, setPreset] = useState(0);

  const from = PRESETS[preset].from();
  const to   = PRESETS[preset].to();

  const { data: summary, loading: sl, error: se, reload: sr } = useApi(() => ManagementApi.summary({ from, to }), [from, to]);
  const { data: goods, loading: gl, error: ge, reload: gr } = useApi(() => ManagementApi.soldGoods({ from, to }), [from, to]);

  const s: any = summary ?? {};
  const lines: any[] = (goods as any)?.lines ?? [];

  // Group sold goods by product name, sum quantity + revenue
  const grouped: Record<string, { name: string; qty: number; revenue: number }> = {};
  lines.forEach((line: any) => {
    const key = line.productName;
    if (!grouped[key]) grouped[key] = { name: key, qty: 0, revenue: 0 };
    grouped[key].qty += Number(line.quantity) || 0;
    grouped[key].revenue += Number(line.lineRevenue) || 0;
  });
  const topProducts = Object.values(grouped).sort((a, b) => b.revenue - a.revenue).slice(0, 20);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {/* Period selector */}
      <View style={styles.presetRow}>
        {PRESETS.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.presetBtn, i === preset && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setPreset(i)}
          >
            <Text style={{ color: i === preset ? '#fff' : colors.textMuted, fontWeight: '600', fontSize: 13 }}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary metrics */}
      <Loader loading={sl} error={se} onRetry={sr}>
        <MetricGrid>
          <MetricCard tone="green"  icon="💵" label="Jami tushum"    value={usd(s.totalRevenue)} />
          <MetricCard tone="blue"   icon="💰" label="Jami foyda"     value={usd(s.totalProfit)} />
          <MetricCard tone="red"    icon="🧾" label="Xarajat"        value={usd(s.totalExpense)} />
          <MetricCard tone="amber"  icon="📦" label="Sotilgan dona"  value={String(s.totalQuantity ?? 0)} />
        </MetricGrid>
      </Loader>

      {/* Top products */}
      <Card>
        <CardHeader title="Eng ko'p sotilgan mahsulotlar" hint={`${topProducts.length} ta`} />
        <Loader loading={gl} error={ge} onRetry={gr}>
          {topProducts.length === 0 ? (
            <EmptyState icon="📊" text="Bu davrda sotuv yo'q" />
          ) : (
            topProducts.map((p, idx) => (
              <View key={p.name} style={[styles.row, idx < topProducts.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <Text style={[styles.rank, { color: colors.textMuted }]}>{idx + 1}.</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.productMeta, { color: colors.textMuted }]}>{p.qty} dona</Text>
                </View>
                <Text style={[styles.revenue, { color: '#10B981' }]}>{usd(p.revenue)}</Text>
              </View>
            ))
          )}
        </Loader>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { padding: 12, paddingBottom: 32 },
  presetRow:   { flexDirection: 'row', gap: 8, marginBottom: 12 },
  presetBtn:   { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  rank:        { width: 24, fontSize: 13, fontWeight: '600' },
  productName: { fontSize: 14, fontWeight: '500' },
  productMeta: { fontSize: 11, marginTop: 1 },
  revenue:     { fontSize: 15, fontWeight: '700' },
});
