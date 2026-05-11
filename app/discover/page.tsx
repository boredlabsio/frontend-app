'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import NextActionHint from '@/components/common/NextActionHint';
import { debugLog } from '@/lib/utils/debug';
import TestModeGate from '@/components/common/TestModeGate';
import { useDiscoverySummary } from '@/hooks/useDiscoverySummary';
import { useRecentTrades } from '@/hooks/useRecentTrades';
import { shortAddress, shortHash, timeAgo } from '@/lib/formatters';
import type { DataSource, DiscoverySummaryResponse, RecentTradesResponse } from '@/lib/api/types';

const RECENT_ACTIVITY_WINDOW_MS = 5 * 60 * 1000;
const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

function getSourceTag(value: unknown): DataSource | undefined {
  if (value && typeof value === 'object' && '__source' in value) {
    return (value as { __source?: DataSource }).__source;
  }
  return undefined;
}

type BaseToken = DiscoverySummaryResponse['latestTokens'][number];

type TokenCard = BaseToken & {
  justTraded?: boolean;
  isHot?: boolean;
  isNew?: boolean;
  isMoving?: boolean;
  nearMigration?: boolean;
  volumeSpike?: boolean;
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
  const [filter, setFilter] = useState<'hot' | 'moving' | 'nearMigration' | 'new'>('hot');

  const summarySource = getSourceTag(summary.data) ?? 'mock';
  const tradesSource = getSourceTag(trades.data) ?? summarySource;

  const latestTokens = useMemo(() => summary.data?.latestTokens ?? [], [summary.data]);
  const recentTradeList = useMemo<RecentTradesResponse>(() => trades.data ?? [], [trades.data]);

  const recentTradeMap = useMemo(() => buildRecentTradeMap(recentTradeList), [recentTradeList]);

  const enhancedLatest = useMemo(
    () => latestTokens.map((token) => enrichToken(token, recentTradeMap)),
    [latestTokens, recentTradeMap]
  );

  const filteredTokens = useMemo(() => {
    const base = [...enhancedLatest].sort(trendingSort);
    switch (filter) {
      case 'hot':
        return base.filter((token) => token.isHot).slice(0, 12);
      case 'moving':
        return base.filter((token) => token.isMoving).slice(0, 12);
      case 'nearMigration':
        return base.filter((token) => token.nearMigration).slice(0, 12);
      case 'new':
        return [...base].sort((a, b) => b.createdAtValue - a.createdAtValue).slice(0, 12);
      default:
        return base.slice(0, 12);
    }
  }, [enhancedLatest, filter]);


  const recentlyTraded = useMemo<RecentTradesResponse>(() => recentTradeList.slice(0, 6), [recentTradeList]);

  const loading = summary.isLoading && trades.isLoading;
  const dataSourceMessage = `Data source: ${describeSource(summarySource)}${
    tradesSource !== summarySource ? ` · Trades: ${describeSource(tradesSource)}` : ''
  }`;
  const dataSourceTone = summarySource === 'api' ? 'info' : summarySource === 'snapshot' ? 'warn' : 'error';

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Live Sepolia feed</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-white">Discover tokens</h1>
            <NextActionHint message="Track trending launches, chase rewards, and jump into trading." />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
            <FilterButton label="Hot" active={filter === 'hot'} onClick={() => setFilter('hot')} />
            <FilterButton label="Moving" active={filter === 'moving'} onClick={() => setFilter('moving')} />
            <FilterButton label="Near Migration" active={filter === 'nearMigration'} onClick={() => setFilter('nearMigration')} />
            <FilterButton label="New" active={filter === 'new'} onClick={() => setFilter('new')} />
          </div>
        </div>
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
          <Section title={filterLabel(filter)} description={filterDescription(filter)}>
            <TokenGrid tokens={filteredTokens} emptyLabel="No tokens match this view yet." />
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

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      
      onClick={onClick}
      className={`rounded-full border px-3 py-1 transition ${active ? 'border-white bg-white/20 text-white' : 'border-white/20 text-white/60 hover:border-white/50'}`}
    >
      {label}
    </button>
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

function toLaunchHref(tokenId: unknown): string | null {
  if (tokenId === undefined || tokenId === null) return null;
  const normalized = String(tokenId).trim();
  if (!normalized || normalized === 'undefined' || normalized === 'missing') return null;
  return `/launch/${normalized}`;
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
      {tokens.map((token) => {
        const tokenHref = toLaunchHref(token.token_id);
        const tokenId = tokenHref ? tokenHref.replace('/launch/', '') : '';
        const tokenClickable = Boolean(tokenHref);
        const cardClass = `rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-lg transition ${
          tokenClickable ? 'hover:-translate-y-0.5 hover:border-indigo-400/40' : 'opacity-70 cursor-not-allowed'
        } ${token.justTraded ? 'ring-1 ring-emerald-400/60 ring-offset-2 ring-offset-slate-900' : ''}`;

        if (!tokenClickable) {
          return (
            <div key={`missing-${token.name}-${token.token_address}`} className={cardClass}>
              <p className="text-xs text-rose-300">token id missing</p>
              <p className="mt-1 text-sm text-white/80">{token.name || 'Unknown token'}</p>
            </div>
          );
        }

        return (
          <Link
          key={`${tokenId}-${token.token_address}`}
          href={tokenHref!}
          onClick={() => debugLog('DISCOVER_CLICK_TOKEN', { token_id: tokenId, name: token.name, launchpad_market: token.launchpad_market })}
          className={cardClass}
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
            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide">
              {getTokenLabels(token).map((label) => (
                <span key={label} className="rounded-full border border-white/20 px-2 py-0.5 text-white/70">
                  {label}
                </span>
              ))}
              {token.justTraded && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-200 animate-pulse">Just traded</span>}
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-white">
            <Metric label="Price" value={token.priceNative ? `${token.priceNative} ETH` : '—'} />
            <Metric label="Volume (24h)" value={token.volume24h ? `${token.volume24h} ETH` : '—'} />
            <Metric label="Trades (24h)" value={token.tradeCount.toString()} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <ChangeBadge label="5m" value={token.change5m} />
            <ChangeBadge label="1h" value={token.change1h} />
            <ChangeBadge label="24h" value={token.change24h} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/70">
            <span>Pair {token.symbol}/{resolveQuoteSymbol(token.quote_token_address)}</span>
            <StatusBadge status={token.status} />
            {token.volumeSpike && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">Volume spike</span>}
          </div>
          </Link>
        );
      })}
    </div>
  );
}

function TradesFeed({ trades }: { trades: RecentTradesResponse }) {
  if (!trades?.length) return <EmptyCard label="No trades yet." />;
  return (
    <div className="space-y-3">
      {trades.map((trade) => {
        const tradeHref = toLaunchHref(trade.token_id);
        const rowClass = `flex flex-wrap items-center gap-4 rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white ${tradeHref ? '' : 'opacity-70 cursor-not-allowed'}`;

        if (!tradeHref) {
          return (
            <div key={trade.tx_hash} className={rowClass}>
              <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-200">TOKEN ID MISSING</span>
              <span className="text-xs text-rose-300">token id missing</span>
              <span className="text-xs text-white/60">Tx {shortHash(trade.tx_hash)}</span>
            </div>
          );
        }

        return (
          <Link
            key={trade.tx_hash}
            href={tradeHref}
            className={rowClass}
          >
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${trade.direction === 'buy' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
              {trade.direction.toUpperCase()}
            </span>
            <div className="flex flex-col">
              <span className="font-semibold">{trade.token_name || `Token #${String(trade.token_id)}`}</span>
              <span className="text-white/60">{resolveQuoteSymbol(trade.quote_token_address)}</span>
            </div>
            <span className="text-xs text-white/60">{timeAgo(trade.timestamp)}</span>
            <span className="text-xs text-white/60">{formatTradeAmount(trade)}</span>
            <span className="text-xs text-white/60">Price {formatPrice(trade.execution_price_native)}</span>
            <span className="text-xs text-white/60">Tx {shortHash(trade.tx_hash)}</span>
          </Link>
        );
      })}
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

function getTokenLabels(token: TokenCard) {
  const labels: string[] = [];
  if (token.isHot) labels.push('Hot');
  if (token.isNew) labels.push('New');
  if (token.isMoving) labels.push('Moving');
  if (token.status === 'migrated') labels.push('Migrated');
  if (token.nearMigration) labels.push('Near migration');
  return labels;
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
  const tradeCount = 'trades24h' in token && typeof token.trades24h === 'number' ? token.trades24h : parseInt(token.volume24h ?? '0', 10) || 0;
  const createdAtValue = token.createdAt ? Date.parse(token.createdAt) : Date.now();
  const ageMs = Date.now() - createdAtValue;
  const recentlyActive = recentTradeMap.has(token.token_id);
  const isHot = tradeCount >= 10 || volumeValue >= 5 || recentlyActive;
  const isNew = ageMs <= NEW_WINDOW_MS || !token.createdAt;
  const isMoving = Math.abs(change5mValue) >= 2 || Math.abs(change1hValue) >= 5 || recentlyActive;
  const nearMigration = token.status === 'migration_pending' || (Boolean(token.launchpad_market) && token.status !== 'migrated');
  const volumeSpike = volumeValue >= 10 && (change24hValue > 5 || recentlyActive);

  return {
    ...token,
    volumeValue,
    change5mValue,
    change1hValue,
    change24hValue,
    tradeCount,
    createdAtValue,
    isHot,
    isNew,
    isMoving,
    nearMigration,
    volumeSpike,
    justTraded: recentlyActive
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

function describeSource(source: DataSource) {
  if (source === 'api') return 'Live indexer';
  if (source === 'snapshot') return 'Indexer snapshot';
  return 'Mock fallback';
}

function filterLabel(filter: 'hot' | 'moving' | 'nearMigration' | 'new') {
  if (filter === 'hot') return 'Hot';
  if (filter === 'moving') return 'Moving';
  if (filter === 'nearMigration') return 'Near Migration';
  return 'New';
}

function filterDescription(filter: 'hot' | 'moving' | 'nearMigration' | 'new') {
  if (filter === 'hot') return 'Highest activity and volume right now';
  if (filter === 'moving') return 'Fastest short-window momentum shifts';
  if (filter === 'nearMigration') return 'Tokens approaching migration threshold';
  return 'Fresh launches in their earliest trading window';
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
