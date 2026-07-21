'use client';

import Link from 'next/link';
import RewardsStatsGrid from '@/components/rewards/RewardsStatsGrid';
import ClaimCard from '@/components/rewards/ClaimCard';
import ActivityList from '@/components/rewards/ActivityList';
import OnboardingBanner from '@/components/common/OnboardingBanner';
import NextActionHint from '@/components/common/NextActionHint';
import { useWallet } from '@/lib/providers/WalletProvider';
import TestModeGate, { useTestModeEnabled } from '@/components/common/TestModeGate';

export default function Home() {
  const wallet = useWallet();
  const testModeEnabled = useTestModeEnabled();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-slate-900 p-8 shadow-xl">
        <p className="text-sm text-white/70">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold">Explore the Sepolia launch index</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Inspect indexed launches and activity from the protected Preview. Financial execution and rewards remain disabled.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/discover" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900">
            View launches
          </Link>
          <Link href="/rewards/leaderboard" className="rounded-full border border-white/40 px-5 py-2 text-sm text-white">
            Open rewards hub
          </Link>
        </div>
        <div className="mt-3">
          <NextActionHint
            message={wallet.connected ? 'Wallet connected for read-only inspection. No signature or transaction is required.' : 'Wallet connection is optional for this read-only Preview.'}
            tone={wallet.connected ? 'success' : 'warn'}
          />
        </div>
      </section>

      <TestModeGate>
        <OnboardingBanner />
      </TestModeGate>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-white/60">Discovery</p>
          <h2 className="mt-2 text-xl font-semibold">Waiting for indexed tokens</h2>
          <p className="text-sm text-white/60">The live API is connected but currently reports zero Sepolia tokens.</p>
          <Link href="/discover" className="mt-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm">
            View live index
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-white/60">Rewards</p>
          <p className="mt-2 text-lg font-semibold">Backend unavailable</p>
          <p className="text-sm text-white/60">No authoritative leaderboard or user rewards endpoints are deployed.</p>
          <NextActionHint message="Sample balances and ranks are not shown in live mode." tone="warn" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-white/60">Financial actions</p>
          <p className="mt-2 text-lg font-semibold">Disabled</p>
          <p className="text-sm text-white/60">Create, buy, sell, rewards writes, and claims remain behind kill switches.</p>
          <NextActionHint message="Visual review requires no wallet signature or transaction." tone="info" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Rewards snapshot</h2>
          <Link href="/rewards/dashboard" className="text-sm text-indigo-300 hover:underline">
            View details
          </Link>
        </div>
        <RewardsStatsGrid />
        <ClaimCard />
        <TestModeGate>
          {!testModeEnabled && (
            <NextActionHint
              message="Test rewards preview only loads on localhost or when NEXT_PUBLIC_TEST_MODE=true."
              tone="warn"
            />
          )}
        </TestModeGate>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent activity</h2>
          <Link href="/rewards/activity" className="text-sm text-indigo-300 hover:underline">
            Open activity
          </Link>
        </div>
        <ActivityList limit={3} />
      </section>
    </div>
  );
}
