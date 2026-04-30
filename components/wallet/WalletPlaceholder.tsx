'use client';

import { useWallet } from '@/lib/providers/WalletProvider';

export default function WalletPlaceholder() {
  const wallet = useWallet();

  return (
    <button
      type="button"
      onClick={wallet.toggle}
      className={`rounded-full border px-4 py-1 text-sm transition ${
        wallet.connected
          ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
          : 'border-white/30 text-white'
      }`}
    >
      {wallet.connected ? wallet.address?.slice(0, 6) + '…' + wallet.address?.slice(-4) : 'Connect Wallet'}
    </button>
  );
}
