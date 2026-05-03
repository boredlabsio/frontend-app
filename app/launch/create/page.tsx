import LaunchForm from '@/components/launch/LaunchForm';
import Link from 'next/link';
import TestModeGate from '@/components/common/TestModeGate';
import NextActionHint from '@/components/common/NextActionHint';

export default function LaunchCreatePage() {
  return (
    <div className='space-y-6'>
      <Link href='/' className='text-sm text-white/60 hover:underline'>← Back to dashboard</Link>
      <h1 className='text-3xl font-semibold'>Launch a token</h1>
      <p className='text-white/70'>Provide branding metadata and confirm the Sepolia launch transaction. Contracts mint through LaunchRegistry + LaunchFactory.</p>
      <TestModeGate>
        <NextActionHint message='This flow operates on Sepolia. Ensure you have ≥0.02 ETH for launch fee + gas.' />
      </TestModeGate>
      <LaunchForm />
    </div>
  );
}
