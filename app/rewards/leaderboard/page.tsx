import SelfRankCard from '@/components/rewards/SelfRankCard';
import LeaderboardTable from '@/components/rewards/LeaderboardTable';
import ReferralBlock from '@/components/rewards/ReferralBlock';

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <SelfRankCard />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <LeaderboardTable />
        </div>
        <div className="lg:w-80">
          <ReferralBlock />
        </div>
      </div>
    </div>
  );
}
