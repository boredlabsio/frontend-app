'use client';

import Skeleton from '../common/Skeleton';
import { useWallet } from '@/lib/providers/WalletProvider';
import { useUserRewards } from '@/hooks/useUserRewards';

export default function RewardsStatsGrid() {
  const wallet = useWallet();
  const { data, isLoading } = useUserRewards(wallet.connected);

  if (!wallet.connected) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-6 text-white">
        <p className="text-sm text-white/60">Connect to view stats</p>
        <p className="text-2xl font-semibold">No activity yet</p>
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

  const stats = [
    { label: 'Total points', value: data.points, suffix: 'pts' },
    { label: 'Rank', value: `#${data.rank}` },
    { label: 'Normalized volume', value: data.volumeEth, suffix: 'ETH' },
    { label: 'Claimable now', value: data.claimable, suffix: 'pts' }
  ];

  return (
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
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:col-span-4">
        <p className="text-sm text-white/60">Progress to next badge</p>
        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, data.progressToNextBadge * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
