'use client';

import Skeleton from '../common/Skeleton';
import { useWallet } from '@/lib/providers/WalletProvider';
import { useUserRewards } from '@/hooks/useUserRewards';
import ApiBanner from '../common/ApiBanner';

export default function RewardsStatsGrid() {
  const wallet = useWallet();
  const { data, isLoading, error, refetch, isMock } = useUserRewards(wallet.address);

  if (!wallet.connected) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-6 text-white">
        <p className="text-sm text-white/60">Authoritative rewards API unavailable</p>
        <p className="text-2xl font-semibold">Rewards unavailable</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-28" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ApiBanner
        message="Rewards unavailable — the live rewards API is not implemented. No cached balances are being shown."
        action={<button onClick={() => refetch()} className="rounded-full bg-white/10 px-3 py-1 text-xs">Retry</button>}
      />
    );
  }

  const stats = [
    { label: 'Total points', value: data.points, suffix: 'pts' },
    { label: 'Rank', value: `#${data.rank}` },
    { label: 'Normalized volume', value: data.volumeEth, suffix: 'ETH' },
    { label: 'Claimable now', value: data.claimable, suffix: 'pts' }
  ];

  const streakDays = 3;

  return (
    <div className="space-y-3">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-sm text-white/60">{stat.label}</p>
            <p className="text-2xl font-semibold text-white">
              {stat.value}
              {stat.suffix && <span className="ml-1 text-base text-white/60">{stat.suffix}</span>}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>Progress to next badge</span>
          <span>Weekly streak: {streakDays}/7 days</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, data.progressToNextBadge * 100)}%` }} />
        </div>
      </div>
      {isMock && !error && <p className="text-xs text-white/50">Displaying cached rewards until the API responds.</p>}
    </div>
  );
}
