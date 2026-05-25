// Mahsulot tahrirlash — create or edit a product.

import { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CategoryApi, ProductApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';
import type { OwnerStackParamList } from '../../navigation/OwnerStack';

type Props = NativeStackScreenProps<OwnerStackParamList, 'ProductEditor'>;

export default function ProductEditorScreen({ route, navigation }: Props) {
  const colors = useColors();
  const { id } = route.params;
  const isNew = !id;

  const { data: existing, loading } = useApi(
    () => (id ? ProductApi.get(id) : Promise.resolve(null)),
    [id],
  );
  const { data: catsData } = useApi(() => CategoryApi.list(), []);
  const categories: any[] = (catsData as any) ?? [];

  const [name, setName]         = useState('');
  const [barcode, setBarcode]   = useState('');
  const [costPrice, setCost]    = useState('');
  const [sellingPrice, setSell] = useState('');
  const [quantity, setQty]      = useState('');
  const [categoryId, setCatId]  = useState('');
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState('');

  useEffect(() => {
    if (existing) {
      const p: any = existing;
      setName(p.name ?? '');
      setBarcode(p.barcode ?? '');
      setCost(p.costPrice != null ? String(p.costPrice) : '');
      setSell(p.sellingPrice != null ? String(p.sellingPrice) : '');
      setQty(p.quantity != null ? String(p.quantity) : '');
      setCatId(p.categoryId != null ? String(p.categoryId) : '');
    }
  }, [existing]);

  const save = async () => {
    if (!name.trim()) { setErr('Nom kiriting'); return; }
    if (!sellingPrice || Number(sellingPrice) <= 0) { setErr("Sotuv narxi musbat bo'lishi kerak"); return; }
    setBusy(true);
    const body = {
      name: name.trim(),
      barcode: barcode.trim() || null,
      costPrice: costPrice ? Number(costPrice) : null,
      sellingPrice: Number(sellingPrice),
      quantity: quantity ? Number(quantity) : 0,
      categoryId: categoryId ? Number(categoryId) : null,
    };
    try {
      if (isNew) {
        await ProductApi.create(body);
      } else {
        await ProductApi.update(id!, body);
      }
      navigation.goBack();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  const deleteProduct = () => {
    if (!id) return;
    Alert.alert("O'chirish", "Bu mahsulotni o'chirmoqchimisiz?", [
      { text: 'Bekor', style: 'cancel' },
      {
        text: "O'chirish",
        style: 'destructive',
        onPress: async () => {
          try {
            await ProductApi.remove(id);
            navigation.goBack();
          } catch (e: any) { Alert.alert('Xatolik', e.message); }
        },
      },
    ]);
  };

  if (!isNew && loading) return <Loader loading error={null}>{null}</Loader>;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Field label="Mahsulot nomi *" value={name} onChange={setName} colors={colors} autoFocus={isNew} />
        <Field label="Shtrix-kod" value={barcode} onChange={setBarcode} colors={colors} />

        {/* Category picker */}
        <Text style={[styles.label, { color: colors.textMuted }]}>Toifa</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <TouchableOpacity
            style={[styles.catChip, !categoryId && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setCatId('')}
          >
            <Text style={{ color: !categoryId ? '#fff' : colors.textMuted, fontSize: 13 }}>Toifsiz</Text>
          </TouchableOpacity>
          {categories.map((c: any) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, categoryId === String(c.id) && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setCatId(String(c.id))}
            >
              <Text style={{ color: categoryId === String(c.id) ? '#fff' : colors.textMuted, fontSize: 13 }}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field label="Tan narxi (USD)" value={costPrice} onChange={setCost} colors={colors} numeric />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Sotuv narxi (USD) *" value={sellingPrice} onChange={setSell} colors={colors} numeric />
          </View>
        </View>
        <Field label="Miqdor (dona)" value={quantity} onChange={setQty} colors={colors} numeric />

        {err ? <Text style={{ color: colors.error, fontSize: 13, marginBottom: 12 }}>{err}</Text> : null}

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={save} disabled={busy} activeOpacity={0.85}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{busy ? 'Saqlanmoqda...' : 'Saqlash'}</Text>
        </TouchableOpacity>

        {!isNew && (
          <TouchableOpacity style={[styles.deleteBtn]} onPress={deleteProduct} activeOpacity={0.85}>
            <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 15 }}>🗑 Mahsulotni o'chirish</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, colors, numeric, autoFocus }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'numeric' : 'default'}
        autoFocus={autoFocus}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 16, paddingBottom: 40 },
  label:      { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  input:      { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 15 },
  catChip:    { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  row2:       { flexDirection: 'row', gap: 12 },
  saveBtn:    { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  deleteBtn:  { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FECACA' },
});
