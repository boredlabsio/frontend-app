import type { Hex } from 'viem';

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

export type DiscoverySummaryResponse = {
  generatedAt: string;
  chain: string;
  latestTokens: Array<{
    token_id: string;
    name: string;
    symbol: string;
    token_address: string;
    createdAt: string;
  }>;
  mostActiveTokens: Array<{
    token_id: string;
    name: string;
    symbol: string;
    token_address: string;
    volume24h: string;
    trades24h: number;
  }>;
  recentTrades: Array<{
    token_id: string;
    direction: 'buy' | 'sell';
    tx_hash: string;
    block_number: string;
    native_in: string | null;
    native_out: string | null;
    token_in: string | null;
    token_out: string | null;
    token_address: string;
    execution_price_native: string;
  }>;
};

export type TokenSummaryResponse = {
  tokenId: string;
  name: string;
  symbol: string;
  image: string | null;
  description: string | null;
  priceNative: string;
  marketCapNative: string;
  supply: string;
  remaining: string;
  volume24h: string;
  trades24h: number;
  token_address?: string;
};

export type RecentTradesResponse = DiscoverySummaryResponse['recentTrades'];
