// Per-account white-label brand colours. The desktop client writes
// these to CSS variables on :root; in React Native we hold them in a
// module-level holder and expose a hook so screens re-render when the
// brand changes.

import { useSyncExternalStore } from 'react';
import type { Brand } from '../types/auth';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  error: string;
}

// SavdoPRO default palette — derived from the desktop's CSS defaults
// (frontend/src/styles/*.css). Brand overrides only touch primary +
// secondary; everything else stays put so the app's chrome stays
// readable regardless of the account's brand colours.
const DEFAULT_COLORS: ThemeColors = {
  primary: '#0F766E', // teal-700
  secondary: '#0EA5E9', // sky-500
  background: '#F8FAFC', // slate-50
  surface: '#FFFFFF',
  text: '#0F172A', // slate-900
  textMuted: '#64748B', // slate-500
  border: '#E2E8F0', // slate-200
  error: '#DC2626', // red-600
};

let current: ThemeColors = DEFAULT_COLORS;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

export function applyBrand(brand: Brand | null | undefined): void {
  current = {
    ...DEFAULT_COLORS,
    primary: brand?.colorPrimary || DEFAULT_COLORS.primary,
    secondary: brand?.colorSecondary || DEFAULT_COLORS.secondary,
  };
  emit();
}

export function getColors(): ThemeColors {
  return current;
}

export function useColors(): ThemeColors {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}
