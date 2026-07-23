import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import { cleanup, render, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

process.env.NEXT_PUBLIC_LIVE_DATA_ENABLED = 'true';
process.env.NEXT_PUBLIC_API_BASE = 'http://mock.local';
process.env.NEXT_PUBLIC_API_TIMEOUT_MS = '25';
process.env.NEXT_PUBLIC_SUMMARY_SNAPSHOT_URL = 'http://mock.local/snapshot';
process.env.NEXT_PUBLIC_TEST_MODE = 'true';
process.env.NEXT_PUBLIC_FEATURE_ENABLE_BUY = 'false';
process.env.NEXT_PUBLIC_FEATURE_ENABLE_SELL = 'false';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/discover'
});

global.window = dom.window as unknown as Window & typeof globalThis;
global.self = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', {
  value: dom.window.navigator,
  configurable: true
});
global.DOMException = dom.window.DOMException;

type Mode = 'live' | 'unavailable' | 'timeout' | 'malformed' | 'empty' | 'invalid-snapshot' | 'no-trades';

let mode: Mode = 'live';
const requestCounts = new Map<string, number>();
const hydrationErrors: string[] = [];
const originalConsoleError = console.error;

console.error = (...args: unknown[]) => {
  const message = args.map(String).join(' ');
  if (/hydration|maximum update|infinite/i.test(message)) hydrationErrors.push(message);
  originalConsoleError(...args);
};

const liveToken = {
  schema: 'TokenSummaryV1',
  token_id: '1',
  token_address: '0x1111111111111111111111111111111111111111',
  launchpad_market: '0x2222222222222222222222222222222222222222',
  symbol: 'LIVE',
  name: 'Live Meraki',
  status: 'curve_live',
  priceNative: '0.0042',
  volume24h: '12.4',
  trades24h: 2,
  last_trade_time: '2026-07-18T01:00:00.000Z',
  bonding_threshold: '25',
  bonding_progress: 0.42,
  migration_status: 'not_ready'
};

const noTradesToken = {
  ...liveToken,
  token_id: '2',
  token_address: '0x3333333333333333333333333333333333333333',
  launchpad_market: '0x4444444444444444444444444444444444444444',
  symbol: 'QUIET',
  name: 'Quiet Token',
  trades24h: 0,
  volume24h: '0',
  last_trade_time: null
};

const liveTrade = {
  schema: 'RecentTradeV1',
  trade_id: 'live:1',
  token_id: '1',
  token_address: liveToken.token_address,
  token_name: liveToken.name,
  direction: 'buy',
  stage: 'bonding_curve',
  quote_token_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  quote_symbol: 'ETH',
  quote_amount: '0.42',
  base_amount: '1000',
  execution_price_native: '0.0042',
  tx_hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  timestamp: '2026-07-18T01:00:00.000Z'
};

const liveTrade2 = {
  ...liveTrade,
  trade_id: 'live:2',
  quote_amount: '0.48',
  execution_price_native: '0.0048',
  tx_hash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  timestamp: '2026-07-18T01:01:00.000Z'
};

const snapshotToken = {
  ...liveToken,
  symbol: 'SNAP',
  name: 'Snapshot Meraki',
  priceNative: '0.0033'
};

function discovery(tokens = [liveToken], trades = [liveTrade, liveTrade2]) {
  return {
    schema: 'DiscoverySummaryV1',
    generatedAt: '2026-07-18T01:00:00.000Z',
    latestTokens: tokens,
    mostActiveTokens: tokens,
    recentTrades: trades,
    stats: {
      hotCount: tokens.length,
      movingCount: tokens.length,
      migrationReadyCount: 0
    }
  };
}

function response(status: number, body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' }
    })
  );
}

global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  requestCounts.set(url.pathname, (requestCounts.get(url.pathname) || 0) + 1);

  if (url.pathname === '/snapshot') {
    if (mode === 'invalid-snapshot') return response(200, { invalid: true });
    return response(200, discovery([snapshotToken], [{ ...liveTrade, token_name: 'Snapshot Meraki' }]));
  }

  if (url.pathname === '/discovery/summary') {
    if (mode === 'unavailable' || mode === 'invalid-snapshot') {
      return response(503, { schema: 'ApiErrorV1', error_code: 'unavailable', message: 'down', correlation_id: 'test' });
    }
    if (mode === 'timeout') {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
      });
    }
    if (mode === 'malformed') return response(200, { malformed: true });
    if (mode === 'empty') return response(200, discovery([], []));
    if (mode === 'no-trades') return response(200, discovery([noTradesToken], []));
    return response(200, discovery());
  }

  const tokenMatch = url.pathname.match(/^\/tokens\/([^/]+)$/);
  if (tokenMatch) {
    if (tokenMatch[1] === '2') return response(200, noTradesToken);
    if (tokenMatch[1] === '1') return response(200, liveToken);
    return response(404, { schema: 'ApiErrorV1', error_code: 'token_not_found', message: 'not found', correlation_id: 'test' });
  }

  const tradesMatch = url.pathname.match(/^\/tokens\/([^/]+)\/trades$/);
  if (tradesMatch) {
    if (tradesMatch[1] === '2') return response(200, { token_id: '2', trades: [] });
    if (tradesMatch[1] === '1') return response(200, { token_id: '1', trades: [liveTrade, liveTrade2] });
    return response(404, { schema: 'ApiErrorV1', error_code: 'token_not_found', message: 'not found', correlation_id: 'test' });
  }

  return response(404, { schema: 'ApiErrorV1', error_code: 'not_found', message: 'not found', correlation_id: 'test' });
}) as typeof fetch;

