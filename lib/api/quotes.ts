import { api, apiAvailable } from './client';

export type QuoteSource = 'live' | 'mock' | 'unavailable';

export type QuoteResult = {
  amount: string;
  source: QuoteSource;
};

export async function getBuyQuote(tokenId: string, ethAmount: string): Promise<QuoteResult> {
  if (!ethAmount) return { amount: '0', source: 'unavailable' };
  if (!apiAvailable) {
    return { amount: ethAmount, source: 'mock' };
  }
  try {
    const res = await api.getQuoteBuy(tokenId, ethAmount);
    return { amount: res.amountOut, source: 'live' };
  } catch (err) {
    console.warn('[quotes] buy quote failed, falling back to mock', err);
    return { amount: ethAmount, source: 'mock' };
  }
}

export async function getSellQuote(tokenId: string, tokenAmount: string): Promise<QuoteResult> {
  if (!tokenAmount) return { amount: '0', source: 'unavailable' };
  if (!apiAvailable) {
    return { amount: tokenAmount, source: 'mock' };
  }
  try {
    const res = await api.getQuoteSell(tokenId, tokenAmount);
    return { amount: res.amountOut, source: 'live' };
  } catch (err) {
    console.warn('[quotes] sell quote failed, falling back to mock', err);
    return { amount: tokenAmount, source: 'mock' };
  }
}
