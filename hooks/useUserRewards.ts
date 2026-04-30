'use client';

import { useEffect, useState } from 'react';
import { userSummaryMock } from '@/lib/mockData';

function microtask(fn: () => void) {
  if (typeof queueMicrotask === 'function') queueMicrotask(fn);
  else setTimeout(fn, 0);
}

export function useUserRewards(connected: boolean) {
  const [data, setData] = useState<typeof userSummaryMock | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!connected) {
      microtask(() => {
        if (!cancelled) {
          setData(null);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    microtask(() => {
      if (!cancelled) setLoading(true);
    });

    const timeout = setTimeout(() => {
      if (cancelled) return;
      setData(userSummaryMock);
      setLoading(false);
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [connected]);

  return { data, isLoading } as const;
}
