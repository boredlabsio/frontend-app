'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import type { Hash } from 'viem';
import { parseEther } from 'viem';
import NextActionHint from '@/components/common/NextActionHint';
import { useWallet } from '@/lib/providers/WalletProvider';
import TestModeGate from '@/components/common/TestModeGate';
import { useTokenSummary } from '@/hooks/useTokenSummary';
import { useRecentTrades } from '@/hooks/useRecentTrades';
import { useDiscoverySummary } from '@/hooks/useDiscoverySummary';
import { debugLog } from '@/lib/utils/debug';
import { getBuyQuote, getSellQuote, type QuoteSource } from '@/lib/api/quotes';
import type { RecentTradesResponse } from '@/lib/api/types';
import { bondingCurveMarketAbi } from '@/lib/abi/bondingCurveMarket';
import { launchConfig } from '@/lib/launchConfig';
import { shortAddress, shortHash, timeAgo } from '@/lib/formatters';

const REQUIRED_CHAIN_ID = launchConfig.chainId;
const EXPLORER_TX_BASE = "https://sepolia.etherscan.io/tx/";

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
  timestamp?: string;
  source: ActivitySource;
};

export default function LaunchDetail({ params }: { params: { id: string } }) {
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const summary = useTokenSummary(params.id);
  const trades = useRecentTrades(params.id);
  const discovery = useDiscoverySummary();
  const [localActivity, setLocalActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (summary.data) {
      debugLog('TOKEN DETAIL:', summary.data);
    }
  }, [summary.data]);

  const discoveryToken = useMemo(() => {
    if (!discovery.data) return null;
    return (
      discovery.data.latestTokens.find((token) => token.token_id === params.id) ||
      discovery.data.mostActiveTokens.find((token) => token.token_id === params.id) ||
      null
    );
  }, [discovery.data, params.id]);

  const info = summary.data;
  const dataSource = (info as any)?.__source ?? 'mock';
  const tradesSource = (Array.isArray(trades.data) && (trades.data as any).__source) || dataSource;
  const dataSourceLabel = `Data source: ${describeSource(dataSource)}${tradesSource !== dataSource ? ` · Trades: ${describeSource(tradesSource)}` : ''}`;
  const dataSourceTone = dataSource === 'api' ? 'success' : dataSource === 'snapshot' ? 'info' : 'warn';
  const marketAddress =
    info?.marketAddress ||
    info?.token_address ||
    info?.tokenAddress ||
    discoveryToken?.launchpad_market ||
    discoveryToken?.token_address ||
    null;
  const marketReady = Boolean(marketAddress);
  const displayName = info?.name || discoveryToken?.name || `Token #${params.id}`;
  const displaySymbol = info?.symbol || discoveryToken?.symbol || '—';
  const effectiveTokenSymbol = displaySymbol === '—' ? 'TOKEN' : displaySymbol;
  const displayPrice = info?.priceNative || discoveryToken?.priceNative || '—';
  const displayVolume = info?.volume24h || discoveryToken?.volume24h || '0';
  const displayTokenAddress = info?.tokenAddress || info?.token_address || discoveryToken?.token_address || discoveryToken?.launchpad_market || '';
  const displayStatus = !marketReady
    ? 'Market not found'
    : discoveryToken?.status === 'migrated'
      ? 'Migrated to Uniswap'
      : 'Bonding curve active';
  const sparklineSeries = useMemo(() => buildSparklineSeries(trades.data, displayPrice), [trades.data, displayPrice]);
  const baseActivity = useMemo<ActivityItem[]>(
    () =>
      (trades.data ?? []).map((trade) => ({
        txHash: trade.tx_hash,
        direction: trade.direction,
        amount: trade.native_in
          ? `${(Number(trade.native_in) / 1e18).toFixed(4)} ETH`
          : trade.token_out
            ? `${Number(trade.token_out) / 1e18} TOKEN`
            : undefined,
        wallet: trade.wallet,
        timestamp: trade.timestamp,
        source: 'api'
      })),
    [trades.data]
  );
  const mergedActivity = useMemo(
    () => [...localActivity, ...baseActivity],
    [localActivity, baseActivity]
  );

  const appendActivity = useCallback(
    (direction: 'buy' | 'sell', amount: string, txHash?: string, source: ActivitySource = 'mock') => {
      const hash = txHash ?? `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`;
      setLocalActivity((prev) => [
        { txHash: hash, direction, amount, source, timestamp: new Date().toISOString() },
        ...prev
      ]);
    },
    []
  );

  const broadcastTrade = useCallback(
    (trade: RecentTradesResponse[number]) => {
      queryClient.setQueryData<RecentTradesResponse>(['recentTrades', undefined], (prev) => {
        const next = prev ? [trade, ...prev] : [trade];
        return next.slice(0, 50);
      });
      queryClient.setQueryData<RecentTradesResponse>(['recentTrades', params.id], (prev) => {
        const next = prev ? [trade, ...prev] : [trade];
        return next.slice(0, 50);
      });
    },
    [params.id, queryClient]
  );

  return (
    <div className="space-y-6">
      <Link href="/discover" className="text-sm text-white/60 hover:underline">
        ← Back to discovery
      </Link>

      <header className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-white/60">Token #{params.id}</p>
          <h1 className="text-3xl font-semibold text-white">{displayName}</h1>
          <p className="text-white/70">
            {displaySymbol} · {displayTokenAddress ? shortAddress(displayTokenAddress) : 'address pending'}
          </p>
        </div>
        <div className="text-sm text-white/60">
          <p>Chain: Sepolia</p>
          <TestModeGate>
            <p className="text-xs text-white/50">Sepolia test mode only — liquidity is mock until migration.</p>
          </TestModeGate>
        </div>
      </header>

      <NextActionHint message={dataSourceLabel} tone={dataSourceTone} />
      <NextActionHint
        message={marketReady ? 'Bonding curve live — buy orders enabled.' : 'Trading not available yet (market initializing).'}
        tone={marketReady ? 'success' : 'warn'}
      />

      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Price" value={`${displayPrice} ETH`} />
        <MetricCard label="Market status" value={displayStatus} />
        <MetricCard label="Volume 24h" value={`${displayVolume} ETH`} />
      </section>

      <PriceSparkline series={sparklineSeries} price={displayPrice} volume={displayVolume} />

      {!marketReady && (
        <NextActionHint message="Trading not available yet (market initializing)." tone="warn" />
      )}

      <TradePanels
        tokenId={params.id}
        wallet={wallet}
        marketAddress={marketAddress}
        marketReady={marketReady}
        tokenSymbol={effectiveTokenSymbol}
        tokenName={displayName}
        tokenAddress={displayTokenAddress || undefined}
        quoteTokenAddress={discoveryToken?.quote_token_address}
        priceLabel={displayPrice === '—' ? undefined : displayPrice}
        walletAddress={wallet.address ?? null}
        appendActivity={appendActivity}
        onBroadcastTrade={broadcastTrade}
        price={displayPrice === '—' ? undefined : displayPrice}
      />

      <section className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold text-white">Migration progress</h2>
        <p className="text-sm text-white/70">
          When the threshold is reached, liquidity migrates to Uniswap and LP is locked at LPForeverLock ({displayTokenAddress ? shortAddress(displayTokenAddress) : 'pending'}).
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

type PendingBuyMeta = {
  ethAmount: string;
  ethAmountWei: string;
  tokensOutWei: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress?: string;
  quoteTokenAddress?: string;
  priceLabel?: string;
  walletAddress?: string | null;
};

type TradePanelProps = {
  tokenId: string;
  wallet: ReturnType<typeof useWallet>;
  price?: string;
  marketAddress?: string | null;
  marketReady: boolean;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress?: string;
  quoteTokenAddress?: string;
  priceLabel?: string;
  walletAddress?: string | null;
  appendActivity: (direction: 'buy' | 'sell', amount: string, txHash?: string, source?: ActivitySource) => void;
  onBroadcastTrade: (trade: RecentTradesResponse[number]) => void;
};

function TradePanels({ tokenId, wallet, price, marketAddress, marketReady, tokenSymbol, tokenName, tokenAddress, quoteTokenAddress, priceLabel, walletAddress, appendActivity, onBroadcastTrade }: TradePanelProps) {
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [buyStatus, setBuyStatus] = useState<TradeStatus>({ state: 'idle' });
  const [sellStatus, setSellStatus] = useState<TradeStatus>({ state: 'idle' });
  const [buyQuote, setBuyQuote] = useState<{ amount: string; source: QuoteSource }>({ amount: '0', source: 'unavailable' });
  const [pendingBuyMeta, setPendingBuyMeta] = useState<PendingBuyMeta | null>(null);
  const [sellQuote, setSellQuote] = useState<{ amount: string; source: QuoteSource }>({ amount: '0', source: 'unavailable' });
  const [buyTxHash, setBuyTxHash] = useState<Hash | undefined>();

  const publicClient = usePublicClient({ chainId: REQUIRED_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const { isSuccess: buyConfirmed, isError: buyFailed } = useWaitForTransactionReceipt({ hash: buyTxHash });

  useEffect(() => {
    if (!buyConfirmed || !buyTxHash) return;
    const meta = pendingBuyMeta;
    const amountLabel = meta?.ethAmount ?? '0';
    setBuyStatus({ state: 'success', txHash: buyTxHash });
    appendActivity('buy', `${amountLabel} ETH`, buyTxHash, 'onchain');
    if (meta) {
      onBroadcastTrade({
        token_id: meta.tokenId,
        token_name: meta.tokenName,
        token_symbol: meta.tokenSymbol,
        direction: 'buy',
        tx_hash: buyTxHash,
        block_number: 'pending',
        native_in: meta.ethAmountWei,
        native_out: null,
        token_in: null,
        token_out: meta.tokensOutWei,
        token_address: meta.tokenAddress || '',
        quote_token_address: meta.quoteTokenAddress,
        execution_price_native: meta.priceLabel,
        wallet: meta.walletAddress ?? undefined,
        timestamp: new Date().toISOString()
      });
    }
    setPendingBuyMeta(null);
    setBuyAmount('');
    setBuyTxHash(undefined);
  }, [appendActivity, buyConfirmed, buyTxHash, onBroadcastTrade, pendingBuyMeta]);

  useEffect(() => {
    if (buyFailed && buyTxHash) {
      setBuyStatus({ state: 'error', error: 'Transaction failed', txHash: buyTxHash });
      setPendingBuyMeta(null);
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
      setBuyStatus({ state: 'error', error: 'Trading not available yet (market initializing).' });
      return;
    }

    let valueWei: bigint;
    try {
      valueWei = parseEther(buyAmount || '0');
    } catch {
      setBuyStatus({ state: 'error', error: 'Enter a valid ETH amount.' });
      return;
    }
    if (valueWei <= BigInt(0)) {
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
        if (tokensOut > BigInt(0)) {
          minTokensOut = (tokensOut * BigInt(9700)) / BigInt(10000);
        }
      } catch (err) {
        console.warn('quoteBuy failed', err);
      }
    }

    if (!minTokensOut || minTokensOut <= BigInt(0)) {
      setBuyStatus({ state: 'error', error: 'Unable to fetch on-chain quote. Try again.' });
      return;
    }

    setPendingBuyMeta({
      ethAmount: buyAmount || '0',
      ethAmountWei: valueWei.toString(),
      tokensOutWei: minTokensOut.toString(),
      tokenId,
      tokenName,
      tokenSymbol,
      tokenAddress,
      quoteTokenAddress,
      priceLabel,
      walletAddress
    });

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
      setPendingBuyMeta(null);
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
    appendActivity('sell', `${sellAmount} ${effectiveTokenSymbol}`);
  };

  const buyQuoteSource = buyQuote.source;
  const sellQuoteSource = sellQuote.source;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TradePanel
        title="Buy"
        inputValue={buyAmount}
        setInputValue={setBuyAmount}
        outputValue={buyQuote.amount || mockBuyValue}
        outputUnit={tokenSymbol || 'TOKEN'}
        quoteSource={buyQuoteSource}
        tokenSymbol={effectiveTokenSymbol}
        wallet={wallet}
        status={buyStatus}
        onSubmit={handleBuy}
        actionLabel="Buy"
        marketReady={marketReady}
      />
      <TradePanel
        title="Sell"
        inputValue={sellAmount}
        setInputValue={setSellAmount}
        outputValue={sellQuote.amount || mockSellValue}
        outputUnit="ETH"
        quoteSource={sellQuoteSource}
        tokenSymbol={effectiveTokenSymbol}
        wallet={wallet}
        status={sellStatus}
        onSubmit={handleSell}
        actionLabel="Sell"
        marketReady={marketReady}
      />
    </div>
  );
}

function TradePanel({
  title,
  inputValue,
  setInputValue,
  outputValue,
  outputUnit,
  quoteSource,
  wallet,
  status,
  onSubmit,
  actionLabel,
  marketReady,
  tokenSymbol
}: {
  title: 'Buy' | 'Sell';
  inputValue: string;
  setInputValue: (value: string) => void;
  outputValue: string;
  outputUnit: string;
  quoteSource: QuoteSource;
  wallet: ReturnType<typeof useWallet>;
  status: TradeStatus;
  onSubmit: () => void;
  actionLabel: string;
  marketReady: boolean;
  tokenSymbol: string;
}) {

  const quoteLabel = labelForQuote(quoteSource);
  const quoteTone = quoteSource === 'live' ? 'text-emerald-300' : quoteSource === 'mock' ? 'text-white/60' : 'text-amber-200';
  const amountUnit = title === 'Buy' ? 'ETH' : tokenSymbol || 'TOKEN';
  const previewValue = outputValue ? `${outputValue} ${outputUnit}` : '—';
  const disabled =
    !wallet.connected || wallet.wrongNetwork || !inputValue || status.state === 'pending' || status.state === 'wallet' || !marketReady;
  const statusMessage = getStatusMessage(status, wallet, Boolean(inputValue), marketReady);
  const statusDetail = renderStatusDetail(status);

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {!wallet.connected && <span className="text-xs text-amber-300">Connect wallet to trade</span>}
        {wallet.wrongNetwork && <span className="text-xs text-amber-300">Switch to Sepolia</span>}
      </div>
      <div>
        <label className="text-sm text-white/60">Amount ({amountUnit})</label>
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
        <p>Quote preview: {previewValue}</p>
        <p className={`text-xs ${quoteTone}`}>Source: {quoteLabel}</p>
      </div>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full rounded-full bg-white/90 px-4 py-2 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/40"
      >
        {status.state === 'pending' ? `${actionLabel} pending…` : actionLabel}
      </button>
      {!marketReady && <p className="text-xs text-amber-300">Trading not available yet (market initializing).</p>}
      <NextActionHint message={statusMessage} tone={status.state === 'error' ? 'error' : status.state === 'success' ? 'success' : 'info'} />
      {statusDetail && (
        <p className="text-xs text-white/60">{statusDetail}</p>
      )}
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
            <p className="text-white/60">{trade.amount || '—'}</p>
          </div>
          {trade.wallet && <span className="text-xs text-white/60">Trader {shortAddress(trade.wallet)}</span>}
          {trade.timestamp && <span className="text-xs text-white/50">{timeAgo(trade.timestamp)}</span>}
          <a
            href={`https://sepolia.etherscan.io/tx/${trade.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/70 underline-offset-2 hover:underline"
          >
            Tx {shortHash(trade.txHash)}
          </a>
          {trade.source === 'onchain' && (
            <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">on-chain</span>
          )}
        </div>
      ))}
    </div>
  );
}

function getStatusMessage(status: TradeStatus, wallet: ReturnType<typeof useWallet>, hasInput: boolean, marketReady: boolean) {
  if (!wallet.connected) return wallet.wrongNetwork ? 'Switch to Sepolia to trade.' : 'Connect wallet to trade.';
  if (!marketReady) return 'Trading not available yet (market initializing).';
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

function buildSparklineSeries(trades: RecentTradesResponse | undefined, displayPrice: string) {
  const pricePoints = (trades ?? [])
    .map((trade) => Number(trade.execution_price_native))
    .filter((value) => Number.isFinite(value));
  if (pricePoints.length >= 3) {
    return pricePoints.slice(-20);
  }
  const fallback = displayPrice !== '—' ? Number(displayPrice) : 0.01;
  const base = Number.isFinite(fallback) && fallback > 0 ? fallback : 0.01;
  return Array.from({ length: 12 }, (_, index) => base * (1 + Math.sin(index / 2) * 0.02));
}

function renderStatusDetail(status: TradeStatus) {
  if (!status.txHash) return null;
  const url = `${EXPLORER_TX_BASE}${status.txHash.replace(/^0x/, '')}`;
  const label = status.state === 'pending' ? 'View pending transaction' : 'View transaction';
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-300 underline-offset-2 hover:underline">
      {label}
    </a>
  );
}

function describeSource(source: string) {
  if (source === 'api') return 'Live indexer';
  if (source === 'snapshot') return 'Indexer snapshot';
  return 'Mock fallback';
}

function labelForQuote(source: QuoteSource) {
  if (source === 'live') return 'Live quote';
  if (source === 'mock') return 'Mock quote';
  return 'Quote unavailable';
}

function PriceSparkline({ series, price, volume }: { series: number[]; price: string; volume: string }) {
  const width = 400;
  const height = 140;
  const data = series.length ? series : [0];
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
          <p className="text-lg font-semibold text-white">Live chart coming soon</p>
        </div>
        <div className="text-sm text-white/70">
          <span className="mr-4">Spot {price === '—' ? '—' : `${price} ETH`}</span>
          <span>24h vol {volume} ETH</span>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-500/10 via-slate-900/80 to-transparent p-4">
        <svg viewBox="0 0 ${width} ${height}" className="h-32 w-full text-indigo-400/80">
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-xs text-white/50">Sparkline reflects recent trades or synthetic movement while the full chart ships.</p>
      </div>
    </section>
  );
}

