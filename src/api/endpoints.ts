// Thin wrappers around the License Server's /api/auth/* endpoints —
// every other module imports from here, not from licenseClient
// directly, so the URL/path contract lives in one place.

import { licenseApi } from './licenseClient';
import type { LoginRequest, LoginResponse, MeResponse, TotpSetupResponse } from '../types/auth';

export const AuthApi = {
  login: (body: LoginRequest) => licenseApi.post<LoginResponse>('/api/auth/login', body),
  refresh: (refreshToken: string) =>
    licenseApi.post<LoginResponse>('/api/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) =>
    licenseApi.post<void>('/api/auth/logout', { refreshToken }),
  me: () => licenseApi.get<MeResponse>('/api/auth/me'),
  totpSetup: () => licenseApi.post<TotpSetupResponse>('/api/auth/totp/setup'),
  totpConfirm: (code: string) => licenseApi.post<void>('/api/auth/totp/confirm', { code }),
  totpDisable: () => licenseApi.post<void>('/api/auth/totp/disable'),
};
