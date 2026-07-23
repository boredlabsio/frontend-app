'use client';

import Link from 'next/link';
import { use, useEffect, useMemo } from 'react';
import type { DataSource, RecentTradesResponse } from '@/lib/api/types';
import NextActionHint from '@/components/common/NextActionHint';
import TestModeGate from '@/components/common/TestModeGate';
import { useTokenSummary } from '@/hooks/useTokenSummary';
import { useRecentTrades } from '@/hooks/useRecentTrades';
import { useDiscoverySummary } from '@/hooks/useDiscoverySummary';
import { debugLog } from '@/lib/utils/debug';
import { shortAddress, shortHash, timeAgo } from '@/lib/formatters';
import BuyPanel from '@/components/launch/BuyPanel';
import { env } from '@/lib/config/env';
import { DataNotFoundError } from '@/lib/api/discovery';

function getSourceTag(value: unknown): DataSource | undefined {
  if (value && typeof value === 'object' && '__source' in value) {
    return (value as { __source?: DataSource }).__source;
  }
  return undefined;
}

export default function LaunchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <LaunchDetail tokenId={id} />;
}

export function LaunchDetail({ tokenId }: { tokenId: string }) {
  const rawParam = tokenId;
  const normalizedParam = Array.isArray(rawParam) ? rawParam[0] : String(rawParam || '');
  const routeTokenId = normalizedParam && normalizedParam !== 'undefined' && normalizedParam !== 'missing' ? normalizedParam : '';
  const summary = useTokenSummary(routeTokenId || 'missing');
  const trades = useRecentTrades(routeTokenId || 'missing');
  const discovery = useDiscoverySummary();

  useEffect(() => {
    debugLog('LAUNCH_ROUTE_ID', { rawParam, routeTokenId });
    if (summary.data) debugLog('TOKEN DETAIL:', summary.data);
  }, [rawParam, routeTokenId, summary.data]);

  const discoveryToken = useMemo(() => {
    if (!discovery.data) return null;
    return (
      discovery.data.latestTokens.find((token) => token.token_id === routeTokenId) ||
      discovery.data.mostActiveTokens.find((token) => token.token_id === routeTokenId) ||
      null
    );
  }, [discovery.data, routeTokenId]);

  const info = summary.data;
  const dataSource = getSourceTag(info) ?? getSourceTag(discovery.data) ?? 'mock';
  const tradesSource = getSourceTag(trades.data) ?? dataSource;
  const dataSourceLabel = `Data source: ${describeSource(dataSource)}${tradesSource !== dataSource ? ` · Trades: ${describeSource(tradesSource)}` : ''}`;
  const dataSourceTone = dataSource === 'live' ? 'success' : dataSource === 'snapshot' ? 'info' : 'warn';
  const tradesData = useMemo<RecentTradesResponse>(() => trades.data ?? [], [trades.data]);
  const lastTradeTime = tradesData[0]?.timestamp ?? info?.last_trade_time ?? discoveryToken?.last_trade_time ?? null;
  const displayName = info?.name || discoveryToken?.name || `Token #${routeTokenId || 'missing'}`;
  const displaySymbol = info?.symbol || discoveryToken?.symbol || 'TKN';
  const displayPrice = info?.priceNative || discoveryToken?.priceNative || '0';
  const displayVolume = info?.volume24h || discoveryToken?.volume24h || '0';
  const displayTokenAddress = info?.token_address || discoveryToken?.token_address || '';
  const marketAddress = info?.launchpad_market || discoveryToken?.launchpad_market || '';
  const bondingProgress = Math.round((info?.bonding_progress ?? discoveryToken?.bonding_progress ?? 0) * 100);
  const migrationStatus = info?.migration_status ?? discoveryToken?.migration_status ?? 'not_ready';
  const displayStatus =
    migrationStatus === 'migrated'
      ? 'Migrated to Uniswap'
      : migrationStatus === 'ready'
        ? 'Migration ready'
        : info?.status === 'migration_pending' || discoveryToken?.status === 'migration_pending'
          ? 'Migration pending'
          : 'Bonding curve active';

  if (summary.isError && !summary.data) {
    const notFound = summary.error instanceof DataNotFoundError;
    return (
      <div className="space-y-6">
        <BackLink />
        <NextActionHint message={notFound ? `Token ${routeTokenId || 'missing'} not found` : 'Live token data unavailable'} tone="error" />
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-white">
          <p className="text-sm text-white/60">Token #{routeTokenId || 'missing'}</p>
          <h1 className="text-3xl font-semibold">{notFound ? 'Token not found' : 'Live data unavailable'}</h1>
          <p className="mt-2 text-sm text-white/70">
            {notFound ? 'No canonical token matches this route.' : 'Meraki could not verify current token data. No snapshot or mock token is being shown.'}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!routeTokenId && <NextActionHint message="token id missing" tone="error" />}
      <BackLink />

      <header className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-white/60">Token #{routeTokenId || 'missing'}</p>
          <h1 className="text-3xl font-semibold text-white">{summary.isLoading ? 'Loading token...' : displayName}</h1>
          <p className="text-white/70">
            {displaySymbol} · {displayTokenAddress ? shortAddress(displayTokenAddress) : 'address pending'}
          </p>
        </div>
        <div className="text-sm text-white/60">
          <p>Chain: Sepolia</p>
          <TestModeGate>
            <p className="text-xs text-white/50">Read-only Slice 2 mode · no transaction execution.</p>
          </TestModeGate>
        </div>
      </header>

      <NextActionHint message={dataSourceLabel} tone={dataSourceTone} />
      <NextActionHint message="Read-only market data. Buy, sell, rewards, and migration execution remain disabled." tone="info" />

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Price" value={`${displayPrice} ETH`} />
        <MetricCard label="Market status" value={displayStatus} />
        <MetricCard label="Volume 24h" value={`${displayVolume} ETH`} />
        <MetricCard label="Last trade" value={lastTradeTime ? timeAgo(lastTradeTime) : 'No trades yet'} />
      </section>

      <section className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold text-white">Migration progress</h2>
        <p className="text-sm text-white/70">
          Market {marketAddress ? shortAddress(marketAddress) : 'pending'} · token {displayTokenAddress ? shortAddress(displayTokenAddress) : 'pending'}
        </p>
        <div className="mt-2 h-3 w-full rounded-full bg-white/10">
          <div className="h-full rounded-full bg-indigo-400" style={{ width: `${Math.min(Math.max(bondingProgress, 0), 100)}%` }} />
        </div>
        <p className="text-xs text-white/60">{bondingProgress}% bonded · migration status: {migrationStatus.replace('_', ' ')}</p>
      </section>

      <PriceSparkline trades={tradesData} price={displayPrice} volume={displayVolume} />
      {info && env.buyEnabled && <BuyPanel token={info} source={dataSource} />}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Recent activity</h2>
        <TradesList trades={tradesData} />
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/discover" className="text-sm text-white/60 hover:underline">
      Back to discovery
    </Link>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <p className="text-sm text-white/60">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function TradesList({ trades }: { trades: RecentTradesResponse }) {
  if (!trades.length) {
    return <p className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white/70">No trades yet.</p>;
  }
  return (
    <div className="space-y-2">
      {trades.map((trade) => (
        <div key={trade.trade_id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-sm text-white">
          <div>
            <p className="font-semibold uppercase tracking-wide">{trade.direction}</p>
            <p className="text-white/60">
              {trade.quote_amount} {trade.quote_symbol}
            </p>
          </div>
          <span className="text-xs text-white/60">{trade.base_amount ?? '0'} {trade.token_name || 'TOKEN'}</span>
          <span className="text-xs text-white/50">{timeAgo(trade.timestamp)}</span>
          <a
            href={`https://sepolia.etherscan.io/tx/${trade.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/70 underline-offset-2 hover:underline"
          >
            Tx {shortHash(trade.tx_hash)}
          </a>
        </div>
      ))}
    </div>
  );
}

function PriceSparkline({ trades, price, volume }: { trades: RecentTradesResponse; price: string; volume: string }) {
  const width = 400;
  const height = 140;
  const pricePoints = trades.map((trade) => Number(trade.execution_price_native)).filter((value) => Number.isFinite(value));
  const fallback = Number(price) || 0.01;
  const data = pricePoints.length >= 2 ? pricePoints.slice(-20) : Array.from({ length: 12 }, (_, index) => fallback * (1 + Math.sin(index / 2) * 0.02));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Price pulse</p>
          <p className="text-lg font-semibold text-white">Recent trade curve</p>
        </div>
        <div className="text-sm text-white/70">
          <span className="mr-4">Spot {price} ETH</span>
          <span>24h vol {volume} ETH</span>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-500/10 via-slate-900/80 to-transparent p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full text-indigo-400/80">
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}

function describeSource(source: string) {
  if (source === 'live') return 'Live API';
  if (source === 'snapshot') return 'Snapshot';
  return 'Mock';
}
