'use client';

import { ReactNode } from 'react';
import AppWagmiProvider from '@/lib/providers/WagmiProvider';
import { WalletProvider } from '@/lib/providers/WalletProvider';
import { SoundProvider } from '@/lib/providers/SoundProvider';
import QueryProvider from '@/lib/providers/QueryProvider';
import { ToastProvider } from '@/components/common/ToastProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AppWagmiProvider>
        <WalletProvider>
          <SoundProvider>
            <ToastProvider>{children}</ToastProvider>
          </SoundProvider>
        </WalletProvider>
      </AppWagmiProvider>
    </QueryProvider>
  );
}
