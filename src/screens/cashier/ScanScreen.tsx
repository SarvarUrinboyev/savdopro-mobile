// Mahsulot qidirish va barcode skan — asosiy POS ekrani.
// Bluetooth/USB barcode scanner → TextInput-ga matn yuboradi → Enter = skan.

import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ProductApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { usd } from '../../lib/format';
import { useCart } from '../../context/CartContext';
import { EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

export default function ScanScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const { addItem, itemCount } = useCart();

  const [search, setSearch] = useState('');
  const [scanBusy, setScanBusy] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { data, loading, error, reload } = useApi(() => ProductApi.list(), []);
  const products: any[] = (data as any) ?? [];

  // Auto-focus when screen gains focus (ready for scanner input)
  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }, []),
  );

  const filtered = search.trim()
    ? products.filter(
        (p) =>
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          String(p.barcode ?? '').includes(search),
      )
    : products;

  const handleAdd = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      sellingPrice: Number(product.sellingPrice) || 0,
      availableQty: product.quantity,
      barcode: product.barcode ?? null,
    });
  };

  // Called when user presses Enter (scanner sends Enter after barcode)
  const handleSubmit = async () => {
    const q = search.trim();
    if (!q) return;
    setScanBusy(true);
    try {
      const result: any = await ProductApi.scan({ barcode: q });
      if (result?.id) {
        handleAdd(result);
        setSearch('');
      }
    } catch {
      // Not a barcode or not found — keep text as search filter
    } finally {
      setScanBusy(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const outOfStock = (item.quantity ?? 0) <= 0;
    return (
      <View style={[styles.productRow, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.productName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={[styles.productMeta, { color: colors.textMuted }]}>
            {usd(item.sellingPrice)}
            {'  ·  Qoldi: '}
            <Text style={{ color: outOfStock ? '#EF4444' : '#10B981' }}>
              {item.quantity ?? 0}
            </Text>
          </Text>
          {item.barcode ? (
            <Text style={[styles.barcode, { color: colors.textMuted }]}>
              {item.barcode}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.addBtn,
            {
              backgroundColor: outOfStock
                ? colors.border
                : colors.primary,
            },
          ]}
          onPress={() => !outOfStock && handleAdd(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Barcode / search input */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.surface, borderColor: colors.border, flex: 1, margin: 0 },
        ]}
      >
        <Ionicons
          name={scanBusy ? 'sync-outline' : 'barcode-outline'}
          size={20}
          color={colors.textMuted}
          style={{ marginRight: 8 }}
        />
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: colors.text }]}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSubmit}
          placeholder="Barcode yoki mahsulot nomi..."
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          blurOnSubmit={false}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {/* Camera scanner button — opens CameraScanScreen modal */}
      <View style={{ position: 'absolute', top: 12, right: 12 }}>
        <TouchableOpacity
          style={{
            width: 50, height: 50, borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center',
            elevation: 3,
          }}
          onPress={() => navigation.navigate('CameraScan', { mode: 'cart' })}
          activeOpacity={0.85}
        >
          <Ionicons name="camera" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Product list */}
      <Loader loading={loading} error={error} onRetry={reload}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              text={
                search
                  ? `"${search}" topilmadi`
                  : 'Mahsulotlar yo\'q'
              }
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </Loader>

      {/* Floating cart badge */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={[styles.cartBadge, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Savatcha')}
          activeOpacity={0.9}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.cartBadgeText}>
            {itemCount} ta mahsulot → Savatcha
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  productName: { fontSize: 14, fontWeight: '600' },
  productMeta: { fontSize: 12, marginTop: 3 },
  barcode: { fontSize: 11, marginTop: 2 },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cartBadgeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
