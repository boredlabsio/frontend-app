import type { DataSource, DiscoverySummaryResponse, TokenSummaryResponse, RecentTradesResponse } from '@/lib/api/types';
import { apiAvailable, api } from './client';
import { summaryMock, getMockTokenSummary, getMockRecentTrades } from '@/lib/mockData';
import { fetchDiscoverySnapshot, getTokenSummaryFromSnapshot, getRecentTradesFromSnapshot } from './snapshot';

function withSource<T>(value: T, source: DataSource): T & { __source: DataSource } {
  if (Array.isArray(value)) {
    return Object.assign([...value], { __source: source }) as unknown as T & { __source: DataSource };
  }
  return { ...(value as Record<string, unknown>), __source: source } as T & { __source: DataSource };
}

export function useDiscoverySummaryFallback(): DiscoverySummaryResponse & { __source: DataSource } {
  return withSource({ ...summaryMock }, 'mock');
}

export async function fetchDiscoverySummary(): Promise<DiscoverySummaryResponse & { __source: DataSource }> {
  if (apiAvailable) {
    try {
      const data = await api.getDiscoverySummary();
      return withSource(data, 'api');
    } catch (err) {
      console.warn('[discovery] API failed, trying snapshot', err);
    }
  }

  const snapshot = await fetchDiscoverySnapshot();
  if (snapshot) {
    return withSource(snapshot, 'snapshot');
  }

  return withSource({ ...summaryMock }, 'mock');
}

export async function fetchTokenSummary(tokenId: string): Promise<TokenSummaryResponse & { __source: DataSource }> {
  if (apiAvailable) {
    try {
      const data = await api.getTokenSummary(tokenId);
      return withSource(data, 'api');
    } catch (err) {
      console.warn(`[token-summary] API failed for ${tokenId}, trying snapshot`, err);
    }
  }

  const snapshotSummary = await getTokenSummaryFromSnapshot(tokenId);
  if (snapshotSummary) {
    return withSource(snapshotSummary, 'snapshot');
  }

  return withSource(getMockTokenSummary(tokenId), 'mock');
}

export async function fetchRecentTrades(tokenId?: string): Promise<RecentTradesResponse & { __source: DataSource }> {
  if (apiAvailable) {
    try {
      const data = await api.getRecentTrades(tokenId);
      return withSource(data, 'api');
    } catch (err) {
      console.warn('[recent-trades] API failed, trying snapshot', err);
    }
  }

  const snapshotTrades = await getRecentTradesFromSnapshot(tokenId);
  if (snapshotTrades) {
    return withSource(snapshotTrades, 'snapshot');
  }

  return withSource(getMockRecentTrades(tokenId), 'mock');
}
