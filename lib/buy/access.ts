import { env } from '@/lib/config/env';

export function isBuyWalletAllowed(address?: string | null) {
  if (!address || env.buyAllowedWallets.length === 0) return false;
  return env.buyAllowedWallets.includes(address.toLowerCase());
}

export function assertBuyWalletAllowed(address?: string | null) {
  if (!isBuyWalletAllowed(address)) {
    throw new Error('This wallet is not approved for the controlled Slice 3 test');
  }
}
