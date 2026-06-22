// Mobile stock-take (inventarizatsiya).
//
// Flow:
//   1. Open this screen → blank list of (productId, scannedQty)
//   2. Tap "Skanerlash" → CameraScanScreen(mode=stock-take)
//   3. After each scan we navigate back here with the product + a
//      ProductCountModal where the user types the physical count
//   4. The card shows the running difference (counted - system) per row
//   5. "Saqlash" → POSTs each row to /api/products/{id}/adjust as a
//      StockReason.CORRECTION movement so the audit trail records who
//      counted what and the system stock catches up.
//
// State is in-memory and cleared on screen unmount — partial counts
// don't survive an app kill (matches the desktop's stock-take UX).

import { useCallback, useState } from 'react';
import {
  Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { backendApi } from '../../api/backendClient';
import { useColors } from '../../theme/brand';

interface CountRow {
  productId: number;
  name: string;
  sku: string | null;
  systemQty: number;
  countedQty: number;
}

export default function StockTakeScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [rows, setRows] = useState<CountRow[]>([]);
  const [saving, setSaving] = useState(false);

  // Receive product back from the scanner.
  useFocusEffect(useCallback(() => {
    const incoming = route.params?.product;
    if (incoming && !rows.find((r) => r.productId === incoming.id)) {
      setRows((prev) => [
        ...prev,
        {
          productId: incoming.id,
          name: incoming.name,
          sku: incoming.barcode ?? null,
          systemQty: incoming.quantity ?? 0,
          countedQty: 0,
        },
      ]);
      // Reset param so a re-focus doesn't re-add.
      navigation.setParams({ product: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.product]));

  const updateCount = (id: number, qty: number) =>
    setRows((p) => p.map((r) => (r.productId === id ? { ...r, countedQty: qty } : r)));
  const removeRow = (id: number) =>
    setRows((p) => p.filter((r) => r.productId !== id));

  const submit = async () => {
    const changes = rows.filter((r) => r.countedQty !== r.systemQty);
    if (changes.length === 0) {
      Alert.alert("Ma'lumot", "O'zgartirish topilmadi.");
      return;
    }
    Alert.alert(
      'Tasdiqlang',
      `${changes.length} ta mahsulot uchun qoldiq tuzatiladi. Davom etilsinmi?`,
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: 'Saqlash',
          onPress: async () => {
            setSaving(true);
            let ok = 0;
            for (const r of changes) {
              const delta = r.countedQty - r.systemQty;
              try {
                await backendApi.patch(`/products/${r.productId}/adjust`, {
                  delta,
                  reason: 'CORRECTION',
                  note: 'Mobil inventarizatsiya',
                });
                ok++;
              } catch (err: any) {
                console.warn('adjust fail', r.productId, err?.message);
              }
            }
            setSaving(false);
            Alert.alert('Tayyor', `${ok}/${changes.length} ta yangilandi.`);
            if (ok === changes.length) {
              setRows([]);
            }
          },
        },
      ],
    );
  };

  const totalDelta = rows.reduce((s, r) => s + (r.countedQty - r.systemQty), 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CameraScan', { mode: 'stock-take' })}
        >
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>Skanerlash</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <Text style={[styles.summary, { color: colors.text }]}>
          {rows.length} ta · {totalDelta >= 0 ? '+' : ''}{totalDelta}
        </Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.productId)}
        renderItem={({ item }) => {
          const delta = item.countedQty - item.systemQty;
          return (
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {item.sku ? item.sku + ' · ' : ''}sistema: {item.systemQty}
                </Text>
              </View>
              <TextInput
                style={[styles.qtyInput, { borderColor: colors.border, color: colors.text }]}
                keyboardType="number-pad"
                value={String(item.countedQty)}
                onChangeText={(t) => updateCount(item.productId, Math.max(0, Number(t) || 0))}
                selectTextOnFocus
              />
              <Text style={[styles.delta, {
                color: delta === 0 ? colors.textMuted : delta > 0 ? '#10B981' : '#EF4444',
              }]}>
                {delta > 0 ? '+' : ''}{delta}
              </Text>
              <TouchableOpacity onPress={() => removeRow(item.productId)} style={{ padding: 6 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Skanerlash tugmasini bosing va mahsulotlarni skanerlang
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {rows.length > 0 && (
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={submit}
          disabled={saving}
        >
          <Text style={styles.btnText}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  summary: { fontSize: 13, fontWeight: '500' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  name: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 11, marginTop: 2 },
  qtyInput: {
    width: 64, borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 8, height: 38, textAlign: 'center', fontSize: 15,
  },
  delta: { width: 40, textAlign: 'right', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', padding: 48, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  saveBtn: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    elevation: 6,
  },
});
