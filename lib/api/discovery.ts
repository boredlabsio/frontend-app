import type { DataSource, DiscoverySummaryResponse, TokenSummaryResponse, RecentTradesResponse, SourceTagged } from '@/lib/api/types';
import { apiAvailable, api, ApiClientError, isApiClientError } from './client';
import { summaryMock, getMockTokenSummary, getMockRecentTrades } from '@/lib/mockData';
import { fetchDiscoverySnapshot, getTokenSummaryFromSnapshot, getRecentTradesFromSnapshot } from './snapshot';
import { debugLog } from '@/lib/utils/debug';
import { env } from '@/lib/config/env';

export class DataNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataNotFoundError';
  }
}

function withSource<T>(value: T, source: DataSource): SourceTagged<T> {
  if (Array.isArray(value)) {
    return Object.assign([...value], { __source: source }) as unknown as SourceTagged<T>;
  }
  return { ...(value as Record<string, unknown>), __source: source } as SourceTagged<T>;
}

function shouldFallbackFromLive(error: unknown) {
  if (!isApiClientError(error)) return true;
  return error.category !== 'not_found' && error.category !== 'disabled' && error.category !== 'misconfigured';
}

function logFallback(label: string, error: unknown) {
  if (isApiClientError(error)) {
    debugLog(label, { category: error.category, status: error.status });
    return;
  }
  debugLog(label, { error: error instanceof Error ? error.message : 'unknown' });
}

export function useDiscoverySummaryFallback(): SourceTagged<DiscoverySummaryResponse> {
  if (!env.mockDataEnabled) throw new ApiClientError('disabled', 'Mock discovery data is disabled');
  return withSource({ ...summaryMock }, 'mock');
}

export async function fetchDiscoverySummary(): Promise<SourceTagged<DiscoverySummaryResponse>> {
  if (apiAvailable) {
    try {
      return withSource(await api.getDiscoverySummary(), 'live');
    } catch (err) {
      logFallback('[discovery] live API rejected, trying snapshot', err);
      if (!shouldFallbackFromLive(err)) throw err;
      if (!env.snapshotFallbackEnabled && !env.mockDataEnabled) throw err;
    }
  } else if (!env.snapshotFallbackEnabled && !env.mockDataEnabled) {
    throw new ApiClientError(env.liveDataEnabled ? 'misconfigured' : 'disabled', env.liveDataEnabled ? 'Live API base URL is missing or invalid' : 'Live data is disabled');
  }

  if (env.snapshotFallbackEnabled) {
    const snapshot = await fetchDiscoverySnapshot();
    if (snapshot) return withSource(snapshot, 'snapshot');
  }

  if (env.mockDataEnabled) return withSource({ ...summaryMock }, 'mock');
  throw new ApiClientError('unavailable', 'Live discovery data is unavailable');
}

export async function fetchTokenSummary(tokenId: string): Promise<SourceTagged<TokenSummaryResponse>> {
  if (!tokenId || tokenId === 'missing') {
    throw new DataNotFoundError('Token id missing');
  }

  if (apiAvailable) {
    try {
      return withSource(await api.getTokenSummary(tokenId), 'live');
    } catch (err) {
      logFallback(`[token-summary] live API rejected for ${tokenId}`, err);
      if (err instanceof ApiClientError && err.category === 'not_found') {
        throw new DataNotFoundError(`Token ${tokenId} not found`);
      }
      if (!shouldFallbackFromLive(err)) throw err;
      if (!env.snapshotFallbackEnabled && !env.mockDataEnabled) throw err;
    }
  } else if (!env.snapshotFallbackEnabled && !env.mockDataEnabled) {
    throw new ApiClientError(env.liveDataEnabled ? 'misconfigured' : 'disabled', env.liveDataEnabled ? 'Live API base URL is missing or invalid' : 'Live data is disabled');
  }

  if (env.snapshotFallbackEnabled) {
    const snapshotSummary = await getTokenSummaryFromSnapshot(tokenId);
    if (snapshotSummary) return withSource(snapshotSummary, 'snapshot');
  }

  if (env.mockDataEnabled) {
    const mock = getMockTokenSummary(tokenId);
    if (mock) return withSource(mock, 'mock');
  }

  throw new DataNotFoundError(`Token ${tokenId} not found`);
}

export async function fetchRecentTrades(tokenId?: string): Promise<SourceTagged<RecentTradesResponse>> {
  if (apiAvailable) {
    try {
      if (tokenId && tokenId !== 'missing') {
        return withSource(await api.getRecentTrades(tokenId), 'live');
      }
      const summary = await api.getDiscoverySummary();
      return withSource(summary.recentTrades, 'live');
    } catch (err) {
      logFallback('[recent-trades] live API rejected, trying snapshot', err);
      if (err instanceof ApiClientError && err.category === 'not_found') return withSource([], 'live');
      if (!shouldFallbackFromLive(err)) throw err;
      if (!env.snapshotFallbackEnabled && !env.mockDataEnabled) throw err;
    }
  } else if (!env.snapshotFallbackEnabled && !env.mockDataEnabled) {
    throw new ApiClientError(env.liveDataEnabled ? 'misconfigured' : 'disabled', env.liveDataEnabled ? 'Live API base URL is missing or invalid' : 'Live data is disabled');
  }

  if (env.snapshotFallbackEnabled) {
    const snapshotTrades = await getRecentTradesFromSnapshot(tokenId && tokenId !== 'missing' ? tokenId : undefined);
    if (snapshotTrades) return withSource(snapshotTrades, 'snapshot');
  }

  if (env.mockDataEnabled) return withSource(getMockRecentTrades(tokenId && tokenId !== 'missing' ? tokenId : undefined), 'mock');
  throw new ApiClientError('unavailable', 'Live trade data is unavailable');
}
