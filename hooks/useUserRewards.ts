'use client';

import { useQuery } from '@tanstack/react-query';
import { api, apiAvailable } from '@/lib/api/client';
import { userSummaryMock } from '@/lib/mockData';
import type { UserRewardsResponse } from '@/lib/api/types';

export function useUserRewards(address?: string | null) {
  const enabled = apiAvailable && Boolean(address);

  const query = useQuery<UserRewardsResponse>({
    queryKey: ['userRewards', address],
    queryFn: () => api.getUserRewards(address as string),
    enabled,
    staleTime: 30_000
  });

  const error = query.isError ? (query.error as Error) : null;
  const isMock = !apiAvailable || Boolean(error);
  const fallback: UserRewardsResponse = userSummaryMock as UserRewardsResponse;
  const data: UserRewardsResponse | null = query.data ?? (isMock ? fallback : enabled ? null : fallback);

  return {
    data,
    isLoading: query.isPending && enabled,
    error,
    isMock,
    refetch: query.refetch
  } as const;
}
