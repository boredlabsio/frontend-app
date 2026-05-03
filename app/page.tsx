'use client';

import Link from 'next/link';
import RewardsStatsGrid from '@/components/rewards/RewardsStatsGrid';
import ClaimCard from '@/components/rewards/ClaimCard';
import ActivityList from '@/components/rewards/ActivityList';
import { leaderboardMock } from '@/lib/mockData';
import OnboardingBanner from '@/components/common/OnboardingBanner';
import NextActionHint from '@/components/common/NextActionHint';
import { useWallet } from '@/lib/providers/WalletProvider';
import TestModeGate, { useTestModeEnabled } from '@/components/common/TestModeGate';

export default function Home() {
  const featured = leaderboardMock[0];
  const wallet = useWallet();
  const testModeEnabled = useTestModeEnabled();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-slate-900 p-8 shadow-xl">
        <p className="text-sm text-white/70">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold">Trade the next launch & climb the rewards ladder</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Discover curated launches, trade directly from the dashboard, and earn points that convert into drops and
          badges every week.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/launch/sample-token" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900">
            View launches
          </Link>
          <Link href="/rewards/leaderboard" className="rounded-full border border-white/40 px-5 py-2 text-sm text-white">
            Open rewards hub
          </Link>
        </div>
        <div className="mt-3">
          <NextActionHint
            message={wallet.connected ? 'Browse launches below and place a Sepolia trade to increase your score.' : 'Connect a Sepolia wallet to unlock your onboarding checklist.'}
            tone={wallet.connected ? 'success' : 'warn'}
          />
        </div>
      </section>

      <TestModeGate>
        <OnboardingBanner />
      </TestModeGate>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-white/60">Featured launch</p>
          <h2 className="mt-2 text-xl font-semibold">LaunchToken</h2>
          <p className="text-sm text-white/60">Price: 0.017 ETH · +12% 24h</p>
          <Link href="/launch/sample-token" className="mt-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm">
            Trade now
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-white/60">Top wallet</p>
          <p className="mt-2 text-lg font-semibold">#{featured.rank}</p>
          <p className="text-sm text-white/60">{featured.address.slice(0, 6)}…{featured.address.slice(-4)}</p>
          <p className="text-sm text-white/60">{featured.points} pts · {featured.volumeEth} ETH volume</p>
          <NextActionHint message="Be the next top wallet by completing a live trade." tone="info" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-white/60">Leaderboard reset</p>
          <p className="mt-2 text-lg font-semibold">3d 12h</p>
          <p className="text-sm text-white/60">Share your referral link to climb faster.</p>
          <NextActionHint message="Refer friends before the reset to lock in the next badge." tone="info" />
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
