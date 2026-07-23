'use client';

import Link from 'next/link';
import OnboardingBanner from '@/components/common/OnboardingBanner';
import NextActionHint from '@/components/common/NextActionHint';
import { useWallet } from '@/lib/providers/WalletProvider';
import TestModeGate from '@/components/common/TestModeGate';

export default function Home() {
  const wallet = useWallet();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-slate-900 p-8 shadow-xl">
        <p className="text-sm text-white/70">Meraki on Sepolia</p>
        <h1 className="mt-2 text-3xl font-semibold">Discover tokens and follow real market activity</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Open a live token page, inspect trade-derived data, connect a wallet, and use the qualified trading journey as each capability becomes available.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/discover" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900">
            Discover tokens
          </Link>
        </div>
        <div className="mt-3">
          <NextActionHint
            message={wallet.connected ? 'Wallet connected on the Meraki product journey.' : 'Connect a wallet when you are ready to trade on Sepolia.'}
            tone={wallet.connected ? 'success' : 'warn'}
          />
        </div>
      </section>

      <TestModeGate>
        <OnboardingBanner />
      </TestModeGate>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-white/60">Discovery</p>
          <h2 className="mt-2 text-xl font-semibold">Find a live token</h2>
          <p className="text-sm text-white/60">Browse canonical Sepolia tokens and open their exact market pages.</p>
          <Link href="/discover" className="mt-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm">
            Open discovery
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-white/60">Core journey</p>
          <p className="mt-2 text-lg font-semibold">Truth before action</p>
          <p className="text-sm text-white/60">Meraki identifies live, stale, and unavailable data explicitly before presenting a trading action.</p>
          <NextActionHint message="Only canonical product capabilities are shown in Version 1.0." tone="info" />
        </div>
      </section>
    </div>
  );
}
