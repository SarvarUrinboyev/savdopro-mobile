// Stock movement history for a single product.

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProductApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDateTime } from '../../lib/format';
import { Card, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';
import type { OwnerStackParamList } from '../../navigation/OwnerStack';

type Props = NativeStackScreenProps<OwnerStackParamList, 'WarehouseMovements'>;

export default function WarehouseMovementsScreen({ route }: Props) {
  const colors = useColors();
  const { id, name } = route.params;
  const { data, loading, error, reload } = useApi(() => ProductApi.movements(id), [id]);
  const movements: any[] = (data as any) ?? [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.productName, { color: colors.text }]}>{name}</Text>
      <Card>
        <Loader loading={loading} error={error} onRetry={reload}>
          {movements.length === 0 ? (
            <EmptyState icon="📦" text="Harakat yo'q" />
          ) : (
            movements.map((m: any, idx: number) => {
              const isIn = Number(m.quantityChange) > 0;
              return (
                <View key={m.id ?? idx} style={[styles.row, idx < movements.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={[styles.dot, { backgroundColor: isIn ? '#10B981' : '#EF4444' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reason, { color: colors.text }]}>{m.reason || (isIn ? 'Kirdi' : 'Chiqdi')}</Text>
                    <Text style={[styles.meta, { color: colors.textMuted }]}>{formatDateTime(m.createdAt)}</Text>
                  </View>
                  <Text style={[styles.change, { color: isIn ? '#10B981' : '#EF4444' }]}>
                    {isIn ? '+' : ''}{m.quantityChange}
                  </Text>
                  <Text style={[styles.balance, { color: colors.textMuted }]}> (={m.balanceAfter})</Text>
                </View>
              );
            })
          )}
        </Loader>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { padding: 12, paddingBottom: 32 },
  productName: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  reason:      { fontSize: 14, fontWeight: '500' },
  meta:        { fontSize: 11, marginTop: 1 },
  change:      { fontSize: 16, fontWeight: '700' },
  balance:     { fontSize: 12 },
});
