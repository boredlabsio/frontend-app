'use client';

import { useEffect } from 'react';
import { useWallet } from '@/lib/providers/WalletProvider';
import { useUserRewards } from '@/hooks/useUserRewards';
import Skeleton from '../common/Skeleton';
import { EmptyState } from '../common/StateMessage';
import { useToast } from '../common/ToastProvider';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useClaimable, type ClaimHookData, ClaimWindowStatus } from '@/hooks/useClaimable';
import ApiBanner from '../common/ApiBanner';
import { concatHex, formatEther, keccak256, encodePacked, type Hex } from 'viem';
import {
  useAccount,
  useChainId,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract
} from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { REWARDS_DISTRIBUTOR_ADDRESS, REWARDS_DISTRIBUTOR_CHAIN_ID, rewardsDistributorAbi } from '@/lib/contracts/rewardsDistributor';
import Link from 'next/link';

const explorerBase = sepolia.blockExplorers?.default?.url ?? 'https://sepolia.etherscan.io';

export default function ClaimCard() {
  const wallet = useWallet();
  const { showToast } = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();
  const {
    data: rewardsData,
    isLoading: rewardsLoading,
    error: rewardsError,
    refetch: refetchRewards,
    isMock: rewardsMock
  } = useUserRewards(wallet.address);
  const {
    data: claimState,
    isLoading: claimLoading,
    error: claimError,
    refetch: refetchClaim,
    isMock: claimMock
  } = useClaimable(wallet.address);

  const { address: wagmiAddress } = useAccount();
  const chainId = useChainId();
  const expectedChainId = REWARDS_DISTRIBUTOR_CHAIN_ID;

  const activeAddress = wagmiAddress ?? wallet.address ?? null;
  const isConnected = Boolean(activeAddress);

  const claimableTokens = claimState?.claimableAmountWei ?? BigInt(0);
  const formattedClaimable = formatEther(claimableTokens);

  const proofValid = (() => {
    if (!claimState?.epoch || !claimState?.claim || !wagmiAddress) return false;
    if (!claimState.claim.proof?.length) return false;
    try {
      const leaf = keccak256(
        encodePacked(
          ['uint256', 'address', 'uint256'],
          [BigInt(claimState.epoch.id), wagmiAddress, claimState.claimableAmountWei]
        )
      );
      return verifyProof({
        leaf,
        root: claimState.epoch.root,
        proof: claimState.claim.proof as Hex[]
      });
    } catch (err) {
      console.warn('proof verification failed', err);
      return false;
    }
  })();

  const canSubmitBase =
    Boolean(claimState?.epoch) &&
    claimState?.status === 'open' &&
    Boolean(claimState?.claim) &&
    claimableTokens > BigInt(0) &&
    !claimState?.claim?.claimed &&
    !claimState?.claim?.excluded &&
    proofValid &&
    Boolean(REWARDS_DISTRIBUTOR_ADDRESS);

  const { data: simulation, error: simulateError, isFetching: simLoading } = useSimulateContract({
    address: REWARDS_DISTRIBUTOR_ADDRESS,
    abi: rewardsDistributorAbi,
    functionName: 'claim',
    args:
      canSubmitBase && wagmiAddress && claimState?.claim
        ? [
            BigInt(claimState.epoch!.id),
            wagmiAddress,
            claimableTokens,
            claimState.claim.proof as Hex[]
          ]
        : undefined,
    account: wagmiAddress,
    chainId: expectedChainId,
    query: {
      enabled: canSubmitBase && Boolean(wagmiAddress)
    }
  });

  const {
    writeContract,
    error: writeError,
    data: txHash,
    isPending: isWriting,
    reset: resetWrite
  } = useWriteContract();

  const { isLoading: isWaitingReceipt, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash)
    }
  });

  useEffect(() => {
    if (txSuccess) {
      showToast('Claim completed');
      refetchClaim();
      refetchRewards();
      resetWrite();
    }
  }, [txSuccess, refetchClaim, refetchRewards, resetWrite, showToast]);

  if (!isConnected) {
    return <EmptyState title="Claims unavailable" description="No authoritative epoch or proof API is deployed. Wallet connection is not required." />;
  }

  if ((rewardsLoading || claimLoading) && wallet.connected) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (rewardsError && !rewardsMock) {
    return (
      <ApiBanner
        message="Rewards unavailable — the live rewards API is not implemented. Claims remain disabled."
        action={<button onClick={() => refetchRewards()} className="rounded-full bg-white/10 px-3 py-1 text-xs">Retry</button>}
      />
    );
  }

  if (claimError && !claimMock) {
    return (
      <ApiBanner
        message="Claims unavailable — no authoritative epoch or proof API is deployed."
        action={<button onClick={() => refetchClaim()} className="rounded-full bg-white/10 px-3 py-1 text-xs">Retry</button>}
      />
    );
  }

  if (!rewardsData) {
    return <Skeleton className="h-32 w-full" />;
  }

  const buttonDisabledReason = getDisabledReason({
    wagmiAddress,
    chainId,
    expectedChainId,
    proofValid,
    canSubmitBase,
    claimState,
    simulationReady: Boolean(simulation?.request) && !simLoading,
    isTxInFlight: isWriting || isWaitingReceipt,
    distributorConfigured: Boolean(REWARDS_DISTRIBUTOR_ADDRESS)
  });

  const canSubmit = !buttonDisabledReason;

  const handleClaim = () => {
    if (!canSubmit || !simulation?.request) return;
    writeContract(simulation.request);
  };

  const cardClass = `rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/20 to-slate-900 p-6 text-white ${
    claimableTokens > BigInt(0) && claimState?.status === 'open' && !prefersReducedMotion ? 'animate-pulse-slow' : ''
  }`;

  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-white/70">Claimable amount</p>
          <p className="text-4xl font-semibold">{formattedClaimable} TOKEN</p>
          <p className="text-sm text-white/60">Claims settle on {sepolia.name}. Proofs verified via Merkle root.</p>
        </div>
        <div className="flex flex-col gap-2 md:w-64">
          <button
            type="button"
            disabled={!canSubmit}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              canSubmit ? 'bg-white text-slate-900 hover:bg-white/90' : 'bg-white/20 text-white/50'
            }`}
            onClick={handleClaim}
          >
            {isWriting || isWaitingReceipt ? 'Claiming…' : 'Claim to treasury'}
          </button>
          {buttonDisabledReason && <p className="text-xs text-white/60">{buttonDisabledReason}</p>}
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm text-white/70">
        {renderStatusSummary(claimState?.status, claimState ?? null)}
        {claimState?.epoch && (
          <MetadataList
            epochId={claimState.epoch.id}
            root={claimState.epoch.root}
            metadataHash={claimState.epoch.metadataHash}
            snapshotHash={claimState.epoch.snapshotHash}
          />
        )}
        {claimState?.claim?.claimed && claimState.claim.claimTxHash && (
          <p className="text-xs text-emerald-300">
            Claimed on {new Date(claimState.claim.claimedAt ?? '').toLocaleString()} —{' '}
            <Link href={`${explorerBase}/tx/${claimState.claim.claimTxHash}`} className="underline" target="_blank">
              View transaction
            </Link>
          </p>
        )}
        {claimState?.claim?.excluded && (
          <p className="text-xs text-amber-300">
            This address is currently excluded due to anti-sybil rules. Contact support if you believe this is an error.
          </p>
        )}
        {!proofValid && claimState?.claim && claimState.status === 'open' && (
          <p className="text-xs text-amber-200">Local proof verification failed. Please refresh once the latest snapshot downloads.</p>
        )}
        {simulateError && (
          <p className="text-xs text-amber-200">Simulation failed: {truncateText(simulateError.message)}</p>
        )}
        {writeError && (
          <p className="text-xs text-rose-200">Transaction error: {truncateText(writeError.message)}</p>
        )}
        {simulation?.request?.gas && (
          <p className="text-xs text-white/60">
            Estimated gas: {simulation.request.gas.toString()} units on {sepolia.name}.
          </p>
        )}
        {claimMock && <p className="text-xs text-white/50">Showing cached claim data until the API responds.</p>}
      </div>
    </div>
  );
}

type DisabledReasonInput = {
  wagmiAddress?: string;
  chainId?: number;
  expectedChainId: number;
  proofValid: boolean;
  canSubmitBase: boolean;
  claimState: ClaimHookData | null;
  simulationReady: boolean;
  isTxInFlight: boolean;
  distributorConfigured: boolean;
};

function getDisabledReason(input: DisabledReasonInput) {
  if (!input.distributorConfigured) return 'Rewards contract address is not configured.';
  if (input.isTxInFlight) return 'Transaction pending…';
  if (!input.canSubmitBase) return 'Claim window is not open or proof missing.';
  if (!input.wagmiAddress) return 'Connect a wallet via the header to submit on-chain.';
  if (input.chainId !== undefined && input.chainId !== input.expectedChainId) return `Switch to ${sepolia.name}.`;
  if (!input.proofValid) return 'Waiting for valid proof. Please refresh shortly.';
  if (!input.simulationReady) return 'Estimating gas…';
  if (input.claimState?.claim?.excluded) return 'Address is excluded for this epoch.';
  if (input.claimState?.claim?.claimed) return 'Already claimed for this epoch.';
  if (input.claimState?.status && input.claimState.status !== 'open') return describeStatus(input.claimState.status);
  return null;
}

function describeStatus(status: ClaimWindowStatus) {
  switch (status) {
    case 'pending':
      return 'Claims not open yet.';
    case 'expired':
      return 'Claim window closed.';
    case 'no-epoch':
      return 'No reward epoch is active.';
    default:
      return null;
  }
}

function renderStatusSummary(status: ClaimWindowStatus | undefined, claimState: ClaimHookData | null) {
  if (!status || !claimState) return null;
  const opensAt = claimState.opensAt ? claimState.opensAt.getTime() - claimState.now.getTime() : 0;
  const deadline = claimState.deadline ? claimState.deadline.getTime() - claimState.now.getTime() : 0;

  switch (status) {
    case 'no-epoch':
      return <p className="text-xs">Reward window is offline. New snapshots will appear once governance schedules the next drop.</p>;
    case 'pending':
      return (
        <p className="text-xs text-amber-200">
          Snapshot published — claims open in {formatDelta(opensAt)} ({claimState.opensAt?.toLocaleString()}).
        </p>
      );
    case 'expired':
      return (
        <p className="text-xs text-rose-200">
          Claim window closed {formatDelta(-deadline)} ago. Waiting for the next epoch.
        </p>
      );
    case 'open':
    default:
      return (
        <p className="text-xs text-emerald-200">
          Claim window live — closes in {formatDelta(deadline)} ({claimState.deadline?.toLocaleString()}).
        </p>
      );
  }
}

function MetadataList({
  epochId,
  root,
  metadataHash,
  snapshotHash
}: {
  epochId: number;
  root: Hex;
  metadataHash: Hex | null;
  snapshotHash: Hex | null;
}) {
  const items = [
    { label: 'Epoch', value: `#${epochId}` },
    { label: 'Root', value: truncateHex(root) },
    metadataHash ? { label: 'Metadata hash', value: truncateHex(metadataHash) } : null,
    snapshotHash ? { label: 'Snapshot hash', value: truncateHex(snapshotHash) } : null
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="grid gap-2 text-xs text-white/60 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-white/40">{item.label}:</span>
          <code className="truncate text-white/80">{item.value}</code>
        </div>
      ))}
    </div>
  );
}

