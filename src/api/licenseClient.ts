// HTTP client for the SavdoPRO License Server — React Native port of
// barakat-supermarket/frontend/src/api/licenseClient.js.
//
// Differences from the desktop client:
//   - Storage is MMKV (synchronous) instead of localStorage.
//   - There is no Electron query-string injection; the URL comes from
//     MMKV or the compile-time default (LAN IP for dev).
//   - All token reads/writes happen here so the rest of the app never
//     touches MMKV directly for auth state.
//
// Refresh flow (unchanged from desktop):
//   - On any 401, call /api/auth/refresh with the stored refresh token,
//     persist the new pair, and replay the original request once.
//   - Parallel 401s coalesce into a single in-flight refresh promise so
//     20 concurrent requests don't trigger 20 refreshes.
//   - If the refresh itself fails we wipe both tokens and notify the
//     registered unauthorized-handler.

import { storage, STORAGE_KEYS } from '../storage/mmkv';
import type { FieldErrors, LoginResponse } from '../types/auth';

// Dev default — laptop's LAN IP on Sarvar's Wi-Fi. Phone + laptop must
// share the network. Change via the Login screen's "Server URL" field.
const DEFAULT_URL = 'https://167-172-164-214.nip.io';

export function getLicenseUrl(): string {
  return storage.getString(STORAGE_KEYS.LICENSE_URL) || DEFAULT_URL;
}

export function setLicenseUrl(url: string | null): void {
  if (url) {
    storage.set(STORAGE_KEYS.LICENSE_URL, url);
  } else {
    storage.remove(STORAGE_KEYS.LICENSE_URL);
  }
}

export function getAccessToken(): string | null {
  return storage.getString(STORAGE_KEYS.ACCESS_TOKEN) ?? null;
}

export function setAccessToken(token: string | null): void {
  if (token) {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
  } else {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
  }
}

export function getRefreshToken(): string | null {
  return storage.getString(STORAGE_KEYS.REFRESH_TOKEN) ?? null;
}

export function setRefreshToken(token: string | null): void {
  if (token) {
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, token);
  } else {
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  }
}

export function persistAuthPair(
  response: Pick<LoginResponse, 'token' | 'refreshToken'> | null | undefined,
): void {
  if (!response) return;
  if (response.token) setAccessToken(response.token);
  if (response.refreshToken) setRefreshToken(response.refreshToken);
}

export function clearAuthPair(): void {
  setAccessToken(null);
  setRefreshToken(null);
}

// ============================================================ unauthorized

type UnauthorizedHandler = (status: number) => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setLicenseUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
): void {
  onUnauthorized = handler;
}

// ============================================================ refresh

// In-flight refresh promise. Parallel 401s await the same promise so
// only one refresh round-trip ever happens at a time.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshOnce(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const stored = getRefreshToken();
  if (!stored) return null;
  const base = getLicenseUrl().replace(/\/+$/, '');
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${base}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: stored }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as LoginResponse;
      persistAuthPair(data);
      return data.token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// ============================================================ request

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// 10-second hard timeout on every request — prevents the login button
// from freezing indefinitely when the server is unreachable.
const FETCH_TIMEOUT_MS = 10_000;

async function rawFetch(method: Method, path: string, body?: unknown): Promise<Response> {
  const base = getLicenseUrl().replace(/\/+$/, '');
  const headers: Record<string, string> = {};
  let payload: string | undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(`${base}${path}`, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export class LicenseError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors | null;
  constructor(message: string, status: number, fieldErrors?: FieldErrors | null) {
    super(message);
    this.name = 'LicenseError';
    this.status = status;
    this.fieldErrors = fieldErrors ?? null;
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request<T = unknown>(method: Method, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await rawFetch(method, path, body);
  } catch (e) {
    const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    throw new LicenseError(
      `Ulanib bo'lmadi [${getLicenseUrl()}] — ${detail}`,
      0,
    );
  }

  // 401 → silent refresh + retry once. Skip on the refresh endpoint
  // itself to avoid infinite loops.
  if (response.status === 401 && path !== '/api/auth/refresh') {
    const fresh = await refreshOnce();
    if (fresh) {
      try {
        response = await rawFetch(method, path, body);
      } catch {
        throw new LicenseError("License Server'ga ulanib bo'lmadi.", 0);
      }
    }
  }

  if (response.status === 401 || response.status === 403) {
    clearAuthPair();
    if (onUnauthorized) onUnauthorized(response.status);
  }

  if (response.status === 204) return null as T;

  const text = await response.text();
  const data = text ? (safeParse(text) as Record<string, unknown> | null) : null;

  if (!response.ok) {
    const message =
      (data?.message as string | undefined) ||
      (data?.detail as string | undefined) ||
      (data?.title as string | undefined) ||
      `Xatolik yuz berdi (${response.status})`;
    throw new LicenseError(message, response.status, data?.fieldErrors as FieldErrors | undefined);
  }
  return data as T;
}

export const licenseApi = {
  get: <T = unknown>(path: string) => request<T>('GET', path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T = unknown>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  del: <T = unknown>(path: string) => request<T>('DELETE', path),
};
