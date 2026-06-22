// Camera barcode scanner — expo-camera's BarCodeScanner.
//
// Opens the rear camera and listens for any of EAN-13 / EAN-8 / UPC-A /
// QR / Code-128 barcodes. On first detection we vibrate (haptic), look
// the SKU up via /api/products/scan and either drop straight into the
// product detail or, when called from the cart, push it into the cart.
//
// Permissions are requested on mount. If denied we show a clear retry
// CTA — the user can re-grant in OS settings via a deep-link.

import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback } from 'react';
import { ProductApi } from '../../api/endpoints';
import { useCart } from '../../context/CartContext';
import { useColors } from '../../theme/brand';

type Mode = 'cart' | 'lookup' | 'stock-take';

export default function CameraScanScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode: Mode = route.params?.mode ?? 'cart';

  const { addItem } = useCart();
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(true);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });

  // Re-arm the scanner each time the screen regains focus (so after
  // returning from a product detail we accept the next code).
  useFocusEffect(useCallback(() => {
    setActive(true);
    return () => setActive(false);
  }, []));

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return <Centered><Text style={{ color: colors.text }}>Kamera tayyorlanmoqda...</Text></Centered>;
  }
  if (!permission.granted) {
    return (
      <Centered>
        <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
        <Text style={[styles.message, { color: colors.text }]}>
          Skanerlash uchun kamera ruxsati kerak
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={async () => {
            const res = await requestPermission();
            if (!res.granted && !res.canAskAgain) {
              Alert.alert(
                'Sozlamalardan ruxsat bering',
                'Kameraga ruxsat berilmagan. Telefon sozlamalaridan SavdoPRO uchun kamerani yoqing.',
                [
                  { text: 'Bekor', style: 'cancel' },
                  { text: 'Sozlamalar', onPress: () => Linking.openSettings() },
                ],
              );
            }
          }}
        >
          <Text style={styles.btnText}>Ruxsat berish</Text>
        </TouchableOpacity>
      </Centered>
    );
  }

  const handleScan = async ({ data }: { data: string }) => {
    if (!active || !data) return;
    // Debounce — the camera fires the same code many times per second.
    const now = Date.now();
    if (data === lastScanRef.current.code && now - lastScanRef.current.at < 2500) {
      return;
    }
    lastScanRef.current = { code: data, at: now };
    setActive(false);
    Vibration.vibrate(60);

    try {
      const product: any = await ProductApi.scan({ barcode: data });
      if (!product?.id) {
        Alert.alert('Topilmadi', `Bu shtrix-kod tizimda yo'q: ${data}`);
        setTimeout(() => setActive(true), 1200);
        return;
      }
      if (mode === 'cart') {
        addItem({
          id: product.id,
          name: product.name,
          sellingPrice: Number(product.sellingPrice) || 0,
          availableQty: product.quantity,
          barcode: product.barcode ?? null,
        });
        navigation.goBack();
      } else if (mode === 'stock-take') {
        navigation.replace('StockTakeEntry', { product });
      } else {
        navigation.navigate('ProductDetail', { id: product.id });
      }
    } catch (err: any) {
      Alert.alert("Xato", err?.message || 'Internet aloqasini tekshiring');
      setTimeout(() => setActive(true), 1500);
    }
  };

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'qr', 'code128', 'code39'],
        }}
        onBarcodeScanned={active ? handleScan : undefined}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>Shtrix-kodni ramka ichiga joylashtiring</Text>
      </View>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  message: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  btn: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 260, height: 160,
    borderWidth: 3, borderColor: '#22c55e', borderRadius: 14,
    backgroundColor: 'transparent',
  },
  hint: {
    color: '#fff', marginTop: 18, fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
  },
  closeBtn: {
    position: 'absolute', top: 40, right: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
});
