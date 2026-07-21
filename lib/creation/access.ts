import { env } from '@/lib/config/env';

export function isCreationWalletAllowed(address?: string) {
  if (!address || env.tokenCreationAllowedWallets.length === 0) return false;
  return env.tokenCreationAllowedWallets.includes(address.toLowerCase());
}

export function assertCreationAccess(address: string | undefined, chainId: number | undefined) {
  if (!env.tokenCreationEnabled) throw new Error('Token creation is disabled');
  if (env.tokenCreationTestnetOnly && env.tokenCreationChainId !== 11155111) throw new Error('Unsafe creation configuration');
  if (chainId !== env.tokenCreationChainId) throw new Error('Switch to Sepolia before creating');
  if (!isCreationWalletAllowed(address)) throw new Error('Wallet is not approved for this controlled Preview test');
}
