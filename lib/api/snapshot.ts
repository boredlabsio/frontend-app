import type { DiscoverySummaryResponse, RecentTradesResponse, TokenSummaryResponse } from '@/lib/api/types';
import { env } from '@/lib/config/env';
import { summaryMock, getMockTokenSummary } from '@/lib/mockData';
import { debugLog } from '@/lib/utils/debug';

function normalizeVolume(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return value.toString();
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return '0';
}

function normalizeTradesCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

let cachedSnapshot: DiscoverySummaryResponse | null = null;

type SnapshotToken = {
  token_id?: string | number;
  tokenId?: string | number;
  id?: string | number;
  name?: string;
  symbol?: string;
  token_address?: string;
  tokenAddress?: string;
  launchToken?: string;
  address?: string;
  launchpad_market?: string;
  market?: string;
  marketAddress?: string;
  quote_token_address?: string;
  quoteToken?: string;
  quote_token?: string;
  createdAt?: string;
  first_seen_at?: string;
  status?: string;
  market_state?: string;
  priceNative?: string;
  first_trade_price_native?: string;
  change5m?: string;
  change1h?: string;
  change24h?: string;
  volume24h?: string | number;
  volume_24h?: string | number;
  volume?: string | number;
  trades24h?: number;
  trade_count?: number;
  trades?: number;
};

type SnapshotTrade = {
  token_id?: string | number;
  tokenId?: string | number;
  token_name?: string;
  token_symbol?: string;
  direction?: string;
  tx_hash?: string;
  txHash?: string;
  block_number?: string | number;
  blockNumber?: string | number;
  native_in?: string | null;
  native_out?: string | null;
  token_in?: string | null;
  token_out?: string | null;
  token_address?: string;
  quote_token_address?: string;
  execution_price_native?: string;
  execution_price_usd?: string;
  wallet?: string;
  timestamp?: string;
  first_trade_time?: string;
};

type SnapshotPayload = {
  generatedAt?: string;
  chain?: string;
  latestTokens?: SnapshotToken[];
  mostActiveTokens?: SnapshotToken[];
  recentTrades?: SnapshotTrade[];
};

function normalizeId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizeToken(token: SnapshotToken): DiscoverySummaryResponse['latestTokens'][number] {
  const tokenId = normalizeId(token.token_id ?? token.tokenId ?? token.id);
  const volumeSource = token.volume24h ?? token.volume_24h ?? token.volume;
  const tradesSource = token.trades24h ?? token.trade_count ?? token.trades;
  let status: DiscoverySummaryResponse['latestTokens'][number]['status'] = 'curve';
  if ((token.status ?? token.market_state) === 'migrated') status = 'migrated';
  else if ((token.status ?? token.market_state) === 'migration_pending') status = 'migration_pending';
  return {
    token_id: tokenId,
    name: token.name ?? `Token #${tokenId}`,
    symbol: token.symbol ?? 'TKN',
    token_address: token.token_address ?? token.tokenAddress ?? token.launchToken ?? token.address ?? '',
    launchpad_market: token.launchpad_market ?? token.market ?? token.marketAddress,
    quote_token_address: token.quote_token_address ?? token.quoteToken ?? token.quote_token ?? undefined,
    createdAt: token.createdAt ?? token.first_seen_at ?? new Date().toISOString(),
    status,
    priceNative: token.priceNative ?? token.first_trade_price_native ?? undefined,
    change5m: token.change5m ?? undefined,
    change1h: token.change1h ?? undefined,
    change24h: token.change24h ?? undefined,
    volume24h: normalizeVolume(volumeSource),
    trades24h: normalizeTradesCount(tradesSource)
  };
}

