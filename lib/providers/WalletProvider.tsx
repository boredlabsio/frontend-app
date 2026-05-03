'use client';

import { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { launchConfig } from '@/lib/launchConfig';

export type WalletContextValue = {
  address: `0x${string}` | null;
  connected: boolean;
  connecting: boolean;
  chainId?: number;
  wrongNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  ensureNetwork: () => Promise<void>;
  toggle: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const requiredChainId = launchConfig.chainId;
  const { address, chainId, status: accountStatus, isConnected } = useAccount();
  const { connectAsync, connectors, status: connectStatus } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync, status: switchStatus } = useSwitchChain();

  const wrongNetwork = Boolean(isConnected && chainId && chainId !== requiredChainId);
  const connected = Boolean(isConnected && !wrongNetwork);
  const connecting =
    accountStatus === 'connecting' || connectStatus === 'pending' || switchStatus === 'pending';

  const ensureNetwork = useCallback(async () => {
    if (!isConnected) return;
    if (!wrongNetwork) return;
    if (!switchChainAsync) throw new Error('Network switching not supported');
    await switchChainAsync({ chainId: requiredChainId });
  }, [isConnected, wrongNetwork, requiredChainId, switchChainAsync]);

  const connect = useCallback(async () => {
    if (isConnected) {
      await ensureNetwork();
      return;
    }
    const connector = connectors[0];
    if (!connector) throw new Error('No wallet connector available');
    const result = await connectAsync({ connector, chainId: requiredChainId });
    if (result.chainId !== requiredChainId && switchChainAsync) {
      await switchChainAsync({ chainId: requiredChainId });
    }
  }, [isConnected, ensureNetwork, connectors, connectAsync, requiredChainId, switchChainAsync]);

  const disconnect = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const toggle = useCallback(async () => {
    if (!isConnected) {
      await connect();
      return;
    }
    if (wrongNetwork) {
      await ensureNetwork();
      return;
    }
    await disconnect();
  }, [isConnected, wrongNetwork, connect, ensureNetwork, disconnect]);

  const value = useMemo<WalletContextValue>(
    () => ({
      address: address ?? null,
      connected,
      connecting,
      chainId,
      wrongNetwork,
      connect,
      disconnect,
      ensureNetwork,
      toggle
    }),
    [address, connected, connecting, chainId, wrongNetwork, connect, disconnect, ensureNetwork, toggle]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
