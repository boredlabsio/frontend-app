'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import NextActionHint from '@/components/common/NextActionHint';
import TestModeGate from '@/components/common/TestModeGate';
import { useDiscoverySummary } from '@/hooks/useDiscoverySummary';
import { useRecentTrades } from '@/hooks/useRecentTrades';
import { shortAddress, shortHash, timeAgo } from '@/lib/formatters';
import type { RecentTradesResponse } from '@/lib/api/types';

export default function DiscoverPage() {
  const summary = useDiscoverySummary();
  const trades = useRecentTrades();

  const latestTokens = summary.data?.latestTokens ?? [];
  const trendingTokens = summary.data?.mostActiveTokens?.slice(0, 4) ?? [];
  const mostActive = summary.data?.mostActiveTokens ?? [];
  const recentlyTraded = useMemo<RecentTradesResponse>(() => (trades.data ?? []).slice(0, 6), [trades.data]);

  const loading = summary.isLoading && trades.isLoading;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm text-white/60">Live Sepolia feed</p>
        <h1 className="text-3xl font-semibold text-white">Discover tokens</h1>
        <NextActionHint message="Track trending launches, check curve status, and jump into trading." />
        <TestModeGate>
          <p className="text-xs text-white/60">Data sourced from the discovery summary endpoint (mock fallback offline).</p>
        </TestModeGate>
      </header>

      {loading && <SkeletonPanel text="Loading discovery data…" />}

      {!loading && (
        <div className="space-y-8">
          <Section title="Trending" description="Top movers by 24h volume">
            <TokenGrid tokens={trendingTokens} emptyLabel="No trending tokens yet." />
          </Section>

          <Section title="New launches" description="Fresh deployments across the launchpad">
            <TokenGrid tokens={latestTokens} emptyLabel="No launches yet — spin one up!" />
          </Section>

          <Section title="Most active" description="Highest trade counts over the last day">
            <TokenGrid tokens={mostActive} emptyLabel="No active markets yet." />
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

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
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

function TokenGrid({
  tokens,
  emptyLabel
}: {
  tokens: Array<{
    token_id: string;
    name: string;
    symbol: string;
    token_address: string;
    quote_token_address?: string;
    priceNative?: string;
    volume24h?: string;
    trades24h?: number;
    change5m?: string;
    change1h?: string;
    change24h?: string;
    status?: string;
  }>;
  emptyLabel: string;
}) {
  if (!tokens.length) {
    return <EmptyCard label={emptyLabel} />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tokens.map((token) => (
        <Link
          key={`${token.token_id}-${token.token_address}`}
          href={`/launch/${token.token_id}`}
          className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-lg transition hover:-translate-y-0.5 hover:border-indigo-400/40"
        >
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
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
            <span>Pair {token.symbol}/{resolveQuoteSymbol(token.quote_token_address)}</span>
            <StatusBadge status={token.status} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-white">
            <Metric label="Price" value={token.priceNative ? `${token.priceNative} ETH` : '—'} />
            <Metric label="Vol (24h)" value={token.volume24h ? `${token.volume24h} ETH` : '—'} />
            <Metric label="Trades" value={token.trades24h?.toString() ?? '—'} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <ChangeBadge label="5m" value={token.change5m} />
            <ChangeBadge label="1h" value={token.change1h} />
            <ChangeBadge label="24h" value={token.change24h} />
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
          <span className="text-xs text-white/60">{formatTradeAmount(trade)} </span>
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
  const positive = value?.trim().startsWith('+');
  const negative = value?.trim().startsWith('-');
  const tone = positive ? 'text-emerald-300' : negative ? 'text-rose-300' : 'text-white/60';
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      <p className={`text-sm font-semibold ${tone}`}>{value ?? '—'}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const label = status === 'migrated' ? 'Migrated' : status === 'migration_pending' ? 'Migration pending' : 'Bonding curve';
  const tone = status === 'migrated' ? 'bg-indigo-500/20 text-indigo-200' : status === 'migration_pending' ? 'bg-amber-500/20 text-amber-200' : 'bg-emerald-500/20 text-emerald-200';
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function EmptyCard({ label }: { label: string }) {
  return <p className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white/70">{label}</p>;
}

function SkeletonPanel({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-white/60">
      {text}
    </div>
  );
}

function formatTradeAmount(trade: RecentTradesResponse[number]) {
  if (trade.native_in) return `${(Number(trade.native_in) / 1e18).toFixed(4)} ETH`;
  if (trade.token_out) return `${Number(trade.token_out).toLocaleString()} TOKEN`;
  return '—';
}

function formatPrice(value?: string) {
  if (!value) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function resolveQuoteSymbol(address?: string) {
  if (!address) return 'WETH';
  if (address.toLowerCase().includes('fff997')) return 'WETH';
  return shortAddress(address);
}
