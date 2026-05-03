'use client';

export type NextActionTone = 'info' | 'warn' | 'success' | 'error';

const toneClasses: Record<NextActionTone, string> = {
  info: 'text-indigo-200',
  warn: 'text-amber-200',
  success: 'text-emerald-200',
  error: 'text-rose-200'
};

export default function NextActionHint({ message, tone = 'info' }: { message?: string | null; tone?: NextActionTone }) {
  if (!message) return null;
  return <p className={`text-sm ${toneClasses[tone]}`}>{message}</p>;
}
