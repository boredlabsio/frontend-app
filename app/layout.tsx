import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/common/ToastProvider';
import AppHeader from '@/components/layout/AppHeader';
import { SoundProvider } from '@/lib/providers/SoundProvider';
import AppWagmiProvider from '@/lib/providers/WagmiProvider';
import { WalletProvider } from '@/lib/providers/WalletProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Pump Launchpad',
  description: 'Trade launches and climb the rewards leaderboard.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-white">
        <AppWagmiProvider>
          <WalletProvider>
            <SoundProvider>
              <ToastProvider>
                <AppHeader />
                <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 py-8">{children}</main>
              </ToastProvider>
            </SoundProvider>
          </WalletProvider>
        </AppWagmiProvider>
      </body>
    </html>
  );
}
