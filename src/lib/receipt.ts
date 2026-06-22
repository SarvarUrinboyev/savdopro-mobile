// ESC/POS receipt builder for 58mm Bluetooth thermal printers.
//
// Produces a Uint8Array of raw ESC/POS bytes that any Star / Xprinter /
// generic ESC/POS device understands. The printer is wired up in
// services/btPrinter.ts; this file is pure data so it can be unit-tested
// without a real device.
//
// 58mm at 32 chars wide, 80mm at 48 chars wide. Default = 32.

const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

// ESC @  — initialise printer
const INIT = [ESC, 0x40];
// ESC a 0/1/2 — left / center / right
const ALIGN_LEFT = [ESC, 0x61, 0x00];
const ALIGN_CENTER = [ESC, 0x61, 0x01];
// ESC E n  — bold on/off
const BOLD_ON = [ESC, 0x45, 0x01];
const BOLD_OFF = [ESC, 0x45, 0x00];
// GS ! n — double-height/double-width
const DOUBLE_BOTH = [GS, 0x21, 0x11];
const NORMAL_SIZE = [GS, 0x21, 0x00];
// GS V 1 — partial cut
const CUT = [GS, 0x56, 0x01];

export interface ReceiptLine {
  /** Product name. */
  name: string;
  /** Quantity (will be shown as "x N"). */
  qty: number;
  /** Per-unit price in UZS. */
  unitPrice: number;
  /** Line total in UZS (qty*unit - line discount). */
  lineTotal: number;
}

export interface ReceiptInput {
  shopName: string;
  saleId: number | string;
  cashierName?: string | null;
  customerName?: string | null;
  /** ISO timestamp; we format dd.MM HH:mm in the receipt. */
  createdAt: string;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  /** "Sotuv uchun rahmat!" or similar — printed before the cut. */
  footer?: string;
}

/**
 * Build the receipt as a raw byte sequence. Caller writes the result
 * to the BT serial port via {@code RNBluetoothClassic.write(...)}.
 */
export function buildReceipt(r: ReceiptInput, width = 32): Uint8Array {
  const out: number[] = [];
  push(out, INIT);

  // Header
  push(out, ALIGN_CENTER, BOLD_ON, DOUBLE_BOTH);
  pushText(out, r.shopName);
  pushLf(out);
  push(out, NORMAL_SIZE, BOLD_OFF);
  pushText(out, `Chek #${r.saleId}`);
  pushLf(out);
  pushText(out, formatTs(r.createdAt));
  pushLf(out);
  if (r.cashierName) {
    pushText(out, `Kassir: ${r.cashierName}`);
    pushLf(out);
  }
  if (r.customerName) {
    pushText(out, `Mijoz: ${r.customerName}`);
    pushLf(out);
  }
  push(out, ALIGN_LEFT);
  pushText(out, '-'.repeat(width));
  pushLf(out);

  // Items
  for (const line of r.lines) {
    pushText(out, line.name.slice(0, width));
    pushLf(out);
    const left = `  x${line.qty} @ ${money(line.unitPrice)}`;
    const right = money(line.lineTotal);
    pushText(out, pad(left, right, width));
    pushLf(out);
  }
  pushText(out, '-'.repeat(width));
  pushLf(out);

  // Totals
  pushText(out, pad('Subtotal', money(r.subtotal), width));
  pushLf(out);
  if (r.discount > 0) {
    pushText(out, pad('Chegirma', `- ${money(r.discount)}`, width));
    pushLf(out);
  }
  push(out, BOLD_ON, DOUBLE_BOTH);
  pushText(out, pad('JAMI', `${money(r.total)} so'm`, Math.floor(width / 2)));
  pushLf(out);
  push(out, NORMAL_SIZE, BOLD_OFF);
  pushText(out, pad("To'lov", r.paymentMethod, width));
  pushLf(out);
  pushLf(out);

  // Footer + cut
  if (r.footer) {
    push(out, ALIGN_CENTER);
    pushText(out, r.footer);
    pushLf(out);
  }
  pushLf(out); pushLf(out); pushLf(out);
  push(out, CUT);

  return new Uint8Array(out);
}

// ---------------------------------------------------------------- helpers

function push(buf: number[], ...parts: number[][]) {
  for (const p of parts) for (const b of p) buf.push(b);
}
function pushText(buf: number[], s: string) {
  // ESC/POS printers handle ASCII safely; non-ASCII Cyrillic / Uzbek
  // diacritics need a code-page command which varies per device.
  // For now we strip diacritics so 99% of printers render correctly.
  for (const ch of normalize(s)) buf.push(ch.charCodeAt(0));
}
function pushLf(buf: number[]) {
  buf.push(LF);
}
function normalize(s: string): string {
  return s
    .replace(/[ʻʼʹ’]/g, "'")
    .replace(/Oʻ|Oʼ|O'/g, "O'")
    .replace(/oʻ|oʼ|o'/g, "o'")
    .replace(/Gʻ|Gʼ|G'/g, "G'")
    .replace(/gʻ|gʼ|g'/g, "g'");
}
function pad(left: string, right: string, width: number): string {
  const max = Math.max(0, width - right.length);
  const ltrim = left.length > max ? left.slice(0, max) : left;
  const fill = ' '.repeat(Math.max(1, width - ltrim.length - right.length));
  return ltrim + fill + right;
}
function money(n: number): string {
  return Math.round(n).toLocaleString('en-US').replace(/,/g, ' ');
}
function formatTs(iso: string): string {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}` : iso;
}
