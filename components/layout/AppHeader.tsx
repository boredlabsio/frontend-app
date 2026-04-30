'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletPlaceholder from '../wallet/WalletPlaceholder';
import SoundToggle from '../wallet/SoundToggle';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/launch/sample-token', label: 'Launch' },
  { href: '/rewards/leaderboard', label: 'Leaderboard' },
  { href: '/rewards/dashboard', label: 'Rewards' },
  { href: '/rewards/activity', label: 'Activity' },
  { href: '/rewards/claim', label: 'Claim' }
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-sm transition hover:bg-white/10 ${
        isActive ? 'bg-white/10 text-white' : 'text-white/60'
      }`}
    >
      {label}
    </Link>
  );
}

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-white">
          Pump Launchpad
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <SoundToggle />
          <WalletPlaceholder />
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:hidden">
        {navLinks.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}
      </nav>
    </header>
  );
}
