'use client';

import { useQuery } from '@tanstack/react-query';
import type { SourceTagged, TokenSummaryResponse } from '@/lib/api/types';
import { fetchTokenSummary } from '@/lib/api/discovery';

export function useTokenSummary(tokenId?: string | null) {
  return useQuery<SourceTagged<TokenSummaryResponse>>({
    queryKey: ['tokenSummary', tokenId],
    queryFn: () => fetchTokenSummary(tokenId as string),
    enabled: Boolean(tokenId),
    staleTime: 15_000,
    retry: false
  });
}
