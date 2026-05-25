// Savatcha — mahsulotlarni ko'rish, miqdor o'zgartirish va savdo yakunlash.

import { useState } from 'react';
import {
  Alert,
  FlatList,
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
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useApi } from '../../hooks/useApi';
import { CustomerApi, TerminalApi } from '../../api/endpoints';
import { usd } from '../../lib/format';
import { EmptyState } from '../../components/ui';
import { useColors } from '../../theme/brand';

type PayMethod = 'CASH' | 'P2P' | 'DEBT';

const PAY_METHODS: { key: PayMethod; label: string; icon: string }[] = [
  { key: 'CASH', label: 'Naqd', icon: 'cash-outline' },
  { key: 'P2P', label: 'Karta', icon: 'card-outline' },
  { key: 'DEBT', label: 'Qarz', icon: 'time-outline' },
];

export default function CartScreen() {
  const colors = useColors();
  const { items, removeItem, setQty, clearCart, totalUsd, itemCount } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.itemPrice, { color: colors.textMuted }]}>
          {usd(item.sellingPrice)} × {item.quantity} ={' '}
          <Text style={{ fontWeight: '700', color: colors.text }}>
            {usd(item.sellingPrice * item.quantity)}
          </Text>
        </Text>
      </View>
      {/* Qty controls */}
      <View style={styles.qtyRow}>
        <TouchableOpacity
          style={[styles.qtyBtn, { borderColor: colors.border }]}
          onPress={() => setQty(item.id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={15} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, { borderColor: colors.border }]}
          onPress={() => setQty(item.id, item.quantity + 1)}
        >
          <Ionicons name="add" size={15} color={colors.text} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => removeItem(item.id)}
        style={{ marginLeft: 8, padding: 4 }}
      >
        <Ionicons name="trash-outline" size={19} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <EmptyState icon="🛒" text="Savatcha bo'sh" />
        <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
          Skan ekranidan mahsulot qo'shing
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 130 }}
      />

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.footerLabel, { color: colors.textMuted }]}>
            {itemCount} ta mahsulot
          </Text>
          <Text style={[styles.footerTotal, { color: colors.text }]}>{usd(totalUsd)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.trashBtn, { borderColor: colors.border }]}
          onPress={() =>
            Alert.alert("Tozalash", "Savatchani tozalashni xohlaysizmi?", [
              { text: 'Bekor', style: 'cancel' },
              { text: "Ha", style: 'destructive', onPress: clearCart },
            ])
          }
        >
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCheckout(true)}
        >
          <Text style={styles.checkoutText}>To'lash</Text>
        </TouchableOpacity>
      </View>

      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onDone={() => { setShowCheckout(false); clearCart(); }}
        />
      )}
    </View>
  );
}

// ─── Checkout modal (single Modal, page-switching inside) ─────────────────────

function CheckoutModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const colors = useColors();
  const { items, totalUsd } = useCart();

  const [page, setPage] = useState<'form' | 'customers'>('form');
  const [method, setMethod] = useState<PayMethod>('CASH');
  const [discountStr, setDiscountStr] = useState('');
  const [receivedStr, setReceivedStr] = useState('');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const { data: custsData, loading: custsLoading } = useApi(() => CustomerApi.list(), []);
  const customers: any[] = (custsData as any) ?? [];

  const discount = Math.max(0, parseFloat(discountStr) || 0);
  const finalTotal = Math.max(0, totalUsd - discount);
  const received = parseFloat(receivedStr) || 0;
  const change = received > 0 ? received - finalTotal : null;

  const pay = async () => {
    if (method === 'DEBT' && !customerId) {
      setErr("Qarzga olish uchun mijoz tanlang");
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await TerminalApi.save({
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          sellingPrice: i.sellingPrice,
        })),
        paymentMethod: method,
        customerId: customerId ?? undefined,
        discountUsd: discount > 0 ? discount : undefined,
        receivedAmount: method === 'CASH' && received > 0 ? received : finalTotal,
        totalAmount: finalTotal,
      });
      onDone();
    } catch (e: any) {
      setErr(e.message ?? 'Xatolik yuz berdi');
      setBusy(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={page === 'form' ? onClose : () => setPage('form')}
    >
      <View style={styles.overlay}>
        {/* ── Customer picker page ── */}
        {page === 'customers' ? (
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, maxHeight: '75%' },
            ]}
          >
            {/* Header */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                onPress={() => setPage('form')}
                style={{ padding: 4 }}
              >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.text, marginLeft: 10, marginBottom: 0 }]}>
                Mijoz tanlash
              </Text>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {custsLoading ? (
                <Text style={{ color: colors.textMuted, padding: 20, textAlign: 'center' }}>
                  Yuklanmoqda...
                </Text>
              ) : (
                <>
                  {/* "No customer" option */}
                  <TouchableOpacity
                    style={[styles.custItem, { borderBottomColor: colors.border }]}
                    onPress={() => { setCustomerId(null); setCustomerName(''); setPage('form'); }}
                  >
                    <Text style={{ color: colors.textMuted, fontStyle: 'italic' }}>
                      Mijoz yo'q
                    </Text>
                  </TouchableOpacity>
                  {customers.length === 0 ? (
                    <Text style={{ color: colors.textMuted, padding: 16, textAlign: 'center' }}>
                      Hech qanday mijoz topilmadi
                    </Text>
                  ) : (
                    customers.map((c: any) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.custItem,
                          { borderBottomColor: colors.border },
                          customerId === c.id && { backgroundColor: colors.primary + '12' },
                        ]}
                        onPress={() => { setCustomerId(c.id); setCustomerName(c.name); setPage('form'); }}
                      >
                        <Text style={{ color: colors.text, fontWeight: '500' }}>
                          {c.name}
                        </Text>
                        {c.phone ? (
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                            {c.phone}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    ))
                  )}
                </>
              )}
            </ScrollView>
          </View>
        ) : (
          /* ── Checkout form page ── */
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Savdo yakunlash
              </Text>

              {/* Payment method */}
              <View style={styles.methodRow}>
                {PAY_METHODS.map((m) => {
                  const active = method === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      style={[
                        styles.methodBtn,
                        {
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primary + '18' : 'transparent',
                        },
                      ]}
                      onPress={() => { setMethod(m.key); setErr(''); }}
                    >
                      <Ionicons
                        name={m.icon as any}
                        size={18}
                        color={active ? colors.primary : colors.textMuted}
                      />
                      <Text style={{ color: active ? colors.primary : colors.textMuted, fontSize: 13, fontWeight: '600' }}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Customer */}
              <TouchableOpacity
                style={[styles.custRow, { borderColor: colors.border }]}
                onPress={() => setPage('customers')}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={customerId ? colors.primary : colors.textMuted}
                />
                <Text
                  style={{ flex: 1, color: customerId ? colors.text : colors.textMuted, marginLeft: 8, fontSize: 14 }}
                >
                  {customerName || 'Mijoz tanlash (ixtiyoriy)'}
                </Text>
                <Ionicons name="chevron-forward-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Discount */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Chegirma (USD)
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                value={discountStr}
                onChangeText={setDiscountStr}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />

              {/* Received amount (cash only) */}
              {method === 'CASH' && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                    Qabul qilindi (USD)
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    value={receivedStr}
                    onChangeText={setReceivedStr}
                    keyboardType="numeric"
                    placeholder={String(finalTotal.toFixed(2))}
                    placeholderTextColor={colors.textMuted}
                  />
                  {change !== null && change >= 0 && (
                    <Text style={{ color: '#10B981', fontSize: 13, marginTop: 2, fontWeight: '600' }}>
                      Qaytim: {usd(change)}
                    </Text>
                  )}
                </>
              )}

              {/* Total */}
              <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                {discount > 0 && (
                  <View style={styles.totalLine}>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>Chegirma</Text>
                    <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>
                      -{usd(discount)}
                    </Text>
                  </View>
                )}
                <View style={styles.totalLine}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Jami</Text>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 22 }}>
                    {usd(finalTotal)}
                  </Text>
                </View>
              </View>

              {err ? (
                <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{err}</Text>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={onClose}
                >
                  <Text style={{ color: colors.text, fontWeight: '500' }}>Bekor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.payBtn, { backgroundColor: colors.primary }]}
                  onPress={pay}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                    {busy ? 'Saqlanmoqda...' : "To'lash"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemPrice: { fontSize: 12, marginTop: 3 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 15, fontWeight: '700', minWidth: 26, textAlign: 'center' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
  },
  footerLabel: { fontSize: 11 },
  footerTotal: { fontSize: 20, fontWeight: '800' },
  trashBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  methodBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  custRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 4,
  },
  fieldLabel: { fontSize: 12, fontWeight: '500', marginBottom: 5, marginTop: 8 },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 4,
  },
  totalRow: { borderTopWidth: 1, marginTop: 12, paddingTop: 12, marginBottom: 14 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtn: { flex: 2, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  custItem: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
});
