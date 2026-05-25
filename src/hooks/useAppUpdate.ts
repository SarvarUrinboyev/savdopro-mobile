// In-app update checker.
//
// Fetches /update.json from the VPS (served by nginx as a static file).
// Compares the remote versionCode with the one baked into the current APK.
// If the remote versionCode is higher, returns UpdateInfo so the UI can
// show a "Yangilanish mavjud" banner and open the APK download link.
//
// update.json format:
// {
//   "versionCode": 3,
//   "version":     "1.0.2",
//   "url":         "https://expo.dev/artifacts/eas/XXXX.apk",
//   "changelog":   "Qisqacha o'zgarishlar"
// }

import { useCallback, useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { getLicenseUrl } from '../api/licenseClient';

export interface UpdateInfo {
  versionCode: number;
  version: string;
  url: string;
  changelog?: string;
}

/** versionCode baked into the running APK (from app.json android.versionCode). */
export function getCurrentVersionCode(): number {
  return (Constants.expoConfig?.android?.versionCode as number | undefined) ?? 1;
}

/** Human-readable version string, e.g. "v1.0.1 (2)". */
export function getCurrentVersionLabel(): string {
  const ver = Constants.expoConfig?.version ?? '1.0.0';
  const code = getCurrentVersionCode();
  return `v${ver} (${code})`;
}

export function useAppUpdate() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      // Serve update.json from the same host as the license server.
      const base = getLicenseUrl().replace(/\/+$/, '');
      const res = await fetch(`${base}/update.json`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) return;
      const data: UpdateInfo = await res.json();
      const current = getCurrentVersionCode();
      setUpdate(data.versionCode > current ? data : null);
      setLastChecked(new Date());
    } catch {
      // Network error — fail silently, user can retry manually.
    } finally {
      setChecking(false);
    }
  }, []);

  // Check once on mount.
  useEffect(() => { check(); }, [check]);

  return { update, checking, lastChecked, check };
}
