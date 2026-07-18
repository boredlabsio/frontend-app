import { api, apiAvailable } from './client';
import type { BuyQuoteV1 } from './generated/contracts';
export async function getBuyQuote(tokenId: string, amountBaseUnits: string, slippageBps = 100): Promise<BuyQuoteV1> {
  if (!apiAvailable) throw new Error('Authoritative live API is required for financial quotes');
  return api.getQuoteBuy(tokenId, amountBaseUnits, slippageBps);
}
export async function getSellQuote(): Promise<never> { throw new Error('Sell is disabled'); }
