'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, apiAvailable } from '@/lib/api/client';
import type { ClaimableResponse, ClaimEpochApi, ClaimInfoApi } from '@/lib/api/types';

export type ClaimWindowStatus = 'no-epoch' | 'pending' | 'open' | 'expired';

export type ClaimHookData = {
  raw: ClaimableResponse;
  epoch: ClaimEpochApi | null;
  claim: ClaimInfoApi | null;
  status: ClaimWindowStatus;
  now: Date;
  opensAt: Date | null;
  deadline: Date | null;
  claimableAmountWei: bigint;
};

const fallbackResponse: ClaimableResponse = {
  epoch: null,
  claim: null,
  mock: true,
  serverTime: new Date().toISOString()
};

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

  const shaped = useMemo<ClaimHookData | null>(() => {
    const base = query.data ?? (isMock ? fallbackResponse : enabled ? null : fallbackResponse);
    if (!base) return null;

    const epoch = base.epoch ?? null;
    const claim = base.claim ?? null;
    const now = base.serverTime ? new Date(base.serverTime) : new Date();
    const opensAt = epoch ? new Date(epoch.claimsOpenAt) : null;
    const deadline = epoch ? new Date(epoch.claimDeadline) : null;

    let status: ClaimWindowStatus = 'no-epoch';
    if (!epoch) {
      status = 'no-epoch';
    } else if (deadline && now > deadline) {
      status = 'expired';
    } else if (epoch.status === 'review' || (opensAt && now < opensAt)) {
      status = 'pending';
    } else {
      status = 'open';
    }

    const claimableAmountWei = claim?.amountWei ? BigInt(claim.amountWei) : BigInt(0);

    return {
      raw: base,
      epoch,
      claim,
      status,
      now,
      opensAt,
      deadline,
      claimableAmountWei
    };
  }, [enabled, isMock, query.data]);

  return {
    data: shaped,
    isLoading: query.isPending && enabled,
    error,
    isMock,
    refetch: query.refetch
  } as const;
}
