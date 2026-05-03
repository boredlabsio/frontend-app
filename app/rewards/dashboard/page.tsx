'use client';

import RewardsStatsGrid from '@/components/rewards/RewardsStatsGrid';
import ClaimCard from '@/components/rewards/ClaimCard';
import ActivityList from '@/components/rewards/ActivityList';
import ReferralBlock from '@/components/rewards/ReferralBlock';
import { useWallet } from '@/lib/providers/WalletProvider';
import { EmptyState } from '@/components/common/StateMessage';
import NextActionHint from '@/components/common/NextActionHint';
import ConfusionFAQ from '@/components/rewards/ConfusionFAQ';

export default function RewardsDashboardPage() {
  const wallet = useWallet();

  if (!wallet.connected) {
    return <EmptyState title='Connect your wallet' description='Track rewards after linking your wallet.' />;
  }

  return (
    <div className='space-y-6'>
      <NextActionHint message='Keep trading or referring wallets before the epoch closes to boost your rewards.' tone='info' />
      <RewardsStatsGrid />
      <ClaimCard />
      <ReferralBlock />
      <div className='space-y-3'>
        <h3 className='text-lg font-semibold'>Recent rewards</h3>
        <ActivityList limit={3} />
      </div>
      <ConfusionFAQ />
    </div>
  );
}
