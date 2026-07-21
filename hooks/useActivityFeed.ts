'use client';

import { useQuery } from '@tanstack/react-query';
import { api, apiAvailable } from '@/lib/api/client';
import { activityMock } from '@/lib/mockData';
import type { ActivityItemApi, ActivityResponse } from '@/lib/api/types';

export function useActivityFeed(address?: string | null) {
  const enabled = apiAvailable && Boolean(address);

  const query = useQuery<ActivityResponse>({
    queryKey: ['activity', address],
    queryFn: () => api.getActivity(address as string),
    enabled,
    staleTime: 15_000
  });

  const error = query.isError ? (query.error as Error) : null;
  const isMock = !apiAvailable;

  const data: ActivityItemApi[] = query.data?.items ?? (isMock ? activityMock : []);

  return {
    data,
    isLoading: query.isPending && enabled,
    error,
    isMock,
    refetch: query.refetch
  } as const;
}
