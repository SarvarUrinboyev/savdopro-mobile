// Domain-grouped REST calls — port of frontend/src/api/endpoints.js.
//
// Auth + Admin endpoints → License Server (licenseApi).
// Everything else        → barakat-market backend (backendApi).

import { backendApi } from './backendClient';
import { licenseApi } from './licenseClient';
import type { LoginRequest, LoginResponse, MeResponse, TotpSetupResponse } from '../types/auth';

// ─── Query string helper ──────────────────────────────────────────────────────

function qs(params?: Record<string, unknown>): string {
  if (!params) return '';
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return pairs.length ? `?${pairs.join('&')}` : '';
}

// ─── Auth (License Server) ────────────────────────────────────────────────────

export const AuthApi = {
  login: (body: LoginRequest)         => licenseApi.post<LoginResponse>('/api/auth/login', body),
  refresh: (refreshToken: string)     => licenseApi.post<LoginResponse>('/api/auth/refresh', { refreshToken }),
  logout: (refreshToken: string)      => licenseApi.post<void>('/api/auth/logout', { refreshToken }),
  me: ()                              => licenseApi.get<MeResponse>('/api/auth/me'),
  totpSetup: ()                       => licenseApi.post<TotpSetupResponse>('/api/auth/totp/setup'),
  totpConfirm: (code: string)         => licenseApi.post<void>('/api/auth/totp/confirm', { code }),
  totpDisable: ()                     => licenseApi.post<void>('/api/auth/totp/disable'),
};

// ─── Admin (License Server) ───────────────────────────────────────────────────

export const AdminApi = {
  listAccounts: ()                               => licenseApi.get('/api/admin/accounts'),
  accountDetail: (id: number)                    => licenseApi.get(`/api/admin/accounts/${id}`),
  createAccount: (body: unknown)                 => licenseApi.post('/api/admin/accounts', body),
  updateAccount: (id: number, body: unknown)     => licenseApi.put(`/api/admin/accounts/${id}`, body),
  setBlocked: (id: number, blocked: boolean)     => licenseApi.patch(`/api/admin/accounts/${id}/block`, { blocked }),
  deleteAccount: (id: number)                    => licenseApi.del(`/api/admin/accounts/${id}`),
  createUser: (accountId: number, body: unknown) => licenseApi.post(`/api/admin/accounts/${accountId}/users`, body),
  resetPassword: (userId: number, password: string) => licenseApi.patch(`/api/admin/users/${userId}/password`, { password }),
  deleteUser: (userId: number)                   => licenseApi.del(`/api/admin/users/${userId}`),
  auditList: (page = 0, size = 50)              => licenseApi.get(`/api/admin/audit${qs({ page, size })}`),
};

// ─── Dashboard (Backend) ──────────────────────────────────────────────────────

export const DashboardApi = {
  today: () => backendApi.get('/dashboard'),
};

// ─── Exchange rate ────────────────────────────────────────────────────────────

export const ExchangeRateApi = {
  get: () => backendApi.get('/exchange-rate'),
};

// ─── Balance ─────────────────────────────────────────────────────────────────

export const BalanceApi = {
  today: () => backendApi.get('/balance/today'),
  set:   (body: unknown) => backendApi.post('/balance', body),
};

// ─── Products / Warehouse ────────────────────────────────────────────────────

export const ProductApi = {
  list:       (params?: Record<string, unknown>) => backendApi.get('/products' + qs(params)),
  get:        (id: number)                       => backendApi.get(`/products/${id}`),
  create:     (body: unknown)                    => backendApi.post('/products', body),
  update:     (id: number, body: unknown)        => backendApi.put(`/products/${id}`, body),
  remove:     (id: number)                       => backendApi.del(`/products/${id}`),
  adjust:     (id: number, body: unknown)        => backendApi.patch(`/products/${id}/adjust`, body),
  movements:  (id: number)                       => backendApi.get(`/products/${id}/movements`),
  scan:       (body: unknown)                    => backendApi.post('/products/scan', body),
};

