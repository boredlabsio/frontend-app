'use client';

import { useQuery } from '@tanstack/react-query';
import type { RecentTradesResponse } from '@/lib/api/types';
import { fetchRecentTrades } from '@/lib/api/discovery';

export function useRecentTrades(tokenId?: string | null) {
  return useQuery<RecentTradesResponse>({
    queryKey: ['recentTrades', tokenId],
    queryFn: () => fetchRecentTrades(tokenId || undefined),
    staleTime: 12_000
  });
}
