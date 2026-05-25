// HTTP client for the SavdoPRO local backend (barakat-market).
//
// The backend URL is stored separately in MMKV so it can point to
// the VPS (for use from any device) independently of the License Server.
// Both share the same JWT token issued by the License Server.
//
// Refresh flow: on 401, delegates to licenseClient.refreshOnce() via the
// registered handler, then retries the original request once.

import { storage, STORAGE_KEYS } from '../storage/mmkv';
import { getAccessToken, setLicenseUnauthorizedHandler } from './licenseClient';

// Default: same origin as the License Server (nginx routes /api/* to backend).
// Can be overridden via setBackendUrl() or the in-app settings.
const DEFAULT_BACKEND_URL = 'https://167-172-164-214.nip.io';

export function getBackendUrl(): string {
  return storage.getString(STORAGE_KEYS.BACKEND_URL) || DEFAULT_BACKEND_URL;
}

export function setBackendUrl(url: string | null): void {
  if (url) {
    storage.set(STORAGE_KEYS.BACKEND_URL, url);
  } else {
    storage.remove(STORAGE_KEYS.BACKEND_URL);
  }
}

// 15-second timeout — backend may be slower than auth endpoints.
const FETCH_TIMEOUT_MS = 15_000;

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function rawFetch(method: Method, path: string, body?: unknown): Promise<Response> {
  const base = getBackendUrl().replace(/\/+$/, '');
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
    return await fetch(`${base}/api${path}`, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export class BackendError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]> | null;
  constructor(message: string, status: number, fieldErrors?: Record<string, string[]> | null) {
    super(message);
    this.name = 'BackendError';
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

let onUnauthorized: (() => void) | null = null;
export function setBackendUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function request<T = unknown>(method: Method, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await rawFetch(method, path, body);
  } catch (e) {
    const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    throw new BackendError(
      `Serverga ulanib bo'lmadi — ${detail}`,
      0,
    );
  }

  if (response.status === 401 || response.status === 403) {
    if (onUnauthorized) onUnauthorized();
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
    throw new BackendError(message, response.status, data?.fieldErrors as Record<string, string[]>);
  }
  return data as T;
}

export const backendApi = {
  get: <T = unknown>(path: string) => request<T>('GET', path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T = unknown>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  del: <T = unknown>(path: string) => request<T>('DELETE', path),
};
