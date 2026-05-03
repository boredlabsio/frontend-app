'use client';

import { ReactNode } from 'react';
import AppWagmiProvider from '@/lib/providers/WagmiProvider';
import { WalletProvider } from '@/lib/providers/WalletProvider';
import { SoundProvider } from '@/lib/providers/SoundProvider';
import QueryProvider from '@/lib/providers/QueryProvider';
import { ToastProvider } from '@/components/common/ToastProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppWagmiProvider>
      <WalletProvider>
        <SoundProvider>
          <QueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </SoundProvider>
      </WalletProvider>
    </AppWagmiProvider>
  );
}
