'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import type { Hash } from 'viem';
import { parseEther } from 'viem';
import NextActionHint from '@/components/common/NextActionHint';
import { useWallet } from '@/lib/providers/WalletProvider';
import TestModeGate from '@/components/common/TestModeGate';
import { useTokenSummary } from '@/hooks/useTokenSummary';
import { useRecentTrades } from '@/hooks/useRecentTrades';
import { getBuyQuote, getSellQuote, type QuoteSource } from '@/lib/api/quotes';
import { bondingCurveMarketAbi } from '@/lib/abi/bondingCurveMarket';
import { launchConfig } from '@/lib/launchConfig';

const REQUIRED_CHAIN_ID = launchConfig.chainId;

type TradeStatus =
  | { state: 'idle' }
  | { state: 'preparing' }
  | { state: 'wallet' }
  | { state: 'pending'; txHash?: Hash }
  | { state: 'success'; txHash?: Hash }
  | { state: 'error'; error: string; txHash?: Hash };

type ActivitySource = 'api' | 'mock' | 'onchain';

type ActivityItem = {
  txHash: string;
  direction: 'buy' | 'sell';
  amount?: string;
  wallet?: string | null;
  source: ActivitySource;
};

export default function LaunchDetail({ params }: { params: { id: string } }) {
  const wallet = useWallet();
  const summary = useTokenSummary(params.id);
  const trades = useRecentTrades(params.id);
  const [localActivity, setLocalActivity] = useState<ActivityItem[]>([]);

  const info = summary.data;
  const baseActivity = useMemo<ActivityItem[]>(
    () =>
      (trades.data ?? []).map((trade) => ({
        txHash: trade.tx_hash,
        direction: trade.direction,
        amount: trade.native_in || trade.token_out || undefined,
        source: 'api'
      })),
    [trades.data]
  );
  const mergedActivity = useMemo(
    () => [...localActivity, ...baseActivity],
    [localActivity, baseActivity]
  );

  const marketAddress = info?.marketAddress || info?.token_address || info?.tokenAddress || null;

  function appendActivity(
    direction: 'buy' | 'sell',
    amount: string,
    txHash?: string,
    source: ActivitySource = 'mock'
  ) {
    const hash = txHash ?? `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`;
    setLocalActivity((prev) => [{ txHash: hash, direction, amount, source }, ...prev]);
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
          <p className="text-white/70">{info?.symbol || '—'} · {shortAddress(info?.tokenAddress || info?.token_address)}</p>
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
        tokenId={params.id}
        wallet={wallet}
        marketAddress={marketAddress}
        appendActivity={appendActivity}
        price={info?.priceNative}
      />

      <section className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold text-white">Migration progress</h2>
        <p className="text-sm text-white/70">
          When the threshold is reached, liquidity migrates to Uniswap and LP is locked at LPForeverLock ({shortAddress(info?.tokenAddress || info?.token_address) || 'pending'}).
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
        message={
          wallet.connected
            ? mergedActivity.length
              ? 'Keep monitoring activity and prep for migration.'
              : 'Be the first to trade this token once real execution is live.'
            : wallet.wrongNetwork
              ? 'Switch your wallet to Sepolia to interact.'
              : 'Connect wallet to interact when trading is enabled.'
        }
        tone={wallet.connected ? 'info' : wallet.wrongNetwork ? 'warn' : 'warn'}
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

type TradePanelProps = {
  tokenId: string;
  wallet: ReturnType<typeof useWallet>;
  price?: string;
  marketAddress?: string | null;
  appendActivity: (direction: 'buy' | 'sell', amount: string, txHash?: string, source?: ActivitySource) => void;
};

function TradePanels({ tokenId, wallet, price, marketAddress, appendActivity }: TradePanelProps) {
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [buyStatus, setBuyStatus] = useState<TradeStatus>({ state: 'idle' });
  const [sellStatus, setSellStatus] = useState<TradeStatus>({ state: 'idle' });
  const [buyQuote, setBuyQuote] = useState<{ amount: string; source: QuoteSource }>({ amount: '0', source: 'unavailable' });
  const [sellQuote, setSellQuote] = useState<{ amount: string; source: QuoteSource }>({ amount: '0', source: 'unavailable' });
  const [buyTxHash, setBuyTxHash] = useState<Hash | undefined>();

  const publicClient = usePublicClient({ chainId: REQUIRED_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const { isSuccess: buyConfirmed, isError: buyFailed } = useWaitForTransactionReceipt({ hash: buyTxHash });

  useEffect(() => {
    if (buyConfirmed && buyTxHash) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBuyStatus({ state: 'success', txHash: buyTxHash });
      appendActivity('buy', `${buyAmount || '0'} ETH`, buyTxHash, 'onchain');
      setBuyAmount('');
      setBuyTxHash(undefined);
    }
  }, [appendActivity, buyAmount, buyConfirmed, buyTxHash]);

  useEffect(() => {
    if (buyFailed && buyTxHash) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBuyStatus({ state: 'error', error: 'Transaction failed', txHash: buyTxHash });
    }
  }, [buyFailed, buyTxHash]);

  const numericPrice = Number(price || '0.0001') || 0.0001;

  const mockBuyValue = useMemo(() => {
    if (!buyAmount) return '0';
    return (Number(buyAmount || 0) / numericPrice).toFixed(2);
  }, [buyAmount, numericPrice]);

  const mockSellValue = useMemo(() => {
    if (!sellAmount) return '0';
    return (Number(sellAmount || 0) * numericPrice).toFixed(4);
  }, [sellAmount, numericPrice]);

  useEffect(() => {
    if (!buyAmount) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBuyQuote({ amount: '0', source: 'unavailable' });
      return;
    }
    let cancelled = false;
    (async () => {
      const quote = await getBuyQuote(tokenId, buyAmount);
      if (!cancelled) setBuyQuote(quote);
    })();
    return () => {
      cancelled = true;
    };
  }, [buyAmount, tokenId]);

  useEffect(() => {
    if (!sellAmount) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSellQuote({ amount: '0', source: 'unavailable' });
      return;
    }
    let cancelled = false;
    (async () => {
      const quote = await getSellQuote(tokenId, sellAmount);
      if (!cancelled) setSellQuote(quote);
    })();
    return () => {
      cancelled = true;
    };
  }, [sellAmount, tokenId]);

  const handleBuy = async () => {
    if (!wallet.connected) {
      setBuyStatus({ state: 'error', error: wallet.wrongNetwork ? 'Switch to Sepolia to trade.' : 'Connect wallet to trade.' });
      return;
    }
    if (!marketAddress) {
      setBuyStatus({ state: 'error', error: 'Missing market address.' });
      return;
    }

    let valueWei: bigint;
    try {
      valueWei = parseEther(buyAmount || '0');
    } catch {
      setBuyStatus({ state: 'error', error: 'Enter a valid ETH amount.' });
      return;
    }
    if (valueWei <= 0n) {
      setBuyStatus({ state: 'error', error: 'Amount must be greater than zero.' });
      return;
    }

    setBuyStatus({ state: 'preparing' });

    let minTokensOut: bigint | null = null;
    if (publicClient) {
      try {
        const [tokensOut] = await publicClient.readContract({
          address: marketAddress as `0x${string}`,
          abi: bondingCurveMarketAbi,
          functionName: 'quoteBuy',
          args: [valueWei]
        });
        if (tokensOut > 0n) {
          minTokensOut = (tokensOut * 9700n) / 10000n;
        }
      } catch (err) {
        console.warn('quoteBuy failed', err);
      }
    }

    if (!minTokensOut || minTokensOut <= 0n) {
      setBuyStatus({ state: 'error', error: 'Unable to fetch on-chain quote. Try again.' });
      return;
    }

    try {
      setBuyStatus({ state: 'wallet' });
      const hash = await writeContractAsync({
        address: marketAddress as `0x${string}`,
        abi: bondingCurveMarketAbi,
        functionName: 'buy',
        args: [minTokensOut, BigInt(Math.floor(Date.now() / 1000) + 600)],
        value: valueWei,
        chainId: REQUIRED_CHAIN_ID
      });
      setBuyTxHash(hash);
      setBuyStatus({ state: 'pending', txHash: hash });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transaction rejected';
      setBuyStatus({ state: 'error', error: message });
    }
  };

  const handleSell = async () => {
    if (!wallet.connected) {
      setSellStatus({ state: 'error', error: wallet.wrongNetwork ? 'Switch to Sepolia to trade.' : 'Connect wallet to trade.' });
      return;
    }
    if (!sellAmount) {
      setSellStatus({ state: 'error', error: 'Enter an amount to sell.' });
      return;
    }
    setSellStatus({ state: 'pending' });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSellStatus({ state: 'success' });
    appendActivity('sell', `${sellAmount} TOKEN`);
  };

  const buyQuoteLabel = labelForQuote(buyQuote.source);
  const sellQuoteLabel = labelForQuote(sellQuote.source);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TradePanel
        title="Buy"
        inputValue={buyAmount}
        setInputValue={setBuyAmount}
        outputValue={`${buyQuote.amount || mockBuyValue} TOKEN`}
        quoteLabel={buyQuoteLabel}
        wallet={wallet}
        status={buyStatus}
        onSubmit={handleBuy}
        actionLabel="Buy"
      />
      <TradePanel
        title="Sell"
        inputValue={sellAmount}
        setInputValue={setSellAmount}
        outputValue={`${sellQuote.amount || mockSellValue} ETH`}
        quoteLabel={sellQuoteLabel}
        wallet={wallet}
        status={sellStatus}
        onSubmit={handleSell}
        actionLabel="Sell"
      />
    </div>
  );
}

