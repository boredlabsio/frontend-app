'use client';

import { useEffect, useState } from 'react';
import { LeaderboardEntry, leaderboardMock } from '@/lib/mockData';

function microtask(fn: () => void) {
  if (typeof queueMicrotask === 'function') queueMicrotask(fn);
  else setTimeout(fn, 0);
}

export function useLeaderboard(selfAddress?: string | null) {
  const [data, setData] = useState<LeaderboardEntry[] | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    microtask(() => {
      if (!cancelled) setLoading(true);
    });

    const timeout = setTimeout(() => {
      if (cancelled) return;
      const mapped = leaderboardMock.map((entry) => ({
        ...entry,
        isSelf: selfAddress ? entry.address.toLowerCase() === selfAddress.toLowerCase() : entry.isSelf
      }));
      setData(mapped);
      setLoading(false);
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [selfAddress]);

  return { data, isLoading } as const;
}
