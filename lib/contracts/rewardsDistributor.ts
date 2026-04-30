import type { Address } from 'viem';
import { sepolia } from 'wagmi/chains';

export const REWARDS_DISTRIBUTOR_ADDRESS = process.env.NEXT_PUBLIC_REWARDS_DISTRIBUTOR as Address | undefined;
export const REWARDS_DISTRIBUTOR_CHAIN_ID = Number(process.env.NEXT_PUBLIC_REWARDS_CHAIN_ID ?? sepolia.id);

export const rewardsDistributorAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'epochId',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'bytes32[]',
        name: 'merkleProof',
        type: 'bytes32[]'
      }
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;
