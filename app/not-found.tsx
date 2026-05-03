'use client';

import Link from 'next/link';
import NextActionHint from '@/components/common/NextActionHint';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center">
      <p className="text-sm text-white/60">404 — Not Found</p>
      <h1 className="text-3xl font-semibold text-white">This page drifted off chain.</h1>
      <p className="text-white/70">Double-check the URL or head back to the dashboard to keep trading.</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
          Return home
        </Link>
        <Link href="/discover" className="rounded-full border border-white/40 px-4 py-2 text-sm text-white">
          Browse launches
        </Link>
      </div>
      <NextActionHint message="If you think this is a bug, ping us and we will investigate." tone="warn" />
    </section>
  );
}