// ─── Categories ──────────────────────────────────────────────────────────────

export const CategoryApi = {
  list:   ()                   => backendApi.get('/categories'),
  create: (body: unknown)      => backendApi.post('/categories', body),
  remove: (id: number)         => backendApi.del(`/categories/${id}`),
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export const OrderApi = {
  all:      ()                            => backendApi.get('/orders'),
  grouped:  ()                            => backendApi.get('/orders/grouped'),
  today:    ()                            => backendApi.get('/orders/today'),
  create:   (body: unknown)               => backendApi.post('/orders', body),
  update:   (id: number, body: unknown)   => backendApi.put(`/orders/${id}`, body),
  remove:   (id: number)                  => backendApi.del(`/orders/${id}`),
  complete: (id: number, body: unknown)   => backendApi.patch(`/orders/${id}/complete`, body),
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export const ExpenseApi = {
  list:         (params?: Record<string, unknown>) => backendApi.get('/expenses' + qs(params)),
  create:       (body: unknown)                    => backendApi.post('/expenses', body),
  update:       (id: number, body: unknown)        => backendApi.put(`/expenses/${id}`, body),
  remove:       (id: number)                       => backendApi.del(`/expenses/${id}`),
  bulkPreview:  (body: unknown)                    => backendApi.post('/expenses/bulk-import/preview', body),
  bulkImport:   (body: unknown)                    => backendApi.post('/expenses/bulk-import', body),
};

// ─── Home Expenses (Do'kon xarajatlari) ──────────────────────────────────────

export const HomeExpenseApi = {
  list:         (params?: Record<string, unknown>) => backendApi.get('/home-expenses' + qs(params)),
  create:       (body: unknown)                    => backendApi.post('/home-expenses', body),
  update:       (id: number, body: unknown)        => backendApi.put(`/home-expenses/${id}`, body),
  remove:       (id: number)                       => backendApi.del(`/home-expenses/${id}`),
};

// ─── Payments ────────────────────────────────────────────────────────────────

export const PaymentApi = {
  list:    (params?: Record<string, unknown>)     => backendApi.get('/payments' + qs(params)),
  create:  (body: unknown)                        => backendApi.post('/payments', body),
  update:  (id: number, body: unknown)            => backendApi.put(`/payments/${id}`, body),
  remove:  (id: number)                           => backendApi.del(`/payments/${id}`),
  parties: (category?: string)                    => backendApi.get('/payments/parties' + qs({ category })),
};

// ─── Customers ────────────────────────────────────────────────────────────────

export const CustomerApi = {
  list:               ()                                    => backendApi.get('/customers'),
  detail:             (id: number)                          => backendApi.get(`/customers/${id}`),
  create:             (body: unknown)                       => backendApi.post('/customers', body),
  update:             (id: number, body: unknown)           => backendApi.put(`/customers/${id}`, body),
  remove:             (id: number)                          => backendApi.del(`/customers/${id}`),
  addTransaction:     (id: number, body: unknown)           => backendApi.post(`/customers/${id}/transactions`, body),
  updateTransaction:  (id: number, txId: number, body: unknown) => backendApi.put(`/customers/${id}/transactions/${txId}`, body),
  removeTransaction:  (id: number, txId: number)            => backendApi.del(`/customers/${id}/transactions/${txId}`),
  redeemPoints:       (id: number, points: number)          => backendApi.post(`/customers/${id}/loyalty/redeem`, { points }),
};

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const SupplierApi = {
  list:   ()                          => backendApi.get('/suppliers'),
  detail: (id: number)                => backendApi.get(`/suppliers/${id}`),
  create: (body: unknown)             => backendApi.post('/suppliers', body),
  update: (id: number, body: unknown) => backendApi.put(`/suppliers/${id}`, body),
  remove: (id: number)                => backendApi.del(`/suppliers/${id}`),
};

// ─── Debts ───────────────────────────────────────────────────────────────────

export const DebtApi = {
  summary:    ()                              => backendApi.get('/debts/summary'),
  // My debts (Mening qarzlarim)
  myList:     ()                              => backendApi.get('/debtors'),
  myCreate:   (body: unknown)                 => backendApi.post('/debtors', body),
  myUpdate:   (id: number, body: unknown)     => backendApi.put(`/debtors/${id}`, body),
  myRemove:   (id: number)                    => backendApi.del(`/debtors/${id}`),
  myPay:      (id: number, body: unknown)     => backendApi.patch(`/debtors/${id}/partial-pay`, body),
  myAdd:      (id: number, body: unknown)     => backendApi.patch(`/debtors/${id}/add-amount`, body),
  myHistory:  (id: number)                    => backendApi.get(`/debtors/${id}/history`),
  // Customer debts
  custList:   ()                              => backendApi.get('/customer-debts'),
  custCreate: (body: unknown)                 => backendApi.post('/customer-debts', body),
  custUpdate: (id: number, body: unknown)     => backendApi.put(`/customer-debts/${id}`, body),
  custRemove: (id: number)                    => backendApi.del(`/customer-debts/${id}`),
  custPay:    (id: number, body: unknown)     => backendApi.patch(`/customer-debts/${id}/partial-pay`, body),
  custAdd:    (id: number, body: unknown)     => backendApi.patch(`/customer-debts/${id}/add-amount`, body),
  custHistory:(id: number)                    => backendApi.get(`/customer-debts/${id}/history`),
};

// ─── Shifts ──────────────────────────────────────────────────────────────────

export const ShiftApi = {
  history:      ()              => backendApi.get('/shifts'),
  current:      ()              => backendApi.get('/shifts/current'),
  open:         (body: unknown) => backendApi.post('/shifts/open', body),
  close:        ()              => backendApi.post('/shifts/close'),
  clearHistory: ()              => backendApi.del('/shifts/history'),
};

// ─── Terminal (POS) ──────────────────────────────────────────────────────────

export const TerminalApi = {
  today:   ()              => backendApi.get('/terminal/today'),
  history: ()              => backendApi.get('/terminal/history'),
  save:    (body: unknown) => backendApi.post('/terminal', body),
};

// ─── Shops ───────────────────────────────────────────────────────────────────

export const ShopApi = {
  list:    ()                          => backendApi.get('/shops'),
  create:  (body: unknown)             => backendApi.post('/shops', body),
  update:  (id: number, body: unknown) => backendApi.put(`/shops/${id}`, body),
  setMain: (id: number)                => backendApi.patch(`/shops/${id}/main`),
  remove:  (id: number)                => backendApi.del(`/shops/${id}`),
};

// ─── Transfers ───────────────────────────────────────────────────────────────

export const TransferApi = {
  list:   ()              => backendApi.get('/transfers'),
  create: (body: unknown) => backendApi.post('/transfers', body),
};

// ─── Management / Analytics ──────────────────────────────────────────────────

export const ManagementApi = {
  summary:      (params?: Record<string, unknown>) => backendApi.get('/management/summary' + qs(params)),
  soldGoods:    (params?: Record<string, unknown>) => backendApi.get('/management/sold-goods' + qs(params)),
  createCost:   (body: unknown)                    => backendApi.post('/management/costs', body),
  updateCost:   (id: number, body: unknown)        => backendApi.put(`/management/costs/${id}`, body),
  removeCost:   (id: number)                       => backendApi.del(`/management/costs/${id}`),
};

// ─── Reports ─────────────────────────────────────────────────────────────────

export const ReportApi = {
  endOfDay:     (date: string)  => backendApi.get(`/report/end-of-day${qs({ date })}`),
  sendTelegram: (date: string)  => backendApi.post(`/report/send-telegram${qs({ date })}`),
};
