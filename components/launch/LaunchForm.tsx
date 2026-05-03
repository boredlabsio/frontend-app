'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/providers/WalletProvider';
import NextActionHint from '@/components/common/NextActionHint';
import { launchConfig } from '@/lib/launchConfig';

const initialState = {
  name: '',
  symbol: '',
  description: '',
  image: ''
};

type StatusState =
  | { state: 'idle' }
  | { state: 'preparing' }
  | { state: 'wallet'; message: string }
  | { state: 'pending'; txHash?: string }
  | { state: 'success'; txHash: string }
  | { state: 'error'; error: string };

export default function LaunchForm() {
  const wallet = useWallet();
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<StatusState>({ state: 'idle' });

  const cannotSubmit = !wallet.connected || status.state === 'pending' || status.state === 'wallet';

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cannotSubmit) return;

    if (!wallet.connected) {
      setStatus({ state: 'error', error: 'Connect wallet before launching.' });
      return;
    }

    setStatus({ state: 'preparing' });
    await new Promise((resolve) => setTimeout(resolve, 300));

    setStatus({ state: 'wallet', message: 'Contract wiring pending — mainnet launch flow not yet enabled.' });
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg'>
      <div>
        <label className='text-sm text-white/70'>Token name</label>
        <input value={form.name} onChange={(e) => updateField('name', e.target.value)} className='mt-1 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-white focus:border-indigo-400' required />
      </div>
      <div>
        <label className='text-sm text-white/70'>Symbol</label>
        <input value={form.symbol} onChange={(e) => updateField('symbol', e.target.value)} maxLength={8} className='mt-1 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-white focus:border-indigo-400' required />
      </div>
      <div>
        <label className='text-sm text-white/70'>Description</label>
        <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={3} className='mt-1 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-white focus:border-indigo-400' required />
      </div>
      <div>
        <label className='text-sm text-white/70'>Image / logo URL</label>
        <input value={form.image} onChange={(e) => updateField('image', e.target.value)} className='mt-1 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-white focus:border-indigo-400' placeholder='https://…' />
      </div>

      <div className='rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100'>
        <p className='text-sm font-semibold'>Launch fee</p>
        <p className='text-lg font-mono'>{Number(launchConfig.launchFeeWei) / 1e18} ETH (Sepolia)</p>
        <p className='text-xs mt-1'>Payable on LaunchFactory transaction. Wallet must be on chain ID {launchConfig.chainId}.</p>
      </div>

      <button type='submit' disabled={cannotSubmit} className='rounded-full bg-white px-4 py-2 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/40'>
        {status.state === 'preparing' ? 'Preparing…' : status.state === 'wallet' ? 'Waiting on wiring' : 'Submit launch'}
      </button>

      <div className='text-sm text-white/70 space-y-1'>
        <p>Registry: {launchConfig.registry}</p>
        <p>Factory: {launchConfig.factory}</p>
      </div>

      <NextActionHint message={getStatusMessage(status)} tone={status.state === 'error' ? 'error' : status.state === 'success' ? 'success' : 'info'} />
    </form>
  );
}

function getStatusMessage(status: StatusState) {
  switch (status.state) {
    case 'idle':
      return 'Fill out launch details and connect your Sepolia wallet.';
    case 'preparing':
      return 'Validating metadata…';
    case 'wallet':
      return status.message;
    case 'pending':
      return status.txHash ? `Transaction pending: ${shortHash(status.txHash)}` : 'Transaction submitted…';
    case 'success':
      return `Launch confirmed: ${shortHash(status.txHash)}`;
    case 'error':
      return status.error;
    default:
      return '';
  }
}

function shortHash(hash?: string) {
  if (!hash) return '';
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}
