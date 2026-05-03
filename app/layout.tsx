import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppHeader from '@/components/layout/AppHeader';
import TestModeGate from '@/components/common/TestModeGate';
import { Providers } from './providers';

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
        <Providers>
          <TestModeGate>
            <div className="w-full border-b border-amber-400/30 bg-amber-500/10 text-center text-xs text-amber-100">
              Sepolia Test Mode · Test rewards only · Transactions do not hold mainnet value
            </div>
          </TestModeGate>
          <AppHeader />
          <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
