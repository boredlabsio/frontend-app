'use client';

import { useEffect, useState } from 'react';
import { activityMock } from '@/lib/mockData';

function microtask(fn: () => void) {
  if (typeof queueMicrotask === 'function') queueMicrotask(fn);
  else setTimeout(fn, 0);
}

export function useActivityFeed(connected: boolean) {
  const [data, setData] = useState<typeof activityMock | null>(null);
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
      setData(activityMock);
      setLoading(false);
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [connected]);

  return { data, isLoading } as const;
}
