'use client';

import { useWallet } from '@/lib/providers/WalletProvider';
import { EmptyState } from '@/components/common/StateMessage';
import NextActionHint from '@/components/common/NextActionHint';
import ConfusionFAQ from '@/components/rewards/ConfusionFAQ';

export default function ClaimPage() {
  const wallet = useWallet();

  if (!wallet.connected) {
    return <EmptyState title='Claims unavailable' description='No authoritative epoch or proof API is deployed. Wallet connection is not required.' />;
  }

  return (
    <div className='space-y-6'>
      <NextActionHint message='Claims are unavailable. No authoritative epoch, proof API, or enabled rewards distributor is deployed.' tone='warn' />
      <div className='rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-white'>
        <p className='text-sm text-white/70'>Claim status</p>
        <p className='text-2xl font-semibold'>Unavailable</p>
        <p className='text-sm text-white/60'>No cached balance is displayed in live mode. Claim execution is disabled.</p>
        <button type='button' disabled className='mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/60'>
          Claim disabled
        </button>
      </div>
      <div className='rounded-2xl border border-white/10 bg-slate-900/70 p-4'>
        <p className='text-sm font-semibold'>Eligibility checklist</p>
        <ul className='mt-2 space-y-1 text-sm text-white/70'>
          <li>✓ Wallet connected</li>
          <li>— Authoritative reward balance unavailable</li>
          <li>— Claim epoch and proof unavailable</li>
        </ul>
      </div>
      <ConfusionFAQ />
    </div>
  );
}
