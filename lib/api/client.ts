import type { z } from 'zod';
import type { LeaderboardResponse, UserRewardsResponse, ActivityResponse, ClaimableResponse, DiscoverySummaryResponse, TokenSummaryResponse, RecentTradesResponse, ApiErrorResponse, DataErrorCategory } from '@/lib/api/types';
import { apiErrorSchema, discoverySummarySchema, tokenSummarySchema, tokenTradesResponseSchema, buyQuoteSchema, type BuyQuoteV1 } from '@/lib/api/generated/contracts';
import { env } from '@/lib/config/env';

export const apiAvailable = env.liveDataEnabled && env.apiBaseValid;

export class ApiClientError extends Error {
  category: DataErrorCategory;
  status?: number;
  apiError?: ApiErrorResponse;

  constructor(category: DataErrorCategory, message: string, options: { status?: number; apiError?: ApiErrorResponse } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.category = category;
    this.status = options.status;
    this.apiError = options.apiError;
  }
}

export function isApiClientError(value: unknown): value is ApiClientError {
  return value instanceof ApiClientError;
}

function buildUrl(path: string) {
  if (!env.liveDataEnabled) throw new ApiClientError('disabled', 'Live data is disabled');
  if (!env.apiBaseValid || !env.apiBase) throw new ApiClientError('misconfigured', 'Live API base URL is missing or invalid');
  if (!path.startsWith('/')) throw new ApiClientError('misconfigured', 'API path must be absolute');
  return new URL(path, `${env.apiBase}/`).toString();
}

function mergeAbortSignals(local: AbortSignal, external?: AbortSignal) {
  if (!external) return local;
  const controller = new AbortController();
  const abort = () => controller.abort();
  local.addEventListener('abort', abort, { once: true });
  external.addEventListener('abort', abort, { once: true });
  return controller.signal;
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.apiTimeoutMs);
  try {
    const res = await fetch(buildUrl(path), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {})
      },
      signal: mergeAbortSignals(controller.signal, init?.signal ?? undefined),
      cache: 'no-store'
    });

    const rawText = await res.text();
    const json = rawText ? JSON.parse(rawText) : null;

    if (!res.ok) {
      const apiError = apiErrorSchema.safeParse(json);
      const parsedError = apiError.success ? apiError.data : undefined;
      if (res.status === 404) {
        throw new ApiClientError('not_found', parsedError?.message ?? 'Resource not found', { status: res.status, apiError: parsedError });
      }
      if (res.status >= 500) {
        throw new ApiClientError('server_error', parsedError?.message ?? 'Live API server error', { status: res.status, apiError: parsedError });
      }
      throw new ApiClientError('unavailable', parsedError?.message ?? `Live API request failed (${res.status})`, { status: res.status, apiError: parsedError });
    }

    return json;
  } catch (error) {
    if (isApiClientError(error)) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError(init?.signal?.aborted ? 'aborted' : 'timeout', init?.signal?.aborted ? 'Request aborted' : 'Live API request timed out');
    }
    if (error instanceof SyntaxError) {
      throw new ApiClientError('invalid_response', 'Live API returned invalid JSON');
    }
    throw new ApiClientError('unavailable', 'Live API is unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

async function requestValidated<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const json = await requestJson(path, init);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiClientError('invalid_response', 'Live API response failed V1 validation');
  }
  return parsed.data;
}

async function requestLegacy<T>(path: string, init?: RequestInit): Promise<T> {
  const json = await requestJson(path, init);
  return json as T;
}

export const api = {
  getLeaderboard: (windowKey: 'all' | '7d' | '24h') => requestLegacy<LeaderboardResponse>(`/leaderboard?window=${encodeURIComponent(windowKey)}`),
  getUserRewards: (address: string) => requestLegacy<UserRewardsResponse>(`/user/${encodeURIComponent(address)}`),
  getActivity: (address: string) => requestLegacy<ActivityResponse>(`/user/${encodeURIComponent(address)}/activity`),
  getClaimable: (address: string) => requestLegacy<ClaimableResponse>(`/claim/${encodeURIComponent(address)}`),
  getDiscoverySummary: () => requestValidated<DiscoverySummaryResponse>('/discovery/summary', discoverySummarySchema),
  getTokenSummary: (tokenId: string) => requestValidated<TokenSummaryResponse>(`/tokens/${encodeURIComponent(tokenId)}`, tokenSummarySchema),
  getRecentTrades: async (tokenId: string): Promise<RecentTradesResponse> => {
    const response = await requestValidated(`/tokens/${encodeURIComponent(tokenId)}/trades`, tokenTradesResponseSchema);
    return response.trades;
  },
  getQuoteBuy: (tokenId: string, amount: string, slippageBps = 100) => requestValidated<BuyQuoteV1>(`/tokens/${encodeURIComponent(tokenId)}/quote?side=buy&amount=${encodeURIComponent(amount)}&slippageBps=${slippageBps}`, buyQuoteSchema),
  getQuoteSell: (tokenId: string, amountInToken: string) => requestLegacy<{ amountOut: string }>(`/tokens/${encodeURIComponent(tokenId)}/quote/sell?amount=${encodeURIComponent(amountInToken)}`)
};
