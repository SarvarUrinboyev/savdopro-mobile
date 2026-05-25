// Hisobot — end-of-day report + Telegram send.

import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ReportApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDate, todayIso, usd } from '../../lib/format';
import { Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

export default function ReportsScreen() {
  const colors = useColors();
  const [date, setDate] = useState(todayIso());
  const [sending, setSending] = useState(false);

  const { data, loading, error, reload } = useApi(() => ReportApi.endOfDay(date), [date]);
  const report: any = data;

  const sendTelegram = async () => {
    setSending(true);
    try {
      await ReportApi.sendTelegram(date);
      Alert.alert('✅', 'Hisobot Telegramga yuborildi');
    } catch (err: any) {
      Alert.alert('Xatolik', err.message);
    } finally {
      setSending(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const newDate = d.toISOString().slice(0, 10);
    if (newDate <= todayIso()) setDate(newDate);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.dateNav}>
        <TouchableOpacity style={[styles.navBtn, { borderColor: colors.border }]} onPress={() => changeDate(-1)}>
          <Text style={{ color: colors.text }}>‹ Oldingi</Text>
        </TouchableOpacity>
        <Text style={[styles.dateLabel, { color: colors.text }]}>{formatDate(date)}</Text>
        <TouchableOpacity style={[styles.navBtn, { borderColor: colors.border, opacity: date >= todayIso() ? 0.3 : 1 }]} onPress={() => changeDate(1)} disabled={date >= todayIso()}>
          <Text style={{ color: colors.text }}>Keyingi ›</Text>
        </TouchableOpacity>
      </View>

      <Loader loading={loading} error={error} onRetry={reload}>
        {report ? (
          <>
            <Card style={{ padding: 16 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Kunlik hisobot</Text>
              <Row label="Tushum"              value={usd(report.totalRevenue)} vc="#10B981" colors={colors} />
              <Row label="Naqd"                value={usd(report.cashRevenue)} colors={colors} />
              <Row label="Karta"               value={usd(report.cardRevenue)} colors={colors} />
              <Row label="Xarajatlar"          value={usd(report.totalExpenses)} vc="#EF4444" colors={colors} />
              <Row label="Sof foyda"           value={usd(report.netProfit)} vc="#10B981" colors={colors} />
              <Row label="Sotilgan mahsulotlar" value={String(report.itemsSold ?? 0)} colors={colors} />
            </Card>

            {report.topProducts?.length > 0 && (
              <Card>
                <CardHeader title="Eng ko'p sotilgan" />
                {report.topProducts.map((p: any, idx: number) => (
                  <View key={idx} style={[styles.pRow, idx < report.topProducts.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                    <Text style={{ color: colors.textMuted, width: 22, fontSize: 13 }}>{idx + 1}.</Text>
                    <Text style={[{ flex: 1, fontSize: 13, color: colors.text }]}>{p.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{p.quantity} dona</Text>
                    <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700', marginLeft: 8 }}>{usd(p.revenue)}</Text>
                  </View>
                ))}
              </Card>
            )}

            <TouchableOpacity style={[styles.telegramBtn]} onPress={sendTelegram} disabled={sending} activeOpacity={0.85}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {sending ? 'Yuborilmoqda...' : '✈️ Telegramga yuborish'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <EmptyState icon="📊" text="Bu kun uchun hisobot topilmadi" />
        )}
      </Loader>
    </ScrollView>
  );
}

function Row({ label, value, vc, colors }: any) {
  return (
    <View style={styles.reportRow}>
      <Text style={[styles.reportLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.reportValue, { color: vc ?? colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 12, paddingBottom: 32 },
  dateNav:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn:       { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  dateLabel:    { fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  reportRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  reportLabel:  { fontSize: 14 },
  reportValue:  { fontSize: 14, fontWeight: '700' },
  pRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  telegramBtn:  { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, backgroundColor: '#2AABEE' },
});
