// Smena boshqaruvi — kassir uchun ochish va yopish.

import { useState } from 'react';
import {
  Alert,
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
import { ShiftApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { formatDateTime, usd } from '../../lib/format';
import { Card, CardHeader, EmptyState, Loader } from '../../components/ui';
import { useColors } from '../../theme/brand';

export default function ShiftScreen() {
  const colors = useColors();
  const [openModal, setOpenModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: currentData,
    loading: currentLoading,
    error: currentError,
    reload: reloadCurrent,
  } = useApi(() => ShiftApi.current(), [refreshKey]);

  const {
    data: historyData,
    loading: histLoading,
    error: histError,
    reload: reloadHistory,
  } = useApi(() => ShiftApi.history(), [refreshKey]);

  const activeShift: any = currentData;
  const allShifts: any[] = Array.isArray(historyData) ? (historyData as any[]) : [];
  const pastShifts = allShifts.filter((s: any) => s.closedAt).slice(0, 15);

  const refresh = () => setRefreshKey((k) => k + 1);

  const closeShift = () => {
    Alert.alert(
      'Smenani yopish',
      'Hozirgi smenani yopmoqchimisiz?',
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: 'Ha, yopish',
          style: 'destructive',
          onPress: async () => {
            try {
              await ShiftApi.close();
              refresh();
            } catch (e: any) {
              Alert.alert('Xatolik', e.message ?? 'Xatolik yuz berdi');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Active shift */}
      <Card>
        <CardHeader title="Joriy smena" />
        <Loader
          loading={currentLoading}
          error={currentError}
          onRetry={reloadCurrent}
        >
          {activeShift ? (
            <View style={styles.activeSection}>
              {/* Status badge */}
              <View style={styles.statusRow}>
                <View style={styles.activeDot} />
                <Text style={[styles.statusText, { color: '#10B981' }]}>
                  Faol smena
                </Text>
              </View>

              <InfoRow
                label="Boshlangan"
                value={formatDateTime(activeShift.openedAt)}
                colors={colors}
              />
              {activeShift.openingCash != null && (
                <InfoRow
                  label="Boshlang'ich kassa"
                  value={usd(activeShift.openingCash)}
                  colors={colors}
                />
              )}
              {activeShift.totalSales != null && (
                <InfoRow
                  label="Jami savdo"
                  value={usd(activeShift.totalSales)}
                  colors={colors}
                />
              )}
              {activeShift.transactionCount != null && (
                <InfoRow
                  label="Tranzaksiyalar"
                  value={String(activeShift.transactionCount) + ' ta'}
                  colors={colors}
                />
              )}

              <TouchableOpacity
                style={[styles.closeBtn, { borderColor: '#EF4444' }]}
                onPress={closeShift}
                activeOpacity={0.8}
              >
                <Ionicons name="stop-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.closeBtnText}>Smenani yopish</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noShiftSection}>
              <EmptyState icon="🕐" text="Faol smena yo'q" />
              <TouchableOpacity
                style={[styles.openBtn, { backgroundColor: colors.primary }]}
                onPress={() => setOpenModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="play-circle-outline" size={18} color="#fff" />
                <Text style={styles.openBtnText}>Yangi smena ochish</Text>
              </TouchableOpacity>
            </View>
          )}
        </Loader>
      </Card>

      {/* History */}
      <Card>
        <CardHeader title="Smena tarixi" hint={`${pastShifts.length} ta`} />
        <Loader
          loading={histLoading}
          error={histError}
          onRetry={reloadHistory}
        >
          {pastShifts.length === 0 ? (
            <EmptyState icon="📋" text="Tarix yo'q" />
          ) : (
            pastShifts.map((s: any, idx: number) => (
              <View
                key={s.id ?? idx}
                style={[
                  styles.histRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: idx < pastShifts.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.histDate, { color: colors.text }]}>
                    {formatDateTime(s.openedAt)}
                  </Text>
                  {s.closedAt && (
                    <Text style={[styles.histSub, { color: colors.textMuted }]}>
                      Yopildi: {formatDateTime(s.closedAt)}
                    </Text>
                  )}
                  {s.transactionCount != null && (
                    <Text style={[styles.histSub, { color: colors.textMuted }]}>
                      {s.transactionCount} ta tranzaksiya
                    </Text>
                  )}
                </View>
                {s.totalSales != null && (
                  <Text style={[styles.histAmount, { color: '#10B981' }]}>
                    {usd(s.totalSales)}
                  </Text>
                )}
              </View>
            ))
          )}
        </Loader>
      </Card>

      {openModal && (
        <OpenShiftModal
          onClose={() => setOpenModal(false)}
          onOpened={() => {
            setOpenModal(false);
            refresh();
          }}
        />
      )}
    </ScrollView>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
        {value}
      </Text>
    </View>
  );
}

// ─── Open shift modal ─────────────────────────────────────────────────────────

function OpenShiftModal({
  onClose,
  onOpened,
}: {
  onClose: () => void;
  onOpened: () => void;
}) {
  const colors = useColors();
  const [cashStr, setCashStr] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const open = async () => {
    setBusy(true);
    setErr('');
    try {
      await ShiftApi.open({ openingCash: cashStr ? Number(cashStr) : 0 });
      onOpened();
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
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}
        >
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Yangi smena ochish
            </Text>
            <Text style={[styles.sheetLabel, { color: colors.textMuted }]}>
              Boshlang'ich kassa summasi (USD)
            </Text>
            <TextInput
              style={[
                styles.sheetInput,
                { borderColor: colors.border, color: colors.text },
              ]}
              value={cashStr}
              onChangeText={setCashStr}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            {err ? (
              <Text
                style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}
              >
                {err}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={{ color: colors.text, fontWeight: '500' }}>
                  Bekor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={open}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {busy ? 'Ochilmoqda...' : 'Ochish'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { padding: 12, paddingBottom: 40 },
  // Active shift
  activeSection: { paddingHorizontal: 14, paddingBottom: 14 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: { fontSize: 13, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 46,
    marginTop: 14,
    gap: 8,
  },
  closeBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  // No shift
  noShiftSection: { paddingHorizontal: 14, paddingBottom: 14 },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: 46,
    marginTop: 8,
    gap: 8,
  },
  openBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  // History
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  histDate: { fontSize: 13, fontWeight: '600' },
  histSub: { fontSize: 11, marginTop: 2 },
  histAmount: { fontSize: 14, fontWeight: '700' },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  sheetLabel: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  sheetInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
