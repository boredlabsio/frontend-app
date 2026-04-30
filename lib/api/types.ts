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

export type ClaimableResponse = {
  claimable: number;
  nextWindow?: string;
};
