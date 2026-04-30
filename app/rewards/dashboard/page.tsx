'use client';

import RewardsStatsGrid from '@/components/rewards/RewardsStatsGrid';
import ClaimCard from '@/components/rewards/ClaimCard';
import ActivityList from '@/components/rewards/ActivityList';
import ReferralBlock from '@/components/rewards/ReferralBlock';
import { useWallet } from '@/lib/providers/WalletProvider';
import { EmptyState } from '@/components/common/StateMessage';

export default function RewardsDashboardPage() {
  const wallet = useWallet();

  if (!wallet.connected) {
    return <EmptyState title='Connect your wallet' description='Track rewards after linking your wallet.' />;
  }

  return (
    <div className='space-y-6'>
      <RewardsStatsGrid />
      <ClaimCard />
      <ReferralBlock />
      <div className='space-y-3'>
        <h3 className='text-lg font-semibold'>Recent rewards</h3>
        <ActivityList />
      </div>
    </div>
  );
}
