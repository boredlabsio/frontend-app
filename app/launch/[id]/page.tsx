import Link from 'next/link';

export default function LaunchDetail({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-white/60 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-3xl font-semibold">Launch: {params.id}</h1>
      <p className="text-white/70">
        Token details and trading UI will live here. For now this page acts as a placeholder so navigation works.
      </p>
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <p className="text-sm text-white/60">Price</p>
        <p className="text-2xl font-semibold">0.017 ETH</p>
      </div>
    </div>
  );
}
