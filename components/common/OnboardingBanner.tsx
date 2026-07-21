'use client';

import Link from 'next/link';
import NextActionHint from './NextActionHint';

export default function OnboardingBanner() {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-sky-500/20 via-indigo-500/15 to-slate-900 p-6 text-white shadow-lg">
      <h3 className="text-2xl font-semibold">Controlled visual review</h3>
      <p className="mt-2 text-white/70">
        Inspect navigation, discovery, activity, and unavailable-feature states. No wallet signature or transaction is required.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/discover" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
          Inspect discovery
        </Link>
        <Link href="/rewards/leaderboard" className="rounded-full border border-white/30 px-4 py-2 text-sm text-white">
          Inspect rewards state
        </Link>
      </div>
      <div className="mt-3">
        <NextActionHint message="Create, buy, sell, rewards writes, and claims remain disabled." tone="warn" />
      </div>
    </section>
  );
}