let DiscoverPage: React.ComponentType;
let LaunchDetail: React.ComponentType<{ tokenId: string }>;
let clearSnapshotCacheForTests: () => void;
let runtimeEnv: { snapshotFallbackEnabled: boolean; mockDataEnabled: boolean };

test.before(async () => {
  const modules = await Promise.all([
    import('../../app/discover/page'),
    import('../../app/launch/[id]/page'),
    import('../../lib/api/snapshot'),
    import('../../lib/config/env')
  ]);
  DiscoverPage = modules[0].default;
  LaunchDetail = modules[1].LaunchDetail;
  clearSnapshotCacheForTests = modules[2].clearSnapshotCacheForTests;
  runtimeEnv = modules[3].env;
});

function renderWithQuery(element: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
  });
  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
}

test.afterEach(() => {
  cleanup();
  clearSnapshotCacheForTests();
  requestCounts.clear();
  hydrationErrors.length = 0;
  mode = 'live';
  runtimeEnv.snapshotFallbackEnabled = true;
  runtimeEnv.mockDataEnabled = true;
});

test('live API renders discover and token detail with live provenance', async () => {
  const { container } = renderWithQuery(<DiscoverPage />);
  assert.ok(await within(container).findByText('Data source: Live API'));
  assert.ok((await within(container).findAllByText('Live Meraki')).length >= 1);
  assert.equal(container.querySelector('a[href="/launch/1"]')?.getAttribute('href'), '/launch/1');
  assert.equal(requestCounts.get('/discovery/summary'), 1);

  cleanup();
  const detail = renderWithQuery(<LaunchDetail tokenId="1" />);
  assert.ok(await detail.findByText('Data source: Live API'));
  assert.ok(await detail.findByText('Live Meraki'));
  assert.ok(await detail.findByText('0.42 ETH'));
  assert.ok(detail.container.querySelector('polyline'));
  assert.equal(detail.queryByText('Insufficient trade data'), null);
  assert.deepEqual(hydrationErrors, []);
});

test('API unavailable, timeout, and malformed live data fall back to snapshot', async () => {
  for (const scenario of ['unavailable', 'timeout', 'malformed'] as const) {
    cleanup();
    clearSnapshotCacheForTests();
    mode = scenario;
    const view = renderWithQuery(<DiscoverPage />);
    assert.ok(await view.findByText('Data source: Snapshot'));
    assert.ok((await view.findAllByText('Snapshot Meraki')).length >= 1);
  }
});

test('production-style live failure is explicit and never substituted with snapshot or mock data', async () => {
  mode = 'unavailable';
  runtimeEnv.snapshotFallbackEnabled = false;
  runtimeEnv.mockDataEnabled = false;
  const view = renderWithQuery(<DiscoverPage />);
  assert.ok(await view.findByText('Live discovery unavailable'));
  assert.ok(await view.findByText('Meraki could not verify current token data. No snapshot or mock markets are being shown.'));
  assert.equal(view.queryByText('Snapshot Meraki'), null);
  assert.equal(requestCounts.get('/snapshot'), undefined);
});

test('valid empty live response renders empty live state without fallback', async () => {
  mode = 'empty';
  const view = renderWithQuery(<DiscoverPage />);
  assert.ok(await view.findByText('Data source: Live API'));
  assert.ok(await view.findByText('Live API connected. No Sepolia tokens have been indexed yet; trading remains unavailable.'));
  assert.ok(await view.findByText('No trades yet.'));
  assert.equal(view.queryByText('Snapshot Meraki'), null);
});

test('invalid snapshot falls back to approved mock data', async () => {
  mode = 'invalid-snapshot';
  const view = renderWithQuery(<DiscoverPage />);
  assert.ok(await view.findByText('Data source: Mock'));
  assert.ok((await view.findAllByText('Pump Live 1777687392334')).length >= 1);
});

test('unknown token and no-trades states are deterministic', async () => {
  const missing = renderWithQuery(<LaunchDetail tokenId="999" />);
  assert.ok(await missing.findByText('Token 999 not found'));
  assert.ok(await missing.findByRole('heading', { name: 'Token not found' }));

  cleanup();
  clearSnapshotCacheForTests();
  mode = 'no-trades';
  const quiet = renderWithQuery(<LaunchDetail tokenId="2" />);
  assert.ok(await quiet.findByText('Data source: Live API'));
  assert.ok(await quiet.findByText('Quiet Token'));
  assert.ok(await quiet.findByText('Insufficient trade data'));
  assert.ok(await quiet.findByText('No trades yet.'));
});
