import test from 'node:test';
import assert from 'node:assert/strict';
import discoveryFixture from '../../docs/fixtures/discovery-summary.v1.json' with { type: 'json' };
import recentTradeFixture from '../../docs/fixtures/recent-trade.v1.json' with { type: 'json' };
import {
  apiErrorSchema,
  backendContractLock,
  buyQuoteSchema,
  discoverySummarySchema,
  recentTradeSchema,
  tokenSummarySchema,
  tokenTradesResponseSchema
} from '../../lib/api/generated/contracts';
import { sepoliaDeployment } from '../../lib/api/generated/sepolia-deployment';
import { summaryMock, getMockTokenSummary, getMockRecentTrades } from '../../lib/mockData';

test('generated contracts are pinned to the canonical backend commit', () => {
  assert.equal(backendContractLock.repository, 'boredlabsio/meraki-protocol');
  assert.equal(backendContractLock.commit, '4b3b3c479737c6a412fa0d7e8ea340312d0681cc');
});

test('approved snapshot and mock payloads validate against V1 schemas', () => {
  assert.equal(discoverySummarySchema.safeParse(discoveryFixture).success, true);
  assert.equal(discoverySummarySchema.safeParse(summaryMock).success, true);
  assert.equal(tokenSummarySchema.safeParse(getMockTokenSummary('1')).success, true);
  assert.equal(recentTradeSchema.safeParse(recentTradeFixture).success, true);
  assert.equal(tokenTradesResponseSchema.safeParse({ token_id: '1', trades: getMockRecentTrades('1') }).success, true);
});

test('authoritative buy quote contract validates against the canonical deployment', () => {
  const quote = {
    schema: 'BuyQuoteV1',
    token_id: '1',
    token_address: '0x1111111111111111111111111111111111111111',
    market_address: '0x2222222222222222222222222222222222222222',
    chain_id: 11155111,
    side: 'buy',
    native_input: '100',
    estimated_token_output: '200',
    fee_amount: '1',
    fee_bps: 100,
    slippage_bps: 100,
    minimum_tokens_out: '198',
    quote_block_number: '1',
    quote_timestamp: '2026-07-23T16:00:00.000Z',
    max_age_seconds: 60,
    expires_at: '2026-07-23T16:01:00.000Z',
    contract_function: 'buy(uint256,uint256)',
    destination: '0x2222222222222222222222222222222222222222',
    payable_value: '100',
    provenance: 'live_sepolia_contract',
    state: {
      sold: '0',
      reserve_native: '0',
      reserve_token: '1',
      migrated: false,
      registry: sepoliaDeployment.contracts.launchRegistry.address,
      factory: sepoliaDeployment.contracts.launchFactory.address
    }
  };

  assert.equal(buyQuoteSchema.safeParse(quote).success, true);
});

test('ApiErrorV1 and unknown mock tokens are deterministic', () => {
  assert.equal(apiErrorSchema.safeParse({ schema: 'ApiErrorV1', error_code: 'token_not_found', message: 'not found', correlation_id: 'test' }).success, true);
  assert.equal(getMockTokenSummary('missing'), null);
});
