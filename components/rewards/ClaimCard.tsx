'use client';

import { useWallet } from '@/lib/providers/WalletProvider';
import { useUserRewards } from '@/hooks/useUserRewards';
import Skeleton from '../common/Skeleton';
import { EmptyState } from '../common/StateMessage';
import { useToast } from '../common/ToastProvider';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export default function ClaimCard() {
  const wallet = useWallet();
  const { showToast } = useToast();
  const { data, isLoading } = useUserRewards(wallet.connected);
  const prefersReducedMotion = usePrefersReducedMotion();

  if (!wallet.connected) {
    return <EmptyState title="Connect to claim" description="Your claimable points will appear here." />;
  }

  if (isLoading || !data) {
    return <Skeleton className="h-32 w-full" />;
  }

  const isClaimable = data.claimable > 0;

  const cardClass = `rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/20 to-slate-900 p-6 text-white ${
    isClaimable && !prefersReducedMotion ? 'animate-pulse-slow' : ''
  }`;

  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-white/70">Claimable points</p>
          <p className="text-4xl font-semibold">{data.claimable}</p>
          <p className="text-sm text-white/60">Points convert to future drops & perks.</p>
        </div>
        <div className="flex flex-col gap-2 md:w-48">
          <button
            type="button"
            disabled={!isClaimable}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isClaimable ? 'bg-white text-slate-900 hover:bg-white/90' : 'bg-white/20 text-white/50'
            }`}
            onClick={() => showToast(isClaimable ? 'Mock claim succeeded' : 'Not enough points')}
          >
            {isClaimable ? 'Claim now' : 'Keep trading'}
          </button>
          {!isClaimable && (
            <p className="text-xs text-white/60">Earn at least 10 claimable points to unlock.</p>
          )}
        </div>
      </div>
    </div>
  );
}
