'use client';

import SelfRankCard from '@/components/rewards/SelfRankCard';
import LeaderboardTable from '@/components/rewards/LeaderboardTable';
import ReferralBlock from '@/components/rewards/ReferralBlock';
import NextActionHint from '@/components/common/NextActionHint';
import { useWallet } from '@/lib/providers/WalletProvider';
import ConfusionFAQ from '@/components/rewards/ConfusionFAQ';

export default function LeaderboardPage() {
  const wallet = useWallet();

  return (
    <div className="space-y-6">
      <SelfRankCard />
      <NextActionHint
        message={wallet.connected ? 'The authoritative leaderboard API is not deployed; no sample rank is shown.' : 'Wallet connection is optional while leaderboard data is unavailable.'}
        tone="warn"
      />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <LeaderboardTable />
        </div>
        <div className="lg:w-80 space-y-6">
          <ReferralBlock />
          <ConfusionFAQ />
        </div>
      </div>
    </div>
  );
}
