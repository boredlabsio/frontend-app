'use client';

import { useQuery } from '@tanstack/react-query';
import { api, apiAvailable } from '@/lib/api/client';
import type { ClaimableResponse } from '@/lib/api/types';

const fallback: ClaimableResponse = { claimable: 0 };

export function useClaimable(address?: string | null) {
  const enabled = apiAvailable && Boolean(address);

  const query = useQuery<ClaimableResponse>({
    queryKey: ['claimable', address],
    queryFn: () => api.getClaimable(address as string),
    enabled,
    staleTime: 30_000
  });

  const error = query.isError ? (query.error as Error) : null;
  const isMock = !apiAvailable || Boolean(error);

  const data: ClaimableResponse | null = query.data ?? (isMock ? fallback : enabled ? null : fallback);

  return {
    data,
    isLoading: query.isPending && enabled,
    error,
    isMock,
    refetch: query.refetch
  } as const;
}
