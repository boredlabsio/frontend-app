'use client';

import Link from 'next/link';
import NextActionHint from '@/components/common/NextActionHint';
import { useWallet } from '@/lib/providers/WalletProvider';
import TestModeGate from '@/components/common/TestModeGate';
import { useTokenSummary } from '@/hooks/useTokenSummary';
import { useRecentTrades } from '@/hooks/useRecentTrades';
import { useMemo, useState } from 'react';

type TradeStatus = 'idle' | 'preparing' | 'wallet' | 'pending' | 'success' | 'error';

type ActivityItem = {
  tx_hash: string;
  direction: 'buy' | 'sell';
  token_address?: string;
  amount?: string;
};

export default function LaunchDetail({ params }: { params: { id: string } }) {
  const wallet = useWallet();
  const summary = useTokenSummary(params.id);
  const trades = useRecentTrades(params.id);
  const [localActivity, setLocalActivity] = useState<ActivityItem[]>([]);

  const info = summary.data;
  const baseActivity = useMemo(() => trades.data ?? [], [trades.data]);
  const mergedActivity = useMemo(() => [...localActivity, ...baseActivity], [localActivity, baseActivity]);

  function appendMockTrade(direction: 'buy' | 'sell', amount: string) {
    const mockHash = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`;
    setLocalActivity((prev) => [{ tx_hash: mockHash, direction, amount }, ...prev]);
  }

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

      <TradePanels
        walletConnected={wallet.connected}
        price={info?.priceNative}
        appendActivity={appendMockTrade}
      />

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
        <TradesList trades={mergedActivity} />
      </section>

      <section className="rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-6 text-center text-white/60">
        Chart coming soon
      </section>

      <NextActionHint
        message={wallet.connected ? (mergedActivity.length ? 'Keep monitoring activity and prep for migration.' : 'Be the first to trade this token once real execution is live.') : 'Connect wallet to interact when trading is enabled.'}
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

function TradePanels({ walletConnected, price, appendActivity }: { walletConnected: boolean; price?: string; appendActivity: (direction: 'buy' | 'sell', amount: string) => void }) {
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [buyStatus, setBuyStatus] = useState<TradeStatus>('idle');
  const [sellStatus, setSellStatus] = useState<TradeStatus>('idle');
  const numericPrice = Number(price || '0.0001') || 0.0001;

  const buyQuote = useMemo(() => {
    if (!buyAmount) return '0';
    return (Number(buyAmount || 0) / numericPrice).toFixed(2);
  }, [buyAmount, numericPrice]);

  const sellQuote = useMemo(() => {
    if (!sellAmount) return '0';
    return (Number(sellAmount || 0) * numericPrice).toFixed(4);
  }, [sellAmount, numericPrice]);

  async function simulateTrade(direction: 'buy' | 'sell') {
    const hasWallet = walletConnected;
    const hasInput = direction === 'buy' ? Boolean(buyAmount) : Boolean(sellAmount);
    if (!hasWallet || !hasInput) return;

    const setStatus = direction === 'buy' ? setBuyStatus : setSellStatus;
    const amount = direction === 'buy' ? buyAmount : sellAmount;

    try {
      setStatus('preparing');
      await wait(500);
      setStatus('wallet');
      await wait(500);
      setStatus('pending');
      await wait(800);
      setStatus('success');
      appendActivity(direction, amount);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      await wait(400);
      setStatus('idle');
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TradePanel
        title="Buy"
        inputValue={buyAmount}
        setInputValue={setBuyAmount}
        outputValue={`${buyQuote} TOKEN`}
        walletConnected={walletConnected}
        status={buyStatus}
        onSubmit={() => simulateTrade('buy')}
      />
      <TradePanel
        title="Sell"
        inputValue={sellAmount}
        setInputValue={setSellAmount}
        outputValue={`${sellQuote} ETH`}
        walletConnected={walletConnected}
        status={sellStatus}
        onSubmit={() => simulateTrade('sell')}
      />
    </div>
  );
}

function TradePanel({
  title,
  inputValue,
  setInputValue,
  outputValue,
  walletConnected,
  status,
  onSubmit
}: {
  title: 'Buy' | 'Sell';
  inputValue: string;
  setInputValue: (value: string) => void;
  outputValue: string;
  walletConnected: boolean;
  status: TradeStatus;
  onSubmit: () => void;
}) {
  const disabled = !walletConnected || !inputValue || status === 'pending' || status === 'wallet';
  const statusMessage = getStatusMessage(status, walletConnected, Boolean(inputValue));

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {!walletConnected && <span className="text-xs text-amber-300">Connect wallet to trade</span>}
      </div>
      <div>
        <label className="text-sm text-white/60">Amount ({title === 'Buy' ? 'ETH' : 'TOKEN'})</label>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          type="number"
          min="0"
          step="0.0001"
          className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white focus:border-indigo-400"
          placeholder="0.0"
        />
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white/70">
        Quote preview: {outputValue}
      </div>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full rounded-full bg-white/90 px-4 py-2 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/40"
      >
        {status === 'pending' ? `${title} pending…` : title}
      </button>
      <NextActionHint message={statusMessage} tone={status === 'error' ? 'error' : status === 'success' ? 'success' : 'info'} />
    </div>
  );
}

function TradesList({ trades }: { trades: ActivityItem[] }) {
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
          <p className="text-white/70">Amount {trade.amount || '—'}</p>
        </div>
      ))}
    </div>
  );
}

function getStatusMessage(status: TradeStatus, walletConnected: boolean, hasInput: boolean) {
  if (!walletConnected) return 'Connect wallet to trade';
  if (!hasInput) return 'Enter an amount to preview a quote';

  switch (status) {
    case 'idle':
      return 'Ready to simulate trade. Execution wiring is pending.';
    case 'preparing':
      return 'Preparing quote…';
    case 'wallet':
      return 'Waiting for wallet confirmation (mock).';
    case 'pending':
      return 'Transaction pending…';
    case 'success':
      return 'Trade complete → check activity below.';
    case 'error':
      return 'Transaction failed → try again.';
    default:
      return '';
  }
}

function shortAddress(address?: string) {
  if (!address) return '—';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function shortHash(hash?: string) {
  if (!hash) return '';
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
