// Session state for the mobile app — React Native port of
// barakat-supermarket/frontend/src/context/Auth.jsx.
//
// On mount: if either token is still in MMKV, call /me to resurrect
// the session (the license client will silently refresh if the access
// JWT is stale). Otherwise render Login.
//
// Errors are split:
//   - 401 / 403 / "sessiya|akkaunt" message  → clear tokens, set user=null
//   - everything else (status 0, 5xx, License Server down) → keep
//     tokens so the user is auto-logged-in on the next attempt.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AuthApi } from '../api/endpoints';
import {
  clearAuthPair,
  getAccessToken,
  getRefreshToken,
  persistAuthPair,
  setLicenseUnauthorizedHandler,
} from '../api/licenseClient';
import { applyBrand } from '../theme/brand';
import type { MeResponse } from '../types/auth';

interface AuthContextValue {
  user: MeResponse | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string, totpCode?: string) => Promise<MeResponse>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await AuthApi.me();
      setUser(me);
      applyBrand(me?.brand);
    } catch (err: unknown) {
      const status = (err as { status?: number } | null)?.status;
      const message = (err as Error | null)?.message ?? '';
      const isAuthReject =
        status === 401 || status === 403 || /sessiya|akkaunt/i.test(message);
      if (isAuthReject) {
        clearAuthPair();
        setUser(null);
      } else {
        setError(message || "Serverga ulanib bo'lmadi");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLicenseUnauthorizedHandler(() => setUser(null));
    if (getAccessToken() || getRefreshToken()) {
      void loadMe();
    } else {
      setLoading(false);
    }
    return () => setLicenseUnauthorizedHandler(null);
  }, [loadMe]);

  const login = useCallback(async (username: string, password: string, totpCode?: string) => {
    const response = await AuthApi.login({ username, password, totpCode });
    persistAuthPair(response);
    setUser(response.user);
    applyBrand(response.user?.brand);
    setError(null);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    const rt = getRefreshToken();
    if (rt) {
      AuthApi.logout(rt).catch(() => {
        /* best-effort revoke; local clear happens either way */
      });
    }
    clearAuthPair();
    setUser(null);
    applyBrand(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, login, logout, refresh: loadMe }),
    [user, loading, error, login, logout, loadMe],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth() outside <AuthProvider>');
  return ctx;
}
