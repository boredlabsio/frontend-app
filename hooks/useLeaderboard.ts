'use client';

import { useQuery } from '@tanstack/react-query';
import { api, apiAvailable } from '@/lib/api/client';
import { LeaderboardEntry, leaderboardMock } from '@/lib/mockData';
import type { LeaderboardResponse } from '@/lib/api/types';

function mapToEntries(entries: LeaderboardEntry[], selfAddress?: string | null) {
  if (!selfAddress) return entries;
  const lower = selfAddress.toLowerCase();
  return entries.map((entry) => ({ ...entry, isSelf: entry.address.toLowerCase() === lower }));
}

export function useLeaderboard(windowKey: 'all' | '7d' | '24h' = 'all', selfAddress?: string | null) {
  const query = useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', windowKey],
    queryFn: () => api.getLeaderboard(windowKey),
    enabled: apiAvailable,
    staleTime: 60_000
  });

  const error = query.isError ? (query.error as Error) : null;
  const isMock = !apiAvailable || Boolean(error);
  const base = query.data ?? leaderboardMock;
  const data = mapToEntries(base, selfAddress);

  return {
    data,
    isLoading: query.isPending && apiAvailable,
    error,
    isMock,
    refetch: query.refetch
  } as const;
}
