'use client';

import Link from 'next/link';
import NextActionHint from './NextActionHint';

export default function OnboardingBanner() {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-sky-500/20 via-indigo-500/15 to-slate-900 p-6 text-white shadow-lg">
      <h3 className="text-2xl font-semibold">Start earning rewards → Make your first trade</h3>
      <p className="mt-2 text-white/70">
        Connect a Sepolia wallet, buy any launch token, and your leaderboard row plus claim progress will unlock here.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/launch/sample-token" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
          Make first trade
        </Link>
        <Link href="/rewards/leaderboard" className="rounded-full border border-white/30 px-4 py-2 text-sm text-white">
          View leaderboard
        </Link>
      </div>
      <div className="mt-3">
        <NextActionHint message="Need Sepolia ETH? Use the faucet linked in docs before trading." tone="info" />
      </div>
    </section>
  );
}
