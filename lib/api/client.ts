import type { LeaderboardResponse, UserRewardsResponse, ActivityResponse, ClaimableResponse, DiscoverySummaryResponse, TokenSummaryResponse, RecentTradesResponse } from '@/lib/api/types';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export const apiAvailable = Boolean(API_BASE);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error('API base URL not configured');
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getLeaderboard: (windowKey: 'all' | '7d' | '24h') => request<LeaderboardResponse>(`/leaderboard?window=${windowKey}`),
  getUserRewards: (address: string) => request<UserRewardsResponse>(`/user/${address}`),
  getActivity: (address: string) => request<ActivityResponse>(`/user/${address}/activity`),
  getClaimable: (address: string) => request<ClaimableResponse>(`/claim/${address}`),
  getDiscoverySummary: () => request<DiscoverySummaryResponse>('/discovery/summary'),
  getTokenSummary: (tokenId: string) => request<TokenSummaryResponse>(`/tokens/${tokenId}/summary`),
  getRecentTrades: (tokenId?: string) => request<RecentTradesResponse>(tokenId ? `/tokens/${tokenId}/trades` : '/trades/recent')
};