function normalizeTrade(trade: SnapshotTrade): RecentTradesResponse[number] {
  return {
    token_id: normalizeId(trade.token_id ?? trade.tokenId),
    token_name: (trade as { token_name?: string; name?: string }).token_name ?? (trade as { name?: string }).name ?? undefined,
    token_symbol: (trade as { token_symbol?: string; symbol?: string }).token_symbol ?? (trade as { symbol?: string }).symbol ?? undefined,
    direction: (trade.direction ?? 'buy').toLowerCase() === 'sell' ? 'sell' : 'buy',
    tx_hash: trade.tx_hash ?? trade.txHash ?? '',
    block_number: normalizeId(trade.block_number ?? trade.blockNumber ?? '0'),
    native_in: trade.native_in ?? null,
    native_out: trade.native_out ?? null,
    token_in: trade.token_in ?? null,
    token_out: trade.token_out ?? null,
    token_address: trade.token_address ?? '',
    quote_token_address: trade.quote_token_address ?? undefined,
    execution_price_native: trade.execution_price_native ?? '0',
    execution_price_usd: trade.execution_price_usd ?? '0',
    wallet: trade.wallet ?? undefined,
    timestamp: trade.timestamp ?? trade.first_trade_time ?? undefined
  };
}

function buildTokenSummaryFromSnapshot(tokenId: string, snapshot: DiscoverySummaryResponse): TokenSummaryResponse {
  const token = snapshot.latestTokens.find((item) => item.token_id === tokenId);
  if (!token) return getMockTokenSummary(tokenId);
  return {
    tokenId,
    name: token.name,
    symbol: token.symbol,
    image: null,
    description: `${token.name} snapshot summary`,
    priceNative: token.priceNative ?? '0',
    marketCapNative: '0',
    supply: '—',
    remaining: '—',
    volume24h: token.volume24h ?? '0',
    trades24h: 0,
    marketAddress: token.launchpad_market ?? undefined,
    tokenAddress: token.token_address,
    quoteTokenAddress: token.quote_token_address ?? undefined,
    tokenDecimals: 18,
    feeBps: 0
  };
}

export async function fetchDiscoverySnapshot(): Promise<DiscoverySummaryResponse | null> {
  if (!env.discoverySnapshotUrl) return null;
  try {
    const res = await fetch(env.discoverySnapshotUrl, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Snapshot request failed (${res.status})`);
    }
    const raw = (await res.json()) as SnapshotPayload;
    const latestTokens = Array.isArray(raw.latestTokens) ? raw.latestTokens.map(normalizeToken) : [];
    const mostActiveTokens = Array.isArray(raw.mostActiveTokens)
      ? raw.mostActiveTokens.map((token) => {
          const normalized = normalizeToken(token);
          const volumeSource = token.volume24h ?? token.volume_24h ?? token.volume ?? normalized.volume24h;
          const tradesSource = token.trades24h ?? token.trade_count ?? token.trades ?? normalized.trades24h;
          return {
            ...normalized,
            volume24h: normalizeVolume(volumeSource),
            trades24h: normalizeTradesCount(tradesSource)
          };
        })
      : latestTokens.map((token) => ({
          ...token,
          trades24h: normalizeTradesCount(token.trades24h)
        }));
    const snapshot: DiscoverySummaryResponse = {
      generatedAt: raw.generatedAt ?? new Date().toISOString(),
      chain: raw.chain ?? 'unknown',
      latestTokens,
      mostActiveTokens,
      recentTrades: Array.isArray(raw.recentTrades) ? raw.recentTrades.map(normalizeTrade) : []
    };
    cachedSnapshot = snapshot;
    debugLog('Loaded discovery snapshot', snapshot.generatedAt);
    return snapshot;
  } catch (err) {
    console.warn('[snapshot] failed to load discovery snapshot', err);
    return null;
  }
}


export async function getTokenSummaryFromSnapshot(tokenId: string): Promise<TokenSummaryResponse> {
  if (!cachedSnapshot) {
    const snapshot = await fetchDiscoverySnapshot();
    if (!snapshot) return getMockTokenSummary(tokenId);
    cachedSnapshot = snapshot;
  }
  return buildTokenSummaryFromSnapshot(tokenId, cachedSnapshot ?? summaryMock);
}

export async function getRecentTradesFromSnapshot(tokenId?: string): Promise<RecentTradesResponse> {
  if (!cachedSnapshot) {
    const snapshot = await fetchDiscoverySnapshot();
    if (!snapshot) return summaryMock.recentTrades;
    cachedSnapshot = snapshot;
  }
  if (!tokenId) return cachedSnapshot?.recentTrades ?? summaryMock.recentTrades;
  return (cachedSnapshot?.recentTrades ?? summaryMock.recentTrades).filter((trade) => trade.token_id === tokenId);
}
