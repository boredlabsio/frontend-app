'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import NextActionHint from '@/components/common/NextActionHint';
import { debugLog } from '@/lib/utils/debug';
import TestModeGate from '@/components/common/TestModeGate';
import { useDiscoverySummary } from '@/hooks/useDiscoverySummary';
import { useRecentTrades } from '@/hooks/useRecentTrades';
import { shortAddress, shortHash, timeAgo } from '@/lib/formatters';
import type { DiscoverySummaryResponse, RecentTradesResponse } from '@/lib/api/types';

const RECENT_ACTIVITY_WINDOW_MS = 5 * 60 * 1000;

type BaseToken = DiscoverySummaryResponse['latestTokens'][number];

type TokenCard = BaseToken & {
  justTraded?: boolean;
  volumeValue: number;
  change5mValue: number;
  change1hValue: number;
  change24hValue: number;
  tradeCount: number;
  createdAtValue: number;
};

export default function DiscoverPage() {
  const summary = useDiscoverySummary();
  const trades = useRecentTrades();

  const latestTokens = summary.data?.latestTokens ?? [];
  const mostActiveRaw = summary.data?.mostActiveTokens ?? [];
  const recentTradeList: RecentTradesResponse = trades.data ?? [];

  const recentTradeMap = useMemo(() => buildRecentTradeMap(recentTradeList), [recentTradeList]);

  const enhancedLatest = useMemo(
    () => latestTokens.map((token) => enrichToken(token, recentTradeMap)),
    [latestTokens, recentTradeMap]
  );

  const latestById = useMemo(() => new Map(enhancedLatest.map((token) => [token.token_id, token])), [enhancedLatest]);

  const trendingTokens = useMemo(
    () => [...enhancedLatest].sort(trendingSort).slice(0, 6),
    [enhancedLatest]
  );

  const newLaunches = useMemo(
    () => [...enhancedLatest].sort((a, b) => b.createdAtValue - a.createdAtValue).slice(0, 6),
    [enhancedLatest]
  );

  const mostActiveTokens = useMemo(
    () =>
      mostActiveRaw
        .map((token) => latestById.get(token.token_id) ?? enrichToken(token, recentTradeMap))
        .slice(0, 6),
    [mostActiveRaw, latestById, recentTradeMap]
  );

  const gainers = useMemo(
    () =>
      [...enhancedLatest]
        .filter((token) => token.change24hValue > 0)
        .sort((a, b) => b.change24hValue - a.change24hValue)
        .slice(0, 6),
    [enhancedLatest]
  );

  const recentlyTraded = useMemo<RecentTradesResponse>(() => recentTradeList.slice(0, 6), [recentTradeList]);

  const loading = summary.isLoading && trades.isLoading;
  const summarySource = (summary.data as any)?.__source ?? 'mock';
  const tradesSource = (Array.isArray(trades.data) && (trades.data as any)?.__source) || summarySource;
  const dataSourceMessage = `Data source: ${describeSource(summarySource)}${
    tradesSource !== summarySource ? ` · Trades: ${describeSource(tradesSource)}` : ''
  }`;
  const dataSourceTone = summarySource === 'api' ? 'info' : summarySource === 'snapshot' ? 'warn' : 'error';

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm text-white/60">Live Sepolia feed</p>
        <h1 className="text-3xl font-semibold text-white">Discover tokens</h1>
        <NextActionHint message="Track trending launches, check curve status, and jump into trading." />
        <NextActionHint message={dataSourceMessage} tone={dataSourceTone} />
        <TestModeGate>
          <p className="text-xs text-white/60">
            {summarySource === 'api'
              ? 'Indexer live — displaying the freshest activity from Sepolia.'
              : summarySource === 'snapshot'
                ? 'Displaying the latest snapshot while the live indexer catches up.'
                : 'Mock data only — waiting for the indexer to provide live markets.'}
          </p>
        </TestModeGate>
      </header>

      {loading && <SkeletonPanel text="Loading discovery data…" />}

      {!loading && (
        <div className="space-y-8">
          <Section title="Trending" description="Top movers by 24h volume and trade heat">
            <TokenGrid tokens={trendingTokens} emptyLabel="No trending tokens yet." />
          </Section>

          <Section title="New launches" description="Fresh bonding-curve deployments">
            <TokenGrid tokens={newLaunches} emptyLabel="No launches yet — spin one up!" />
          </Section>

          <Section title="Most active" description="Highest trade counts over the last day">
            <TokenGrid tokens={mostActiveTokens} emptyLabel="No active markets yet." />
          </Section>

          <Section title="Gainers" description="Largest positive change (24h)">
            <TokenGrid tokens={gainers} emptyLabel="No gainers yet — keep watching." />
          </Section>

          <Section title="Recently traded" description="Latest buys and sells across all tokens">
            <TradesFeed trades={recentlyTraded} />
          </Section>

          <Section title="Watchlist" description="Pinned pairs coming soon">
            <WatchlistPlaceholder />
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {description && <p className="text-sm text-white/60">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function TokenGrid({ tokens, emptyLabel }: { tokens: TokenCard[]; emptyLabel: string }) {
  useEffect(() => {
    tokens.forEach((token) => debugLog('DISCOVERY TOKEN:', token));
  }, [tokens]);

  if (!tokens.length) {
    return <EmptyCard label={emptyLabel} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tokens.map((token) => (
        <Link
          key={`${token.token_id}-${token.token_address}`}
          href={`/launch/${token.token_id}`}
          className={`rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-lg transition hover:-translate-y-0.5 hover:border-indigo-400/40 ${
            token.justTraded ? 'ring-1 ring-emerald-400/60 ring-offset-2 ring-offset-slate-900' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                {(token.symbol || '?').slice(0, 3).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-white/60">{shortAddress(token.token_address)}</p>
                <p className="text-lg font-semibold text-white">
                  {token.name} <span className="text-white/60">· {token.symbol}</span>
                </p>
              </div>
            </div>
            {token.justTraded && <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 animate-pulse">Just traded</span>}
          </div>

          <div className="mt-4 grid gap-3 text-sm text-white">
            <Metric label="Price" value={token.priceNative ? `${token.priceNative} ETH` : '—'} />
            <Metric label="Volume (24h)" value={token.volume24h ? `${token.volume24h} ETH` : '—'} />
            <Metric label="Trades (24h)" value={token.trades24h?.toString() ?? '—'} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <ChangeBadge label="5m" value={token.change5m} />
            <ChangeBadge label="1h" value={token.change1h} />
            <ChangeBadge label="24h" value={token.change24h} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/70">
            <span>Pair {token.symbol}/{resolveQuoteSymbol(token.quote_token_address)}</span>
            <StatusBadge status={token.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function TradesFeed({ trades }: { trades: RecentTradesResponse }) {
  if (!trades?.length) return <EmptyCard label="No trades yet." />;
  return (
    <div className="space-y-3">
      {trades.map((trade) => (
        <Link
          key={trade.tx_hash}
          href={`/launch/${trade.token_id}`}
          className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white"
        >
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${trade.direction === 'buy' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
            {trade.direction.toUpperCase()}
          </span>
          <div className="flex flex-col">
            <span className="font-semibold">{trade.token_name || `Token #${trade.token_id}`}</span>
            <span className="text-white/60">{resolveQuoteSymbol(trade.quote_token_address)}</span>
          </div>
          <span className="text-xs text-white/60">{timeAgo(trade.timestamp)}</span>
          <span className="text-xs text-white/60">{formatTradeAmount(trade)}</span>
          <span className="text-xs text-white/60">Price {formatPrice(trade.execution_price_native)}</span>
          <span className="text-xs text-white/60">Tx {shortHash(trade.tx_hash)}</span>
        </Link>
      ))}
    </div>
  );
}

function WatchlistPlaceholder() {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 bg-slate-900/40 p-6 text-white/70">
      <p className="text-lg font-semibold text-white">Personal watchlist</p>
      <p className="mt-2 text-sm">Save your favorite bonding-curve launches and migrated pools for quick access. Coming soon.</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function ChangeBadge({ label, value }: { label: string; value?: string }) {
  const parsed = parsePercent(value);
  const tone = parsed > 0 ? 'text-emerald-300' : parsed < 0 ? 'text-rose-300' : 'text-white/60';
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      <p className={`text-sm font-semibold ${tone}`}>{value ?? '—'}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const label = status === 'migrated' ? 'Migrated' : status === 'migration_pending' ? 'Migrating' : 'Curve live';
  const tone = status === 'migrated' ? 'bg-indigo-500/20 text-indigo-200' : status === 'migration_pending' ? 'bg-amber-500/20 text-amber-200' : 'bg-emerald-500/20 text-emerald-200';
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function EmptyCard({ label }: { label: string }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-white/70">{label}</div>;
}

function SkeletonPanel({ text }: { text: string }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-white/60 animate-pulse">{text}</div>;
}

function parsePercent(value?: string) {
  if (!value) return 0;
  const numeric = Number(value.replace('%', ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseNumber(value?: string) {
  if (!value) return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function enrichToken(token: BaseToken, recentTradeMap: Set<string>): TokenCard {
  const volumeValue = parseNumber(token.volume24h);
  const change5mValue = parsePercent(token.change5m);
  const change1hValue = parsePercent(token.change1h);
  const change24hValue = parsePercent(token.change24h);
  const tradeCount = token.trades24h ?? 0;
  const createdAtValue = token.createdAt ? Date.parse(token.createdAt) : Date.now();

  return {
    ...token,
    volumeValue,
    change5mValue,
    change1hValue,
    change24hValue,
    tradeCount,
    createdAtValue,
    justTraded: recentTradeMap.has(token.token_id)
  } as TokenCard;
}

function buildRecentTradeMap(trades: RecentTradesResponse) {
  const map = new Set<string>();
  const now = Date.now();
  trades.forEach((trade) => {
    const timestamp = trade.timestamp ? Date.parse(trade.timestamp) : 0;
    if (now - timestamp <= RECENT_ACTIVITY_WINDOW_MS) {
      map.add(trade.token_id);
    }
  });
  return map;
}

function trendingSort(a: TokenCard, b: TokenCard) {
  if (b.tradeCount !== a.tradeCount) return b.tradeCount - a.tradeCount;
  return b.volumeValue - a.volumeValue;
}

function describeSource(source: string) {
  if (source === 'api') return 'Live indexer';
  if (source === 'snapshot') return 'Indexer snapshot';
  return 'Mock fallback';
}

function resolveQuoteSymbol(value?: string) {
  if (!value || value.toLowerCase().includes('fff997')) return 'WETH';
  return shortAddress(value);
}

function formatTradeAmount(trade: RecentTradesResponse[number]) {
  if (trade.native_in) return `${(Number(trade.native_in) / 1e18).toFixed(4)} ETH`;
  if (trade.token_out) return `${Number(trade.token_out).toLocaleString()} TOKEN`;
  return '—';
}

function formatPrice(value?: string) {
  if (!value) return '—';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  return numeric.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
