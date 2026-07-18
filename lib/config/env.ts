function parsePublicBoolean(value: string | undefined, defaultValue = false) {
  if (value === undefined || value === '') return defaultValue;
  const normalized = value.toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function parsePositiveInt(value: string | undefined, defaultValue: number) {
  if (!value) return defaultValue;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

function normalizeApiBase(rawValue: string | undefined) {
  if (!rawValue) return { value: '', valid: false };
  try {
    const url = new URL(rawValue);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return { value: '', valid: false };
    url.pathname = url.pathname.replace(/\/+$/, '');
    url.search = '';
    url.hash = '';
    return { value: url.toString().replace(/\/$/, ''), valid: true };
  } catch {
    return { value: '', valid: false };
  }
}

const apiBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE);

export const env = {
  liveDataEnabled: parsePublicBoolean(process.env.NEXT_PUBLIC_LIVE_DATA_ENABLED, false),
  apiBase: apiBase.value,
  apiBaseValid: apiBase.valid,
  apiTimeoutMs: parsePositiveInt(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 2_000),
  discoverySnapshotUrl: process.env.NEXT_PUBLIC_SUMMARY_SNAPSHOT_URL || '/snapshots/discovery-summary.v1.json',
  debugLogs: parsePublicBoolean(process.env.NEXT_PUBLIC_DEBUG_LOGS, false),
  buyEnabled: parsePublicBoolean(process.env.NEXT_PUBLIC_FEATURE_ENABLE_BUY, false),
  sellEnabled: parsePublicBoolean(process.env.NEXT_PUBLIC_FEATURE_ENABLE_SELL, false)
};
