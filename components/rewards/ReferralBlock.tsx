'use client';

import { badgesMock } from '@/lib/mockData';
import { useWallet } from '@/lib/providers/WalletProvider';
import { useToast } from '../common/ToastProvider';
import { useSound } from '@/lib/providers/SoundProvider';

export default function ReferralBlock() {
  const wallet = useWallet();
  const { showToast } = useToast();
  const sound = useSound();
  const referralLink = wallet.address ? `https://pump.example/refer/${wallet.address}` : 'Connect wallet to get your link';

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-white/70">Invite friends</p>
          <p className="text-lg font-semibold">Share your referral link</p>
          <p className="text-sm text-white/60">Top inviters earn bonus badges every week.</p>
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            value={referralLink}
            className="w-56 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs"
          />
          <button
            type="button"
            onClick={() => {
              if (!wallet.address) return;
              navigator.clipboard.writeText(referralLink);
              showToast('Referral link copied');
              sound.play('ping');
            }}
            className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
          >
            Copy
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {badgesMock.map((badge) => (
          <span
            key={badge.label}
            className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
              badge.achieved ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/5 text-white/40'
            }`}
          >
            {badge.label}
          </span>
        ))}
      </div>
    </div>
  );
}
