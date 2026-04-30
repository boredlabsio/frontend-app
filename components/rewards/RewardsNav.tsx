'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/rewards/leaderboard', label: 'Leaderboard' },
  { href: '/rewards/dashboard', label: 'Dashboard' },
  { href: '/rewards/activity', label: 'Activity' },
  { href: '/rewards/claim', label: 'Claim' }
];

export default function RewardsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-full border border-white/10 bg-slate-900/70 p-2">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-1 text-sm transition ${
              active ? 'bg-white text-slate-900' : 'text-white/70 hover:bg-white/10'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