function TradePanel({
  title,
  inputValue,
  setInputValue,
  outputValue,
  quoteLabel,
  wallet,
  status,
  onSubmit,
  actionLabel
}: {
  title: 'Buy' | 'Sell';
  inputValue: string;
  setInputValue: (value: string) => void;
  outputValue: string;
  quoteLabel: string;
  wallet: ReturnType<typeof useWallet>;
  status: TradeStatus;
  onSubmit: () => void;
  actionLabel: string;
}) {
  const disabled =
    !wallet.connected || wallet.wrongNetwork || !inputValue || status.state === 'pending' || status.state === 'wallet';
  const statusMessage = getStatusMessage(status, wallet, Boolean(inputValue));

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {!wallet.connected && <span className="text-xs text-amber-300">Connect wallet to trade</span>}
        {wallet.wrongNetwork && <span className="text-xs text-amber-300">Switch to Sepolia</span>}
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
        <p>Quote preview: {outputValue}</p>
        <p className="text-xs text-white/50">{quoteLabel}</p>
      </div>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full rounded-full bg-white/90 px-4 py-2 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/40"
      >
        {status.state === 'pending' ? `${actionLabel} pending…` : actionLabel}
      </button>
      <NextActionHint message={statusMessage} tone={status.state === 'error' ? 'error' : status.state === 'success' ? 'success' : 'info'} />
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
        <div key={trade.txHash} className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-sm text-white">
          <div>
            <p className="font-semibold uppercase tracking-wide">{trade.direction}</p>
            <p className="text-white/60">Tx {shortHash(trade.txHash)}</p>
          </div>
          {trade.amount && <p className="text-white/70">Amount {trade.amount}</p>}
          {trade.source === 'onchain' && <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">on-chain</span>}
        </div>
      ))}
    </div>
  );
}

function getStatusMessage(status: TradeStatus, wallet: ReturnType<typeof useWallet>, hasInput: boolean) {
  if (!wallet.connected) return wallet.wrongNetwork ? 'Switch to Sepolia to trade.' : 'Connect wallet to trade.';
  if (!hasInput) return 'Enter an amount to preview a quote';

  switch (status.state) {
    case 'idle':
      return 'Ready to simulate trade. Execution wiring is pending.';
    case 'preparing':
      return 'Preparing quote…';
    case 'wallet':
      return 'Confirm the transaction in your wallet.';
    case 'pending':
      return status.txHash ? `Transaction pending: ${shortHash(status.txHash)}` : 'Transaction pending…';
    case 'success':
      return status.txHash ? `Trade complete: ${shortHash(status.txHash)}` : 'Trade complete → check activity below.';
    case 'error':
      return status.error;
    default:
      return '';
  }
}

function labelForQuote(source: QuoteSource) {
  if (source === 'live') return 'Live quote';
  if (source === 'mock') return 'Mock quote';
  return 'Quote unavailable';
}

function shortAddress(value?: string | null) {
  if (!value) return '—';
  const address = value.toString();
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function shortHash(value?: string | Hash) {
  if (!value) return '';
  const hash = value.toString();
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}
