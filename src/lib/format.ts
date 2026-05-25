// Display formatting helpers — direct port of frontend/src/lib/format.js.
// The shop trades in USD; UZS is also supported.

/** 1234.5 → "$1 234.50" */
export function money(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  const negative = n < 0;
  const totalCents = Math.round(Math.abs(n) * 100);
  const whole = Math.floor(totalCents / 100);
  const cents = totalCents % 100;
  let text = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (cents > 0) {
    text += '.' + String(cents).padStart(2, '0');
  }
  return (negative ? '-' : '') + text;
}

export function usd(value: number | string | null | undefined): string {
  return '$' + money(value);
}

/** Currency-aware: "$1 234" for USD, "1 234 567 so'm" for UZS. */
export function formatMoney(
  amount: number | string | null | undefined,
  currency: string | null | undefined,
): string {
  if (currency === 'UZS') {
    return money(Math.round(Number(amount ?? 0))) + " so'm";
  }
  return '$' + money(amount);
}

/** "2026-05-21" → "21.05.2026" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

/** "2026-05-21T16:43:59" → "21.05.2026 16:43" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const datePart = formatDate(iso);
  const timePart = iso.slice(11, 16);
  return timePart ? `${datePart} ${timePart}` : datePart;
}

/** "2026-05-21T16:43:59" → "16:43" */
export function formatTime(iso: string | null | undefined): string {
  return iso ? iso.slice(11, 16) : '';
}

/** Today's date as "YYYY-MM-DD" in local time. */
export function todayIso(): string {
  const now = new Date();
  const off = now.getTimezoneOffset();
  return new Date(now.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/** ISO date N days from today (negative = past). */
export function shiftIso(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const off = now.getTimezoneOffset();
  return new Date(now.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/** Minutes → "N soat M daqiqa" */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} daqiqa`;
  return `${h} soat ${m} daqiqa`;
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  NAQD: 'Naqd',
  P2P: 'Karta (P2P)',
  TRANSFER: 'Transfer',
  KASSA: 'Kassa',
  KARTA: 'Karta',
  ARALASH: 'Aralash',
};

export function methodLabel(method: string, currency?: string | null): string {
  if (method === 'P2P') return 'Karta (P2P)';
  if (method === 'TRANSFER') return 'Transfer';
  if (method === 'NAQD') return currency === 'USD' ? 'USD (dollar)' : "UZS (so'm)";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
