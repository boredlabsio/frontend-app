'use client';

import Link from 'next/link';
import { useDiscoverySummary } from '@/hooks/useDiscoverySummary';
import NextActionHint from '@/components/common/NextActionHint';
import TestModeGate from '@/components/common/TestModeGate';
import { useRecentTrades } from '@/hooks/useRecentTrades';

function SectionWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function TokenGrid({ tokens }: { tokens: Array<{ token_id: string; name: string; symbol: string; token_address: string; volume24h?: string; trades24h?: number; createdAt?: string }> }) {
  if (!tokens.length) {
    return <p className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white/70">No tokens yet — be the first to launch.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tokens.map((token) => (
        <Link
          key={`${token.token_id}-${token.token_address}`}
          href={`/launch/${token.token_id}`}
          className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition hover:-translate-y-0.5 hover:border-indigo-400/40"
        >
          <p className="text-sm text-white/60">{shortAddress(token.token_address)}</p>
          <h3 className="text-lg font-semibold text-white">{token.name} · {token.symbol}</h3>
          {'volume24h' in token && (
            <p className="text-sm text-white/70">Volume (24h): {token.volume24h ?? '0'} ETH · Trades: {token.trades24h ?? 0}</p>
          )}
          {token.createdAt && (
            <p className="text-xs text-white/50">Launched {new Date(token.createdAt).toLocaleString()}</p>
          )}
        </Link>
      ))}
    </div>
  );
}

function TradesList({ trades }: { trades: Array<{ token_id: string; tx_hash: string; direction: 'buy' | 'sell'; execution_price_native: string }> }) {
  if (!trades.length) {
    return <p className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white/70">No recent trades yet.</p>;
  }
  return (
    <div className="space-y-2">
      {trades.map((trade) => (
        <Link
          key={trade.tx_hash}
          href={`/launch/${trade.token_id}`}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-sm text-white"
        >
          <div>
            <p className="font-semibold">{trade.direction.toUpperCase()} · token #{trade.token_id}</p>
            <p className="text-white/60">Tx {shortHash(trade.tx_hash)}</p>
          </div>
          <span className="text-white/70">{trade.execution_price_native.slice(0, 6)} price</span>
        </Link>
      ))}
    </div>
  );
}

export default function DiscoverPage() {
  const summary = useDiscoverySummary();
  const trades = useRecentTrades();

  const latestTokens = summary.data?.latestTokens ?? [];
  const mostActive = summary.data?.mostActiveTokens ?? [];
  const trending = mostActive.slice(0, 3);
  const recentTrades = trades.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Discover launches</h1>
      <NextActionHint message="Select a token to trade or launch your own." />
      <TestModeGate>
        <p className="text-xs text-white/60">Data sourced from Sepolia summary endpoint (mock fallback when offline).</p>
      </TestModeGate>

      <SectionWrapper title="Latest tokens">
        <TokenGrid tokens={latestTokens} />
      </SectionWrapper>

      <SectionWrapper title="Trending">
        <TokenGrid tokens={trending} />
      </SectionWrapper>

      <SectionWrapper title="Most active">
        <TokenGrid tokens={mostActive} />
      </SectionWrapper>

      <SectionWrapper title="Recent trades">
        <TradesList trades={recentTrades} />
      </SectionWrapper>
    </div>
  );
}

function shortAddress(address?: string) {
  if (!address) return '—';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function shortHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}
