import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  money,
  usd,
  formatMoney,
  formatDate,
  formatDateTime,
  formatTime,
  formatDuration,
  methodLabel,
  todayIso,
  shiftIso,
} from '../format';

test('money: thousands separator + 2 decimals only when needed', () => {
  assert.equal(money(1234.5), '1 234.50');
  assert.equal(money(1000000), '1 000 000');
  assert.equal(money(0), '0');
  assert.equal(money(0.5), '0.50');
});

test('money: handles negatives, strings, null/undefined', () => {
  assert.equal(money(-1234.5), '-1 234.50');
  assert.equal(money('2500'), '2 500');
  assert.equal(money(null), '0');
  assert.equal(money(undefined), '0');
});

test('usd prefixes the $ sign', () => {
  assert.equal(usd(1234.5), '$1 234.50');
});

test('formatMoney is currency-aware', () => {
  assert.equal(formatMoney(1234567, 'UZS'), "1 234 567 so'm");
  assert.equal(formatMoney(1234.5, 'USD'), '$1 234.50');
  assert.equal(formatMoney(1234.5, null), '$1 234.50'); // default USD
});

test('date formatters reorder ISO to DD.MM.YYYY', () => {
  assert.equal(formatDate('2026-05-21'), '21.05.2026');
  assert.equal(formatDate('2026-05-21T16:43:59'), '21.05.2026');
  assert.equal(formatDate(null), '');
  assert.equal(formatDateTime('2026-05-21T16:43:59'), '21.05.2026 16:43');
  assert.equal(formatTime('2026-05-21T16:43:59'), '16:43');
  assert.equal(formatTime(undefined), '');
});

test('formatDuration: Uzbek hours/minutes', () => {
  assert.equal(formatDuration(0), '0 daqiqa');
  assert.equal(formatDuration(45), '45 daqiqa');
  assert.equal(formatDuration(75), '1 soat 15 daqiqa');
  assert.equal(formatDuration(null), '-');
});

test('methodLabel: known, currency-sensitive, and fallback', () => {
  assert.equal(methodLabel('P2P'), 'Karta (P2P)');
  assert.equal(methodLabel('TRANSFER'), 'Transfer');
  assert.equal(methodLabel('NAQD', 'USD'), 'USD (dollar)');
  assert.equal(methodLabel('NAQD', 'UZS'), "UZS (so'm)");
  assert.equal(methodLabel('KARTA'), 'Karta');
  assert.equal(methodLabel('SOMETHING_NEW'), 'SOMETHING_NEW');
});

test('todayIso / shiftIso return YYYY-MM-DD shape', () => {
  assert.match(todayIso(), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(shiftIso(-7), /^\d{4}-\d{2}-\d{2}$/);
  // shiftIso(0) equals todayIso()
  assert.equal(shiftIso(0), todayIso());
});
