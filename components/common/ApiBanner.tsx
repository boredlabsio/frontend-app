'use client';

import { ReactNode } from 'react';

export default function ApiBanner({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div role="alert" className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-100">
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        {action}
      </div>
    </div>
  );
}
