import LaunchForm from '@/components/launch/LaunchForm';
import Link from 'next/link';
import TestModeGate from '@/components/common/TestModeGate';
import NextActionHint from '@/components/common/NextActionHint';

export default function LaunchCreatePage() {
  return (
    <div className='space-y-6'>
      <Link href='/' className='text-sm text-white/60 hover:underline'>← Back to dashboard</Link>
      <h1 className='text-3xl font-semibold'>Launch a token</h1>
      <p className='text-white/70'>Create the single approved, clearly labeled Slice 3 Sepolia test asset through the verified registry and factory.</p>
      <TestModeGate>
        <NextActionHint message='This flow operates on Sepolia and requires two explicit wallet signatures. Every write is simulated first.' />
      </TestModeGate>
      <LaunchForm />
    </div>
  );
}
