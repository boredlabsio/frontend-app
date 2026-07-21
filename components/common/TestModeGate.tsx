'use client';

import { ReactNode, useSyncExternalStore } from 'react';
import { hostnameAllowsTestMode } from '@/lib/testMode';

const envFlag = String(process.env.NEXT_PUBLIC_TEST_MODE || '').toLowerCase() === 'true';

export function useTestModeEnabled() {
  const isLocalHost = useSyncExternalStore(
    () => () => undefined,
    () => hostnameAllowsTestMode(window.location.hostname),
    () => false
  );

  return envFlag || isLocalHost;
}

export default function TestModeGate({ children }: { children: ReactNode }) {
  const enabled = useTestModeEnabled();
  if (!enabled) return null;
  return <>{children}</>;
}