function truncateHex(value: string, chars = 6) {
  if (!value) return '—';
  if (value.length <= chars * 2 + 2) return value;
  return `${value.slice(0, chars + 2)}…${value.slice(-chars)}`;
}

function truncateText(value: string, max = 120) {
  if (!value) return 'Unknown error';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function formatDelta(ms: number) {
  if (!Number.isFinite(ms)) return 'soon';
  const direction = ms >= 0 ? 1 : -1;
  const duration = Math.abs(ms);
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours % 24) parts.push(`${hours % 24}h`);
  if (!days && minutes % 60) parts.push(`${minutes % 60}m`);
  if (!days && !hours && seconds % 60) parts.push(`${seconds % 60}s`);

  const phrase = parts.length ? parts.slice(0, 2).join(' ') : 'moments';
  return direction >= 0 ? `≈ ${phrase}` : `${phrase}`;
}

function verifyProof({ leaf, proof, root }: { leaf: Hex; proof: Hex[]; root: Hex }) {
  const final = proof.reduce((hash, sibling) => {
    const [left, right] = hash.toLowerCase() < sibling.toLowerCase() ? [hash, sibling] : [sibling, hash];
    return keccak256(concatHex([left, right]));
  }, leaf);

  return final.toLowerCase() === root.toLowerCase();
}
