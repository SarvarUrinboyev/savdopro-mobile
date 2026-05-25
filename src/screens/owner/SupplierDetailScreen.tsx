// Supplier detail — basic info for now (contact details).

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SupplierApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { Card, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';
import type { OwnerStackParamList } from '../../navigation/OwnerStack';

type Props = NativeStackScreenProps<OwnerStackParamList, 'SupplierDetail'>;

export default function SupplierDetailScreen({ route }: Props) {
  const colors = useColors();
  const { id } = route.params;
  const { data, loading, error, reload } = useApi(() => SupplierApi.detail(id), [id]);
  const s: any = data;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Loader loading={loading} error={error} onRetry={reload}>
        {s && (
          <Card style={{ padding: 16 }}>
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{s.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>{s.name}</Text>
                {s.phone   && <Text style={[styles.meta, { color: colors.textMuted }]}>📞 {s.phone}</Text>}
                {s.address && <Text style={[styles.meta, { color: colors.textMuted }]}>📍 {s.address}</Text>}
                {s.note    && <Text style={[styles.meta, { color: colors.textMuted }]}>📝 {s.note}</Text>}
              </View>
            </View>
          </Card>
        )}
      </Loader>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 12 },
  row:        { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  avatar:     { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name:       { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  meta:       { fontSize: 14, marginBottom: 4 },
});
