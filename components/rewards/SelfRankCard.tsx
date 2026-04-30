'use client';

import Link from 'next/link';
import Skeleton from '../common/Skeleton';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useWallet } from '@/lib/providers/WalletProvider';
import { useToast } from '../common/ToastProvider';
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import ConfettiBurst from '../common/confetti';
import { useSound } from '@/lib/providers/SoundProvider';

export default function SelfRankCard() {
  const wallet = useWallet();
  const { data, isLoading } = useLeaderboard(wallet.address);
  const { showToast } = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();
  const sound = useSound();
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!wallet.connected || prefersReducedMotion) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      setBurst(true);
      sound.play('badge');
    });
    const timeout = setTimeout(() => {
      if (!cancelled) setBurst(false);
    }, 1500);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [wallet.connected, prefersReducedMotion, sound]);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!wallet.connected) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-6 text-white">
        <p className="text-sm text-white/60">Connect to start climbing</p>
        <p className="text-2xl font-semibold">No rank yet</p>
        <p className="text-sm text-white/50">Connect your wallet and make your first trade to earn points.</p>
      </div>
    );
  }

  const self = data?.find((entry) => entry.isSelf) ?? data?.[0];
  if (!self) return null;

  const shareMessage = `I'm rank #${self.rank} with ${self.points} pts on Pump Rewards!`;

  return (
    <div className="relative">
      {burst && !prefersReducedMotion && <ConfettiBurst />}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/40 via-purple-600/30 to-slate-900 p-6 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] transition hover:-translate-y-0.5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-white/70">Your current rank</p>
            <p className="text-3xl font-semibold">#{self.rank}</p>
            <p className="text-sm text-white/60">{self.points} pts · {self.volumeEth} ETH volume</p>
          </div>
          <div className="flex gap-3">
            <Link href="/rewards/claim" className="rounded-full border border-white/40 px-4 py-2 text-sm hover:bg-white/10">
              Claim points
            </Link>
            <button
              type="button"
              className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              onClick={() => {
                navigator.clipboard.writeText(shareMessage);
                showToast('Copied share message');
                sound.play('ping');
              }}
            >
              Share rank
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
