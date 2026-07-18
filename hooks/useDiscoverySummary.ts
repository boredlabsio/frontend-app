'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDiscoverySummary } from '@/lib/api/discovery';
import type { DiscoverySummaryResponse, SourceTagged } from '@/lib/api/types';

export function useDiscoverySummary() {
  const query = useQuery<SourceTagged<DiscoverySummaryResponse>>({
    queryKey: ['discoverySummary'],
    queryFn: fetchDiscoverySummary,
    staleTime: 15_000,
    retry: false
  });

  return query;
}
