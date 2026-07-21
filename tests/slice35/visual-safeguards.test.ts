import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../../app/layout.tsx', import.meta.url), 'utf8');
const env = readFileSync(new URL('../../lib/config/env.ts', import.meta.url), 'utf8');

function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const linear = channels.map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground: string, background: string) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('dark theme is deterministic and independent of browser color preference', () => {
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /--background:\s*#020617/);
  assert.match(css, /--foreground:\s*#f8fafc/);
  assert.doesNotMatch(css, /prefers-color-scheme/);
  assert.match(layout, /data-theme="dark"/);
  assert.match(layout, /data-app-shell/);
});

test('semantic fallbacks cover shell, surfaces, muted text, alerts, and disabled controls', () => {
  for (const selector of ['[data-app-shell]', '[class*="bg-slate-900"]', '[class*="text-white/60"]', 'button:disabled', '[role="alert"]']) {
    assert.ok(css.includes(selector), `missing fallback selector ${selector}`);
  }
});

test('core foreground and muted tokens exceed WCAG AA contrast on app surfaces', () => {
  assert.ok(contrast('#f8fafc', '#020617') >= 7);
  assert.ok(contrast('#cbd5e1', '#020617') >= 4.5);
  assert.ok(contrast('#cbd5e1', '#0f172a') >= 4.5);
  assert.ok(contrast('#fef3c7', '#451a03') >= 4.5);
});

test('financial defaults remain fail-closed', () => {
  assert.match(env, /buyEnabled:[^\n]+false/);
  assert.match(env, /sellEnabled:[^\n]+false/);
});
