'use client';

import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type WalletContextValue = {
  address: string | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  toggle: () => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const mockAddress = '0x1E887DB513Be6a0F793a0C55613d52e85bAC1727';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      connected: Boolean(address),
      connect: () => setAddress(mockAddress),
      disconnect: () => setAddress(null),
      toggle: () => setAddress((prev) => (prev ? null : mockAddress))
    }),
    [address]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
