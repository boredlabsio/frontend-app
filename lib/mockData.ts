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

import type { DiscoverySummaryResponse, TokenSummaryResponse, RecentTradesResponse } from '@/lib/api/types';
import { discoverySummarySchema, tokenSummarySchema, recentTradeSchema } from '@/lib/api/generated/contracts';

const mockCatalog = [
  {
    tokenId: '1',
    name: 'Pump Live 1777687392334',
    symbol: 'PLIVE',
    tokenAddress: '0x93Ce31301D1278cb55b810a1cDE0EB81308FDaC5',
    marketAddress: '0x9399f30f694D6265fbe097CdeBB851a4Bf1b1eae',
    quoteTokenAddress: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    createdAt: new Date().toISOString(),
    status: 'curve_live' as const,
    priceNative: '0.0000275',
    change5m: '+0.8%',
    change1h: '+6.2%',
    change24h: '+18.4%',
    volume24h: '62.4',
    trades24h: 34
  },
  {
    tokenId: '2',
    name: 'Mock Migrated',
    symbol: 'MOCKX',
    tokenAddress: '0x19610bCa8175522165d9415506D5d59fAe1C6795',
    marketAddress: '0x90324CacFf73eC359D62202EEad5Fa721B7a7663',
    quoteTokenAddress: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: 'migrated' as const,
    priceNative: '0.00019',
    change5m: '-0.2%',
    change1h: '+2.1%',
    change24h: '+12.0%',
    volume24h: '88.1',
    trades24h: 22
  }
];

export const tokenSummaryMocks: Record<string, TokenSummaryResponse> = mockCatalog.reduce(
  (acc, token) => {
    acc[token.tokenId] = {
      schema: 'TokenSummaryV1',
      token_id: token.tokenId,
      name: token.name,
      symbol: token.symbol,
      priceNative: token.priceNative,
      volume24h: token.volume24h,
      trades24h: token.trades24h,
      token_address: token.tokenAddress,
      launchpad_market: token.marketAddress,
      status: token.status,
      last_trade_time: token.createdAt,
      bonding_threshold: '25',
      bonding_progress: token.status === 'migrated' ? 1 : 0.42,
      migration_status: token.status === 'migrated' ? 'migrated' : 'not_ready'
    } as TokenSummaryResponse;
    return acc;
  },
  {} as Record<string, TokenSummaryResponse>
);

export function getMockTokenSummary(tokenId: string): TokenSummaryResponse | null {
  if (tokenSummaryMocks[tokenId]) return tokenSummaryMocks[tokenId];
  console.warn('[mock] missing token summary for id', tokenId);
  return null;
}

const latestTokens = mockCatalog.map((token) => ({
  schema: 'TokenSummaryV1' as const,
  token_id: token.tokenId,
  name: token.name,
  symbol: token.symbol,
  token_address: token.tokenAddress,
  launchpad_market: token.marketAddress,
  status: token.status,
  priceNative: token.priceNative,
  volume24h: token.volume24h,
  trades24h: token.trades24h,
  last_trade_time: token.createdAt,
  bonding_threshold: '25',
  bonding_progress: token.status === 'migrated' ? 1 : 0.42,
  migration_status: token.status === 'migrated' ? 'migrated' : 'not_ready'
}));

const mostActiveTokens = mockCatalog.map((token) => ({
  schema: 'TokenSummaryV1' as const,
  token_id: token.tokenId,
  name: token.name,
  symbol: token.symbol,
  token_address: token.tokenAddress,
  launchpad_market: token.marketAddress,
  volume24h: (Number(token.volume24h) * 1.5).toFixed(1),
  trades24h: token.trades24h,
  priceNative: token.priceNative,
  status: token.status,
  last_trade_time: token.createdAt,
  bonding_threshold: '25',
  bonding_progress: token.status === 'migrated' ? 1 : 0.42,
  migration_status: token.status === 'migrated' ? 'migrated' : 'not_ready'
}));

export const summaryMock = discoverySummarySchema.parse({
  schema: 'DiscoverySummaryV1',
  generatedAt: new Date().toISOString(),
  latestTokens,
  mostActiveTokens,
  recentTrades: mockCatalog.map((token, index) => ({
    schema: 'RecentTradeV1',
    trade_id: `mock:${token.tokenId}:${index}`,
    token_id: token.tokenId,
    token_name: token.name,
    direction: index % 2 === 0 ? ('buy' as const) : ('sell' as const),
    stage: 'bonding_curve' as const,
    tx_hash: index % 2 === 0 ? '0x123' : '0x456',
    token_address: token.tokenAddress,
    quote_token_address: token.quoteTokenAddress,
    quote_symbol: 'ETH',
    quote_amount: index % 2 === 0 ? '0.01' : '0.025',
    base_amount: index % 2 === 0 ? '100000000000' : '250000000000',
    execution_price_native: index % 2 === 0 ? '38976.5' : '40210.1',
    timestamp: index === 0 ? new Date().toISOString() : new Date(Date.now() - 1000 * 60 * 5).toISOString()
  })),
  stats: {
    hotCount: 1,
    movingCount: 1,
    migrationReadyCount: 0
  }
}) satisfies DiscoverySummaryResponse;

Object.values(tokenSummaryMocks).forEach((token) => tokenSummarySchema.parse(token));
summaryMock.recentTrades.forEach((trade) => recentTradeSchema.parse(trade));

export const tradesMock: RecentTradesResponse = summaryMock.recentTrades;

export function getMockRecentTrades(tokenId?: string) {
  if (!tokenId) return tradesMock;
  return tradesMock.filter((trade) => trade.token_id === tokenId);
}

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
