'use client';

import { useWallet } from '@/lib/providers/WalletProvider';

function shortAddress(value?: string | null) {
  if (!value) return '';
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export default function WalletPlaceholder() {
  const wallet = useWallet();

  const label = (() => {
    if (wallet.connecting) return 'Connecting…';
    if (wallet.wrongNetwork) return 'Switch to Sepolia';
    if (wallet.connected && wallet.address) return shortAddress(wallet.address);
    return 'Connect Wallet';
  })();

  const handleClick = async () => {
    try {
      if (wallet.wrongNetwork) await wallet.ensureNetwork();
      else await wallet.toggle();
    } catch (err) {
      console.error('wallet action failed', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={wallet.connecting}
      className={`rounded-full border px-4 py-1 text-sm transition ${
        wallet.connected
          ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
          : wallet.wrongNetwork
            ? 'border-amber-400 bg-amber-500/10 text-amber-200'
            : 'border-white/30 text-white'
      } ${wallet.connecting ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      {label}
    </button>
  );
}
