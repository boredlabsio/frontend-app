'use client';

import { useQuery } from '@tanstack/react-query';
import type { RecentTradesResponse, SourceTagged } from '@/lib/api/types';
import { fetchRecentTrades } from '@/lib/api/discovery';

export function useRecentTrades(tokenId?: string | null) {
  return useQuery<SourceTagged<RecentTradesResponse>>({
    queryKey: ['recentTrades', tokenId],
    queryFn: () => fetchRecentTrades(tokenId || undefined),
    staleTime: 12_000,
    retry: false
  });
}
