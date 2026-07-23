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

function parseAddressAllowlist(value: string | undefined) {
  if (!value) return [] as string[];
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => /^0x[0-9a-f]{40}$/.test(item));
}

const apiBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE);
const nonProduction = process.env.NODE_ENV !== 'production';

export const env = {
  liveDataEnabled: parsePublicBoolean(process.env.NEXT_PUBLIC_LIVE_DATA_ENABLED, false),
  apiBase: apiBase.value,
  apiBaseValid: apiBase.valid,
  apiTimeoutMs: parsePositiveInt(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 2_000),
  discoverySnapshotUrl: process.env.NEXT_PUBLIC_SUMMARY_SNAPSHOT_URL || '/snapshots/discovery-summary.v1.json',
  snapshotFallbackEnabled: parsePublicBoolean(process.env.NEXT_PUBLIC_SNAPSHOT_FALLBACK_ENABLED, nonProduction),
  mockDataEnabled: parsePublicBoolean(process.env.NEXT_PUBLIC_MOCK_DATA_ENABLED, nonProduction),
  debugLogs: parsePublicBoolean(process.env.NEXT_PUBLIC_DEBUG_LOGS, false),
  buyEnabled: parsePublicBoolean(process.env.NEXT_PUBLIC_BUY_ENABLED ?? process.env.NEXT_PUBLIC_FEATURE_ENABLE_BUY, false),
  buyTestnetOnly: parsePublicBoolean(process.env.NEXT_PUBLIC_BUY_TESTNET_ONLY, true),
  buyChainId: parsePositiveInt(process.env.NEXT_PUBLIC_BUY_CHAIN_ID, 11155111),
  buyMaxNativeAmount: process.env.NEXT_PUBLIC_BUY_MAX_NATIVE_AMOUNT || '10000000000000000',
  buyAllowedWallets: parseAddressAllowlist(process.env.NEXT_PUBLIC_BUY_ALLOWED_WALLETS),
  tokenCreationEnabled: parsePublicBoolean(process.env.NEXT_PUBLIC_TOKEN_CREATION_ENABLED, false),
  tokenCreationTestnetOnly: parsePublicBoolean(process.env.NEXT_PUBLIC_TOKEN_CREATION_TESTNET_ONLY, true),
  tokenCreationChainId: parsePositiveInt(process.env.NEXT_PUBLIC_TOKEN_CREATION_CHAIN_ID, 11155111),
  tokenCreationAllowedWallets: parseAddressAllowlist(process.env.NEXT_PUBLIC_TOKEN_CREATION_ALLOWED_WALLETS),
  sellEnabled: parsePublicBoolean(process.env.NEXT_PUBLIC_SELL_ENABLED ?? process.env.NEXT_PUBLIC_FEATURE_ENABLE_SELL, false),
  rewardsEnabled: parsePublicBoolean(process.env.NEXT_PUBLIC_REWARDS_ENABLED ?? process.env.NEXT_PUBLIC_FEATURE_ENABLE_REWARDS, false),
  claimsEnabled: parsePublicBoolean(process.env.NEXT_PUBLIC_CLAIMS_ENABLED, false)
};
