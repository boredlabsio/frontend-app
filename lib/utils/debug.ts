import { env } from '@/lib/config/env';

export function debugLog(...args: unknown[]) {
  if (!env.debugLogs) return;
  if (typeof console !== 'undefined') {
    console.log('[debug]', ...args);
  }
}
