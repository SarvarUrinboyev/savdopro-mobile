// Bugungi va tarixiy sotuvlar ro'yxati.

import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TerminalApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatTime, formatDateTime, usd } from '../../lib/format';
import { EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Naqd',
  P2P: 'Karta',
  DEBT: 'Qarz',
  TRANSFER: "O'tkazma",
  NAQD: 'Naqd',
  KARTA: 'Karta',
};

const METHOD_COLOR: Record<string, string> = {
  CASH: '#10B981',
  NAQD: '#10B981',
  P2P: '#3B82F6',
  KARTA: '#3B82F6',
  DEBT: '#F59E0B',
  TRANSFER: '#8B5CF6',
};

export default function SalesScreen() {
  const colors = useColors();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, reload } = useApi(
    () => TerminalApi.today(),
    [refreshKey],
  );

  // Reverse so newest is at top
  const sales: any[] = Array.isArray(data)
    ? [...(data as any[])].reverse()
    : [];

  const totalRevenue = sales.reduce(
    (sum, s) => sum + Number(s.totalAmount ?? 0),
    0,
  );
  const cashSales = sales.reduce(
    (sum, s) =>
      s.paymentMethod === 'CASH' || s.paymentMethod === 'NAQD'
        ? sum + Number(s.totalAmount ?? 0)
        : sum,
    0,
  );
  const cardSales = sales.reduce(
    (sum, s) =>
      s.paymentMethod === 'P2P' || s.paymentMethod === 'KARTA'
        ? sum + Number(s.totalAmount ?? 0)
        : sum,
    0,
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isOpen = expanded === index;
    const methodColor =
      METHOD_COLOR[item.paymentMethod] ?? colors.textMuted;

    return (
      <TouchableOpacity
        style={[styles.saleRow, { borderBottomColor: colors.border }]}
        onPress={() => setExpanded(isOpen ? null : index)}
        activeOpacity={0.75}
      >
        {/* Left: time + method badge */}
        <View
          style={[
            styles.timeBadge,
            { backgroundColor: methodColor + '18' },
          ]}
        >
          <Text style={[styles.timeBig, { color: methodColor }]}>
            {formatTime(item.createdAt) || '--:--'}
          </Text>
          <Text style={[styles.timeSub, { color: methodColor }]}>
            {METHOD_LABEL[item.paymentMethod] ?? item.paymentMethod}
          </Text>
        </View>

        {/* Middle: customer + items preview */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          {item.customerName ? (
            <Text
              style={[styles.custName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.customerName}
            </Text>
          ) : null}
          <Text style={[styles.itemsPreview, { color: colors.textMuted }]}>
            {Array.isArray(item.items)
              ? item.items.length + ' ta mahsulot'
              : 'Savdo'}
          </Text>

          {/* Expanded: items list */}
          {isOpen && Array.isArray(item.items) && (
            <View style={{ marginTop: 8 }}>
              {item.items.map((it: any, i: number) => (
                <View key={i} style={styles.itemLine}>
                  <Text
                    style={[styles.itemLineName, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {it.productName ?? it.name} × {it.quantity}
                  </Text>
                  <Text style={[styles.itemLineAmt, { color: colors.text }]}>
                    {usd(
                      Number(it.sellingPrice ?? it.price) * Number(it.quantity),
                    )}
                  </Text>
                </View>
              ))}
              {Number(item.discountUsd) > 0 && (
                <Text
                  style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}
                >
                  Chegirma: -{usd(item.discountUsd)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Right: amount + chevron */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amount, { color: methodColor }]}>
            {usd(item.totalAmount)}
          </Text>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.textMuted}
            style={{ marginTop: 4 }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Summary header */}
      {sales.length > 0 && (
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.summaryMain}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              Bugun jami
            </Text>
            <Text style={[styles.summaryTotal, { color: '#10B981' }]}>
              {usd(totalRevenue)}
            </Text>
            <Text style={[styles.summarySub, { color: colors.textMuted }]}>
              {sales.length} ta savdo
            </Text>
          </View>
          <View style={styles.summaryDetails}>
            <View style={styles.summaryChip}>
              <Ionicons name="cash-outline" size={14} color="#10B981" />
              <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                {usd(cashSales)}
              </Text>
            </View>
            <View style={styles.summaryChip}>
              <Ionicons name="card-outline" size={14} color="#3B82F6" />
              <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                {usd(cardSales)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Refresh button */}
      <TouchableOpacity
        style={[styles.refreshBtn, { borderBottomColor: colors.border }]}
        onPress={() => setRefreshKey((k) => k + 1)}
      >
        <Ionicons name="refresh-outline" size={16} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontSize: 13, marginLeft: 6 }}>
          Yangilash
        </Text>
      </TouchableOpacity>

      <Loader loading={loading} error={error} onRetry={reload}>
        <FlatList
          data={sales}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState icon="💳" text="Bugun savdo yo'q" />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </Loader>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  summaryCard: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryMain: { flex: 1 },
  summaryLabel: { fontSize: 12 },
  summaryTotal: { fontSize: 28, fontWeight: '800', marginTop: 2 },
  summarySub: { fontSize: 12, marginTop: 2 },
  summaryDetails: { alignItems: 'flex-end', gap: 6 },
  summaryChip: { flexDirection: 'row', alignItems: 'center' },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  timeBadge: {
    width: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  timeBig: { fontSize: 13, fontWeight: '700' },
  timeSub: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  custName: { fontSize: 13, fontWeight: '600' },
  itemsPreview: { fontSize: 12, marginTop: 2 },
  itemLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  itemLineName: { fontSize: 12, flex: 1, marginRight: 8 },
  itemLineAmt: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 16, fontWeight: '800' },
});
