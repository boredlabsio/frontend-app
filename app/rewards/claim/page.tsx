'use client';

import { useWallet } from '@/lib/providers/WalletProvider';
import { useToast } from '@/components/common/ToastProvider';
import { useSound } from '@/lib/providers/SoundProvider';
import { EmptyState } from '@/components/common/StateMessage';

export default function ClaimPage() {
  const wallet = useWallet();
  const { showToast } = useToast();
  const sound = useSound();

  if (!wallet.connected) {
    return <EmptyState title='Connect to claim' description='Your claimable rewards will appear after you connect.' />;
  }

  return (
    <div className='space-y-6'>
      <div className='rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-white'>
        <p className='text-sm text-white/70'>Claimable points</p>
        <p className='text-4xl font-semibold'>18</p>
        <p className='text-sm text-white/60'>Claiming converts points into benefits (future drops, allowlists).</p>
        <button
          className='mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900'
          onClick={() => {
            showToast('Claiming is disabled in this mock');
            sound.play('ping');
          }}
        >
          Claim (mock)
        </button>
      </div>
      <div className='rounded-2xl border border-white/10 bg-slate-900/70 p-4'>
        <p className='text-sm font-semibold'>Eligibility checklist</p>
        <ul className='mt-2 space-y-1 text-sm text-white/70'>
          <li>✓ Wallet connected</li>
          <li>✓ ≥ 10 claimable points</li>
          <li>⏳ Weekly window opens in 3d</li>
        </ul>
      </div>
    </div>
  );
}
