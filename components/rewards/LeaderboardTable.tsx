'use client';

import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useWallet } from '@/lib/providers/WalletProvider';
import { EmptyState } from '../common/StateMessage';
import Skeleton from '../common/Skeleton';
import Link from 'next/link';
import { useToast } from '../common/ToastProvider';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useSound } from '@/lib/providers/SoundProvider';

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardTable() {
  const wallet = useWallet();
  const { data, isLoading } = useLeaderboard(wallet.address);
  const { showToast } = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();
  const sound = useSound();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!wallet.connected) {
    return <EmptyState title="Connect your wallet" description="See where you stand once you start trading." />;
  }

  if (!data?.length) {
    return <EmptyState title="No leaderboard data yet" description="Start trading to appear here." />;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <div className="hidden text-xs uppercase tracking-wide text-white/50 md:grid md:grid-cols-6 md:pb-3">
        <span>Rank</span>
        <span>Address</span>
        <span>Points</span>
        <span>Volume</span>
        <span>Last active</span>
        <span className="text-right">Action</span>
      </div>
      <div className="space-y-3">
        {data.map((entry) => {
          const isTop = entry.rank <= 3;
          const display = `${entry.address.slice(0, 6)}…${entry.address.slice(-4)}`;
          return (
            <div
              key={entry.rank}
              className={`relative grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-white shadow-sm transition ${
                prefersReducedMotion ? '' : 'hover:-translate-y-0.5'
              } md:grid-cols-6 md:items-center ${entry.isSelf ? 'border-emerald-300/60 shadow-emerald-300/20' : ''}`}
            >
              {isTop && !prefersReducedMotion && (
                <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent animate-shimmer" />
              )}
              <div className="flex items-center gap-2 text-sm font-semibold">
                {isTop && <span>{medals[entry.rank - 1]}</span>}
                <span className="text-white/60">#{entry.rank}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>{display}</span>
                <button
                  type="button"
                  className="text-xs text-indigo-200 hover:underline"
                  onClick={() => {
                    navigator.clipboard.writeText(entry.address);
                    showToast('Address copied');
                    sound.play('ping');
                  }}
                >
                  Copy
                </button>
              </div>
              <span className="text-sm">{entry.points} pts</span>
              <span className="text-sm">{entry.volumeEth} ETH</span>
              <span className="text-sm text-white/60">{entry.lastActivity}</span>
              <div className="text-right">
                <Link href="/launch/sample-token" className="text-sm text-indigo-300 hover:underline">
                  View token
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
