import type { DiscoverySummaryResponse, RecentTradesResponse, TokenSummaryResponse } from '@/lib/api/types';
import { discoverySummarySchema } from '@/lib/api/generated/contracts';
import { env } from '@/lib/config/env';
import { summaryMock, getMockTokenSummary } from '@/lib/mockData';
import { debugLog } from '@/lib/utils/debug';

let cachedSnapshot: DiscoverySummaryResponse | null = null;

export function clearSnapshotCacheForTests() {
  cachedSnapshot = null;
}

export async function fetchDiscoverySnapshot(): Promise<DiscoverySummaryResponse | null> {
  if (!env.discoverySnapshotUrl) return null;
  try {
    const res = await fetch(env.discoverySnapshotUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Snapshot request failed (${res.status})`);
    const raw = await res.json();
    const parsed = discoverySummarySchema.safeParse(raw);
    if (!parsed.success) throw new Error('Snapshot failed DiscoverySummaryV1 validation');
    cachedSnapshot = parsed.data;
    debugLog('Loaded discovery snapshot', parsed.data.generatedAt);
    return parsed.data;
  } catch (err) {
    console.warn('[snapshot] failed to load or validate discovery snapshot', err);
    return null;
  }
}

export async function getTokenSummaryFromSnapshot(tokenId: string): Promise<TokenSummaryResponse | null> {
  if (!cachedSnapshot) {
    const snapshot = await fetchDiscoverySnapshot();
    if (!snapshot) return null;
    cachedSnapshot = snapshot;
  }
  return (
    cachedSnapshot.latestTokens.find((item) => item.token_id === tokenId) ??
    cachedSnapshot.mostActiveTokens.find((item) => item.token_id === tokenId) ??
    null
  );
}

export async function getRecentTradesFromSnapshot(tokenId?: string): Promise<RecentTradesResponse | null> {
  if (!cachedSnapshot) {
    const snapshot = await fetchDiscoverySnapshot();
    if (!snapshot) return null;
    cachedSnapshot = snapshot;
  }
  if (!tokenId) return cachedSnapshot.recentTrades;
  return cachedSnapshot.recentTrades.filter((trade) => trade.token_id === tokenId);
}

export function getMockDiscoverySummary(): DiscoverySummaryResponse {
  return summaryMock;
}

export function getMockTokenSummaryOrNull(tokenId: string) {
  return getMockTokenSummary(tokenId);
}
