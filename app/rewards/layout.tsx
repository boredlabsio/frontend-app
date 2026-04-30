import RewardsNav from '@/components/rewards/RewardsNav';
import { ReactNode } from 'react';

export default function RewardsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <RewardsNav />
      {children}
    </div>
  );
}
