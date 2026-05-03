'use client';

import Link from 'next/link';
import NextActionHint from '@/components/common/NextActionHint';
import { useDiscoverySummary } from '@/hooks/useDiscoverySummary';
import { useRecentTrades } from '@/hooks/useRecentTrades';
import { shortAddress, shortHash, timeAgo } from '@/lib/formatters';
import type { RecentTradesResponse } from '@/lib/api/types';

export default function ActivityFeedPage() {
  const summary = useDiscoverySummary();
  const trades = useRecentTrades();

  const tokenMap = new Map(summary.data?.latestTokens?.map((token) => [token.token_id, token]));
  const activity: RecentTradesResponse = trades.data ?? [];
  const loading = summary.isLoading || trades.isLoading;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-white/60">Live feed</p>
        <h1 className="text-3xl font-semibold text-white">Global activity</h1>
        <NextActionHint message="Watch real-time buys and sells across every launch." />
      </header>

      {loading && <SkeletonCard text="Loading activity…" />}

      {!loading && !activity.length && <EmptyCard text="No live trades yet. As soon as testers interact, the feed will light up." />}

      <div className="space-y-3">
        {activity.map((trade) => {
          const token = tokenMap.get(trade.token_id);
          const name = token?.name || trade.token_name || `Token #${trade.token_id}`;
          const symbol = token?.symbol || trade.token_symbol || '—';
          const directionTone = trade.direction === 'buy' ? 'text-emerald-200 bg-emerald-500/10' : 'text-rose-200 bg-rose-500/10';
          return (
            <div key={trade.tx_hash} className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${directionTone}`}>{trade.direction.toUpperCase()}</span>
                <Link href={`/launch/${trade.token_id}`} className="font-semibold text-white hover:underline">
                  {name} ({symbol})
                </Link>
                <span className="text-xs text-white/50">{timeAgo(trade.timestamp)}</span>
                <span className="text-xs text-white/50">{formatAmount(trade.native_in)} ETH</span>
                <span className="text-xs text-white/50">Price {formatPrice(trade.execution_price_native)}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/60">
                {trade.wallet && <span>Trader {shortAddress(trade.wallet)}</span>}
                <Link href={`https://sepolia.etherscan.io/tx/${trade.tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:underline">
                  Tx {shortHash(trade.tx_hash)}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatAmount(value?: string | null) {
  if (!value) return '0';
  return (Number(value) / 1e18).toFixed(4);
}

function formatPrice(value?: string) {
  if (!value) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function EmptyCard({ text }: { text: string }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-white/70">{text}</div>;
}

function SkeletonCard({ text }: { text: string }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-white/60">{text}</div>;
}
