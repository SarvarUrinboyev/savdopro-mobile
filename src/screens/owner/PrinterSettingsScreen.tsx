// Bluetooth printer setup screen (Owner stack → Sozlamalar → Printer).
//
// Steps:
//   1. Show the saved printer (if any) + connection status
//   2. List paired BT devices (the OS pairing is done in OS Settings)
//   3. Tap a device → connectPrinter() → persist MAC to MMKV
//   4. "Test chek" button writes a tiny sample ESC/POS sequence

import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  connectPrinter, getSavedPrinterAddress, listPairedPrinters, printTest,
  reconnectSavedPrinter,
} from '../../services/btPrinter';
import { useColors } from '../../theme/brand';

export default function PrinterSettingsScreen() {
  const colors = useColors();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(getSavedPrinterAddress());
  const [connected, setConnected] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setDevices(await listPairedPrinters());
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    if (saved) {
      void reconnectSavedPrinter().then(setConnected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = async (address: string) => {
    setLoading(true);
    const ok = await connectPrinter(address);
    setLoading(false);
    if (ok) {
      setSaved(address);
      setConnected(true);
      Alert.alert("Tayyor", "Printer ulandi va saqlandi.");
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.status, {
        backgroundColor: connected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
      }]}>
        <Ionicons
          name={connected ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={connected ? '#10B981' : '#EF4444'}
        />
        <Text style={[styles.statusText, { color: colors.text }]}>
          {connected
            ? `Ulangan: ${saved}`
            : saved ? `Saqlangan, ulanmagan: ${saved}` : 'Printer tanlanmagan'}
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={refresh}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Yangilanmoqda...' : 'Yangilash'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: connected ? '#10B981' : colors.border }]}
          onPress={async () => {
            const ok = await printTest();
            if (ok) Alert.alert('Tayyor', 'Test chek yuborildi.');
          }}
          disabled={!connected}
        >
          <Ionicons name="print" size={18} color="#fff" />
          <Text style={styles.btnText}> Test chek</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.section, { color: colors.textMuted }]}>
        OS sozlamalarida juftlangan qurilmalar:
      </Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : devices.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Avval Android sozlamalarida printerni juftlang, keyin shu yerga qayting.
        </Text>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(d) => d.address}
          renderItem={({ item }) => {
            const isSaved = item.address === saved;
            return (
              <TouchableOpacity
                style={[styles.row, { borderColor: colors.border }]}
                onPress={() => handlePick(item.address)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.devName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.devAddr, { color: colors.textMuted }]}>{item.address}</Text>
                </View>
                {isSaved && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  status: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, marginBottom: 12,
  },
  statusText: { fontSize: 13, fontWeight: '500' },
  buttons: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 44, borderRadius: 10,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  section: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderWidth: 1, borderRadius: 10, marginBottom: 8,
  },
  devName: { fontSize: 14, fontWeight: '600' },
  devAddr: { fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  empty: { textAlign: 'center', padding: 24, fontSize: 13 },
});
