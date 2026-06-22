// Bluetooth Classic thermal-printer wrapper.
//
// Uses `react-native-bluetooth-classic`. The printer is a serial-profile
// SPP device that accepts raw ESC/POS bytes — same wire format as the
// Receipt builder produces. We keep the connection sticky for the
// session so consecutive prints don't pay reconnect cost.
//
// Saved device id (the MAC address) is persisted to MMKV so the next
// app launch reconnects automatically.

import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic, {
  type BluetoothDevice,
} from 'react-native-bluetooth-classic';
import { storage, STORAGE_KEYS } from '../storage/mmkv';
import { buildReceipt, type ReceiptInput } from '../lib/receipt';

let connected: BluetoothDevice | null = null;

/** Request the runtime BT permissions Android 12+ requires. */
async function ensureAndroidPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.requestMultiple([
    'android.permission.BLUETOOTH_SCAN' as any,
    'android.permission.BLUETOOTH_CONNECT' as any,
  ]);
  return Object.values(granted).every((g) => g === PermissionsAndroid.RESULTS.GRANTED);
}

/** Pop the OS picker / list paired devices and return them. */
export async function listPairedPrinters(): Promise<BluetoothDevice[]> {
  if (!(await ensureAndroidPermissions())) return [];
  const enabled = await RNBluetoothClassic.isBluetoothEnabled();
  if (!enabled) {
    Alert.alert('Bluetooth', "Bluetooth o'chirilgan. Yoqing va qaytadan urinib ko'ring.");
    return [];
  }
  return await RNBluetoothClassic.getBondedDevices();
}

export async function connectPrinter(address: string): Promise<boolean> {
  try {
    if (connected?.address === address && (await connected.isConnected())) {
      return true;
    }
    connected = await RNBluetoothClassic.connectToDevice(address, {
      delimiter: '',
      charset: 'utf-8',
    });
    storage.set(STORAGE_KEYS.PRINTER_ADDRESS, address);
    return true;
  } catch (err: any) {
    Alert.alert('Printer xato', err?.message ?? "Ulanib bo'lmadi");
    return false;
  }
}

export async function reconnectSavedPrinter(): Promise<boolean> {
  const saved = storage.getString(STORAGE_KEYS.PRINTER_ADDRESS);
  if (!saved) return false;
  return await connectPrinter(saved);
}

export function getSavedPrinterAddress(): string | null {
  return storage.getString(STORAGE_KEYS.PRINTER_ADDRESS) ?? null;
}

/** Send raw bytes — used by both the receipt and "test print" flows. */
async function writeBytes(bytes: Uint8Array): Promise<boolean> {
  if (!connected || !(await connected.isConnected())) {
    if (!(await reconnectSavedPrinter())) {
      Alert.alert('Printer', 'Printer ulanmagan. Sozlamalardan ulang.');
      return false;
    }
  }
  try {
    // Library expects a base64 string for binary data.
    const b64 = bytesToBase64(bytes);
    await connected!.write(b64, 'base64');
    return true;
  } catch (err: any) {
    Alert.alert('Printer xato', err?.message ?? "Yozib bo'lmadi");
    return false;
  }
}

export async function printReceipt(input: ReceiptInput): Promise<boolean> {
  return writeBytes(buildReceipt(input));
}

/** Tiny "Test chek" used from the Settings screen to validate the link. */
export async function printTest(shopName = 'SavdoPRO'): Promise<boolean> {
  const sample: ReceiptInput = {
    shopName,
    saleId: 'TEST',
    createdAt: new Date().toISOString(),
    lines: [
      { name: 'Test mahsulot', qty: 1, unitPrice: 12000, lineTotal: 12000 },
    ],
    subtotal: 12000, discount: 0, total: 12000,
    paymentMethod: 'NAQD',
    footer: "Sinov chek — printer ishlayapti.",
  };
  return printReceipt(sample);
}

// Tiny base64 (no Node Buffer in RN) for raw byte payloads.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
  }
  if (i < bytes.length) {
    const n = bytes[i] << 16 | ((bytes[i + 1] ?? 0) << 8);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=';
    out += '=';
  }
  return out;
}
