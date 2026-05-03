export type LeaderboardEntry = {
  rank: number;
  address: string;
  points: number;
  volumeEth: number;
  lastActivity: string;
  isSelf?: boolean;
};

export const leaderboardMock: LeaderboardEntry[] = [
  {
    rank: 1,
    address: '0x1E887DB513Be6a0F793a0C55613d52e85bAC1727',
    points: 132,
    volumeEth: 174.8,
    lastActivity: '2h ago'
  },
  {
    rank: 2,
    address: '0x30bb69EEd0E24b61d3Ed1513D6b3A69A69DCd2b9',
    points: 98,
    volumeEth: 96.2,
    lastActivity: '5h ago'
  },
  {
    rank: 3,
    address: '0x7bFe4b219b5eC65B0e3c183f78B967245c674673',
    points: 65,
    volumeEth: 42.1,
    lastActivity: '9h ago'
  },
  {
    rank: 4,
    address: '0xb8746511f9cFf1B17b3669D89844A07dFBe1e22A',
    points: 42,
    volumeEth: 24.5,
    lastActivity: '1d ago'
  },
  {
    rank: 5,
    address: '0xf25bBA3104470e2001D19f2a3EfE6ece403beb5D',
    points: 31,
    volumeEth: 18.8,
    lastActivity: '2d ago'
  }
];

export const summaryMock = {
  generatedAt: new Date().toISOString(),
  chain: 'sepolia',
  latestTokens: [
    {
      token_id: '1',
      name: 'Mock Token',
      symbol: 'MOCK',
      token_address: '0x93Ce31301D1278cb55b810a1cDE0EB81308FDaC5',
      launchpad_market: '0x9399f30f694D6265fbe097CdeBB851a4Bf1b1eae',
      quote_token_address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      createdAt: new Date().toISOString()
    }
  ],
  mostActiveTokens: [
    {
      token_id: '1',
      name: 'Mock Token',
      symbol: 'MOCK',
      token_address: '0x93Ce31301D1278cb55b810a1cDE0EB81308FDaC5',
      volume24h: '120.4',
      trades24h: 34
    }
  ],
  recentTrades: [
    {
      token_id: '1',
      direction: 'buy' as const,
      tx_hash: '0x123',
      block_number: '0',
      native_in: '10000000000000000',
      native_out: null,
      token_in: null,
      token_out: '100000000000',
      token_address: '0x93Ce31301D1278cb55b810a1cDE0EB81308FDaC5',
      execution_price_native: '38976.5'
    }
  ]
};

export const tokenSummaryMock = {
  tokenId: '1',
  name: 'Mock Token',
  symbol: 'MOCK',
  image: null,
  description: 'Placeholder launch token.',
  priceNative: '0.0001',
  marketCapNative: '10',
  supply: '1000000',
  remaining: '420000',
  volume24h: '12.5',
  trades24h: 18,
  marketAddress: '0x9399f30f694D6265fbe097CdeBB851a4Bf1b1eae',
  tokenAddress: '0x93Ce31301D1278cb55b810a1cDE0EB81308FDaC5',
  quoteTokenAddress: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  tokenDecimals: 18,
  feeBps: 100
};

export const tradesMock = summaryMock.recentTrades;

export const userSummaryMock = {
  rank: 3,
  points: 65,
  claimable: 18,
  volumeEth: 42.1,
  buyShare: 0.7,
  swapShare: 0.3,
  badges: ['Silver', 'Top 10%'],
  progressToNextBadge: 0.45
};

export const activityMock = [
  {
    id: '1',
    type: 'BUY' as const,
    description: 'Bought 2.5 ETH of LaunchToken',
    amount: 2.5,
    txHash: '0xa7554c070e915fb087906693342e497f8736788383f99a24df3932b31449faae',
    timestamp: '2026-04-30T14:20:00Z'
  },
  {
    id: '2',
    type: 'SWAP' as const,
    description: 'Swapped 1.1 ETH on Uni v3',
    amount: 1.1,
    txHash: '0x58d7e50556ab9d2f19d18097de6bb842553a60b67f09345da870325583841d3c',
    timestamp: '2026-04-30T09:02:00Z'
  },
  {
    id: '3',
    type: 'BUY' as const,
    description: 'Bought 0.8 ETH of LaunchToken',
    amount: 0.8,
    txHash: '0xe00c93e792ed9d70d0667eecf6a5361b039f4e28fbd6ddc6e160054e579a54dc',
    timestamp: '2026-04-29T21:45:00Z'
  }
];

export const badgesMock = [
  { label: 'Bronze', achieved: true },
  { label: 'Silver', achieved: true },
  { label: 'Gold', achieved: false },
  { label: 'Diamond', achieved: false }
];
