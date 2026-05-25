// Ombor (Warehouse) — product list with search, category filter, stock status.
// Port of desktop Warehouse.jsx.

import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CategoryApi, ProductApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { usd } from '../../lib/format';
import { Badge, Card, CardHeader, EmptyState, Loader, MetricCard, MetricGrid } from '../../components/ui';
import { useColors } from '../../theme/brand';
import type { OwnerStackParamList } from '../../navigation/OwnerStack';

type Nav = NativeStackNavigationProp<OwnerStackParamList>;

const STATUS_BADGE: Record<string, { label: string; variant: 'green' | 'amber' | 'red' }> = {
  IN_STOCK: { label: 'Mavjud',    variant: 'green' },
  LOW:      { label: 'Kam qoldi', variant: 'amber' },
  OUT:      { label: 'Tugagan',   variant: 'red' },
};

export default function WarehouseScreen() {
  const colors = useColors();
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, reload } = useApi(
    () => Promise.all([ProductApi.list(), CategoryApi.list()]),
    [refreshKey],
  );

  const products: any[] = data ? (data[0] as any) : [];
  const categories: any[] = data ? (data[1] as any) : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.barcode?.toLowerCase().includes(q))) return false;
      if (categoryId && String(p.categoryId) !== categoryId) return false;
      if (statusFilter && p.stockStatus !== statusFilter) return false;
      return true;
    });
  }, [products, search, categoryId, statusFilter]);

  const summary = useMemo(() => {
    let value = 0;
    let profit = 0;
    for (const p of products) {
      value += Number(p.stockValue ?? 0);
      profit += Number(p.margin ?? 0) * (p.quantity ?? 0);
    }
    return { count: products.length, value, profit };
  }, [products]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Loader loading={loading} error={error} onRetry={reload}>
          <>
            {/* Summary metrics */}
            <MetricGrid>
              <MetricCard tone="blue"  icon="📦" label="Jami mahsulot"  value={String(summary.count)} />
              <MetricCard tone="green" icon="💰" label="Ombor qiymati"  value={usd(summary.value)} />
              <MetricCard tone="amber" icon="📈" label="Taxminiy foyda" value={usd(summary.profit)} />
            </MetricGrid>

            {/* Filters */}
            <Card>
              <View style={styles.searchRow}>
                <TextInput
                  style={[styles.searchInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                  placeholder="Mahsulot yoki shtrix-kod qidirish..."
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <FilterChip label="Barchasi" active={!statusFilter} onPress={() => setStatusFilter('')} colors={colors} />
                <FilterChip label="Mavjud"    active={statusFilter === 'IN_STOCK'} onPress={() => setStatusFilter('IN_STOCK')} colors={colors} />
                <FilterChip label="Kam qoldi" active={statusFilter === 'LOW'}      onPress={() => setStatusFilter('LOW')} colors={colors} />
                <FilterChip label="Tugagan"   active={statusFilter === 'OUT'}      onPress={() => setStatusFilter('OUT')} colors={colors} />
              </ScrollView>
              {categories.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                  <FilterChip label="Barcha toifa" active={!categoryId} onPress={() => setCategoryId('')} colors={colors} />
                  {categories.map((c: any) => (
                    <FilterChip key={c.id} label={c.name} active={categoryId === String(c.id)} onPress={() => setCategoryId(String(c.id))} colors={colors} />
                  ))}
                </ScrollView>
              )}
            </Card>

            {/* Product list */}
            <Card>
              <CardHeader title="Mahsulotlar" hint={`${filtered.length} ta`} />
              {filtered.length === 0 ? (
                <EmptyState icon="📦" text="Mahsulot topilmadi" />
              ) : (
                filtered.map((p: any, idx: number) => {
                  const sb = STATUS_BADGE[p.stockStatus] ?? STATUS_BADGE.IN_STOCK;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.productRow, idx < filtered.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                      onPress={() => navigation.navigate('ProductEditor', { id: p.id })}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                        {p.barcode ? (
                          <Text style={[styles.productMeta, { color: colors.textMuted }]}>{p.barcode}</Text>
                        ) : null}
                      </View>
                      <View style={styles.productRight}>
                        <Badge label={sb.label} variant={sb.variant} />
                        <Text style={[styles.productQty, { color: colors.text }]}>{p.quantity ?? 0} dona</Text>
                        <Text style={[styles.productPrice, { color: colors.textMuted }]}>{usd(p.sellingPrice)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </Card>
          </>
        </Loader>
      </ScrollView>

      {/* FAB: Add new product */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('ProductEditor', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function FilterChip({ label, active, onPress, colors }: any) {
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 13, color: active ? '#fff' : colors.textMuted, fontWeight: active ? '600' : '400' }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 12, paddingBottom: 80 },
  searchRow:    { padding: 12 },
  searchInput:  { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  filterRow:    { paddingHorizontal: 12, paddingBottom: 10 },
  chip:         { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  productRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  productName:  { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  productMeta:  { fontSize: 12 },
  productRight: { alignItems: 'flex-end', gap: 4 },
  productQty:   { fontSize: 13, fontWeight: '600' },
  productPrice: { fontSize: 12 },
  fab:          { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  fabIcon:      { color: '#fff', fontSize: 28, lineHeight: 32 },
});
