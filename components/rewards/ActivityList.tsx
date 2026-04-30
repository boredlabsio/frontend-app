'use client';

import { useWallet } from '@/lib/providers/WalletProvider';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { EmptyState } from '../common/StateMessage';
import Skeleton from '../common/Skeleton';
import Link from 'next/link';

export default function ActivityList() {
  const wallet = useWallet();
  const { data, isLoading } = useActivityFeed(wallet.connected);

  if (!wallet.connected) {
    return <EmptyState title='No activity yet' description='Connect and make your first trade to earn points.' />;
  }

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} className='h-20' />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return <EmptyState title='No activity yet' description='Once you trade, your history will show up here.' />;
  }

  return (
    <div className='space-y-3'>
      {data.map((item) => (
        <div key={item.id} className='rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-semibold'>{item.description}</p>
              <p className='text-xs text-white/60'>{new Date(item.timestamp).toLocaleString()}</p>
            </div>
            <span className='rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide'>
              {item.type}
            </span>
          </div>
          <div className='mt-2 flex items-center justify-between text-sm text-white/70'>
            <span>{item.amount} ETH</span>
            <Link href={`https://sepolia.etherscan.io/tx/${item.txHash}`} className='text-indigo-300 hover:underline'>
              View tx
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
