import type { DiscoverySummaryResponse, TokenSummaryResponse, RecentTradesResponse } from '@/lib/api/types';
import { apiAvailable, api } from './client';
import { summaryMock, tokenSummaryMock, tradesMock } from '@/lib/mockData';

export function useDiscoverySummaryFallback(): DiscoverySummaryResponse {
  return summaryMock;
}

export async function fetchDiscoverySummary(): Promise<DiscoverySummaryResponse> {
  if (!apiAvailable) return Promise.resolve(summaryMock);
  try {
    return await api.getDiscoverySummary();
  } catch (err) {
    console.warn('[discovery] falling back to mock', err);
    return summaryMock;
  }
}

export async function fetchTokenSummary(tokenId: string): Promise<TokenSummaryResponse> {
  if (!apiAvailable) return Promise.resolve(tokenSummaryMock);
  try {
    return await api.getTokenSummary(tokenId);
  } catch (err) {
    console.warn('[token-summary] falling back to mock', err);
    return tokenSummaryMock;
  }
}

export async function fetchRecentTrades(tokenId?: string): Promise<RecentTradesResponse> {
  if (!apiAvailable) return Promise.resolve(tradesMock);
  try {
    return await api.getRecentTrades(tokenId);
  } catch (err) {
    console.warn('[recent-trades] falling back to mock', err);
    return tradesMock;
  }
}
