import { ReactNode } from 'react';

export type StateMessageProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState(props: StateMessageProps) {
  return (
    <StateShell>
      <strong className="text-white">{props.title}</strong>
      {props.description && <p className="text-sm text-white/60">{props.description}</p>}
      {props.action}
    </StateShell>
  );
}

export function ErrorState(props: StateMessageProps) {
  return (
    <StateShell>
      <strong className="text-red-200">{props.title}</strong>
      {props.description && <p className="text-sm text-red-200/70">{props.description}</p>}
      {props.action}
    </StateShell>
  );
}

function StateShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-6 text-center">
      <div className="flex flex-col items-center gap-2">{children}</div>
    </div>
  );
}
