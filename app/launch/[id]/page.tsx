'use client';

import Link from 'next/link';
import NextActionHint from '@/components/common/NextActionHint';
import { useWallet } from '@/lib/providers/WalletProvider';
import TestModeGate from '@/components/common/TestModeGate';
import { useTokenSummary } from '@/hooks/useTokenSummary';
import { useRecentTrades } from '@/hooks/useRecentTrades';

export default function LaunchDetail({ params }: { params: { id: string } }) {
  const wallet = useWallet();
  const summary = useTokenSummary(params.id);
  const trades = useRecentTrades(params.id);

  const info = summary.data;
  const activity = trades.data ?? [];

  return (
    <div className="space-y-6">
      <Link href="/discover" className="text-sm text-white/60 hover:underline">
        ← Back to discovery
      </Link>

      <header className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-white/60">Token #{params.id}</p>
          <h1 className="text-3xl font-semibold text-white">{info?.name || 'Unknown'}</h1>
          <p className="text-white/70">{info?.symbol || '—'} · {shortAddress(info?.token_address)}</p>
        </div>
        <div className="text-sm text-white/60">
          <p>Chain: Sepolia</p>
          <TestModeGate>
            <p className="text-xs text-white/50">Sepolia test mode only — liquidity is mock until migration.</p>
          </TestModeGate>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Price" value={`${info?.priceNative || '—'} ETH`} />
        <MetricCard label="Market status" value={info ? 'Bonding curve active' : 'Loading…'} />
        <MetricCard label="Volume 24h" value={`${info?.volume24h || '0'} ETH`} />
      </section>

      <section className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold text-white">Migration progress</h2>
        <p className="text-sm text-white/70">
          When the threshold is reached, liquidity migrates to Uniswap and LP is locked at LPForeverLock ({shortAddress(info?.token_address) || 'pending'}).
        </p>
        <div className="mt-2 h-3 w-full rounded-full bg-white/10">
          <div className="h-full rounded-full bg-indigo-400" style={{ width: `${info ? 45 : 10}%` }} />
        </div>
        <p className="text-xs text-white/60">Progress estimated — analytics endpoint still mocked.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Recent activity</h2>
        <TradesList trades={activity} />
      </section>

      <section className="rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-6 text-center text-white/60">
        Chart coming soon
      </section>

      <NextActionHint
        message={wallet.connected ? (activity.length ? 'More interactions coming soon.' : 'Be the first to trade this token once trading UI lands.') : 'Connect wallet to interact when trading is enabled.'}
        tone={wallet.connected ? 'info' : 'warn'}
      />
    </div>
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

function TradesList({ trades }: { trades: Array<{ tx_hash: string; direction: 'buy' | 'sell'; token_address?: string }> }) {
  if (!trades.length) {
    return <p className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white/70">No trades yet — be the first to interact.</p>;
  }
  return (
    <div className="space-y-2">
      {trades.map((trade) => (
        <div key={trade.tx_hash} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-sm text-white">
          <div>
            <p className="font-semibold">{trade.direction.toUpperCase()}</p>
            <p className="text-white/60">Tx {shortHash(trade.tx_hash)}</p>
          </div>
          <p className="text-white/70">Wallet {shortAddress(trade.token_address)}</p>
        </div>
      ))}
    </div>
  );
}

function shortAddress(address?: string) {
  if (!address) return '—';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function shortHash(hash?: string) {
  if (!hash) return '';
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}
