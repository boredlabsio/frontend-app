'use client';

import Link from 'next/link';
import NextActionHint from '@/components/common/NextActionHint';
import { useWallet } from '@/lib/providers/WalletProvider';
import TestModeGate from '@/components/common/TestModeGate';

export default function LaunchDetail({ params }: { params: { id: string } }) {
  const wallet = useWallet();

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-white/60 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-3xl font-semibold">Launch: {params.id}</h1>
      <p className="text-white/70">
        Token details and trading UI will live here. For now this page acts as a placeholder so navigation works.
      </p>
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <p className="text-sm text-white/60">Price</p>
        <p className="text-2xl font-semibold">0.017 ETH</p>
      </div>
      <NextActionHint
        message={wallet.connected ? 'Use your Sepolia wallet in the embedded trading widget (coming soon) to make the first trade.' : 'Connect a wallet before attempting a buy so we can prep quotes.'}
        tone={wallet.connected ? 'info' : 'warn'}
      />
      <TestModeGate>
        <p className="text-xs text-white/60">Trades on this page run against Sepolia test contracts only.</p>
      </TestModeGate>
    </div>
  );
}
