import { createMMKV } from 'react-native-mmkv';

// Single MMKV instance for the whole app. MMKV is synchronous and
// orders of magnitude faster than AsyncStorage; we use it for the
// auth pair (access + refresh) and the License Server URL because
// every API request touches them.
//
// react-native-mmkv v4 uses a factory (`createMMKV`) rather than a
// `new MMKV(...)` constructor — the class itself is type-only.
export const storage = createMMKV({ id: 'savdopro.default' });

// Keys are namespaced to match the desktop's localStorage convention,
// so anyone reading either codebase finds the same names.
export const STORAGE_KEYS = {
  LICENSE_URL: 'savdopro.licenseUrl',
  ACCESS_TOKEN: 'savdopro.accessToken',
  REFRESH_TOKEN: 'savdopro.refreshToken',
  SAVED_USERNAME: 'savdopro.savedUsername',
  SAVED_PASSWORD: 'savdopro.savedPassword',
  BACKEND_URL: 'savdopro.backendUrl',
  ACTIVE_SHOP_ID: 'savdopro.activeShopId',
  PRINTER_ADDRESS: 'savdopro.printerAddress',
} as const;
