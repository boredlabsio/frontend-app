import ActivityList from '@/components/rewards/ActivityList';

export default function ActivityPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
        <button className="rounded-full bg-white/10 px-3 py-1 text-white">All</button>
        <button className="rounded-full bg-white/5 px-3 py-1">Buys</button>
        <button className="rounded-full bg-white/5 px-3 py-1">Swaps</button>
        <span className="ml-auto text-xs">Window: 7 days</span>
      </div>
      <ActivityList />
    </div>
  );
}
