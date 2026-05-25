// Mirror of License Server's AuthDtos (Java records).
// Source of truth: barakat-supermarket/license-server/.../AuthDtos.java

export type UserRole = 'SUPER_ADMIN' | 'ACCOUNT_OWNER' | 'SHOP_USER';

export interface Brand {
  name: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  logoUrl: string | null;
  footerNote: string | null;
}

export interface MeResponse {
  userId: number;
  username: string;
  fullName: string | null;
  role: UserRole;
  accountId: number | null;
  accountName: string | null;
  subscriptionExpires: string | null; // ISO date
  daysUntilBlock: number;
  blocked: boolean;
  brand: Brand | null;
}

export interface LoginRequest {
  username: string;
  password: string;
  totpCode?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  accessExpiresInSec: number;
  refreshExpiresAt: string; // ISO datetime
  user: MeResponse;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface TotpSetupResponse {
  secret: string;
  otpauthUri: string;
}

export interface FieldErrors {
  [field: string]: string;
}
