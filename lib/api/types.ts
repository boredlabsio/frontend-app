import type { Hex } from 'viem';
import type { DiscoverySummaryV1, RecentTradeV1, TokenSummaryV1, TokenTradesResponseV1, ApiErrorV1 } from '@/lib/api/generated/contracts';

export type DataSource = 'live' | 'snapshot' | 'mock';

export type SourceTagged<T> = T & { __source?: DataSource };

export type DiscoverySummaryResponse = DiscoverySummaryV1;
export type TokenSummaryResponse = TokenSummaryV1;
export type RecentTradeResponse = RecentTradeV1;
export type TokenTradesResponse = TokenTradesResponseV1;
export type ApiErrorResponse = ApiErrorV1;
export type RecentTradesResponse = RecentTradeV1[];

export type DataErrorCategory =
  | 'disabled'
  | 'misconfigured'
  | 'timeout'
  | 'unavailable'
  | 'invalid_response'
  | 'not_found'
  | 'server_error'
  | 'aborted';

export type LeaderboardEntryApi = {
  rank: number;
  address: string;
  points: number;
  volumeEth: number;
  lastActivity: string;
};

export type LeaderboardResponse = LeaderboardEntryApi[];

export type UserRewardsResponse = {
  rank: number;
  points: number;
  claimable: number;
  volumeEth: number;
  buyShare: number;
  swapShare: number;
  progressToNextBadge: number;
  badges: string[];
};

export type ActivityItemApi = {
  id: string;
  type: 'BUY' | 'SWAP';
  description: string;
  amount: number;
  txHash: string;
  timestamp: string;
};

export type ActivityResponse = {
  items: ActivityItemApi[];
};

export type ClaimEpochApi = {
  id: number;
  root: Hex;
  metadataURI: string | null;
  metadataHash: Hex | null;
  snapshotHash: Hex | null;
  totalPayout: string;
  claimsOpenAt: string;
  claimDeadline: string;
  finalizationDelaySeconds: number;
  claimDurationSeconds: number;
  status: 'review' | 'open' | 'expired';
};

export type ClaimInfoApi = {
  address: string;
  amountWei: string;
  proof: Hex[];
  excluded: boolean;
  pointsUsed: string;
  claimed: boolean;
  claimTxHash: Hex | null;
  claimedAt: string | null;
};

export type ClaimableResponse = {
  epoch: ClaimEpochApi | null;
  claim: ClaimInfoApi | null;
  mock: boolean;
  serverTime?: string;
};
