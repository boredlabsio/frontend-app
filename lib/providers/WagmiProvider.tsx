'use client';

import { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { sepolia } from 'wagmi/chains';

const config = createConfig({
  chains: [sepolia],
  ssr: true,
  connectors: [injected({ target: 'metaMask' }), injected()],
  transports: {
    [sepolia.id]: http()
  }
});

export default function AppWagmiProvider({ children }: { children: ReactNode }) {
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}
