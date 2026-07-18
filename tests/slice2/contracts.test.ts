import test from 'node:test';
import assert from 'node:assert/strict';
import discoveryFixture from '../../docs/fixtures/discovery-summary.v1.json' with { type: 'json' };
import { apiErrorSchema, discoverySummarySchema, tokenSummarySchema, tokenTradesResponseSchema, backendContractLock } from '../../lib/api/generated/contracts';
import { summaryMock, getMockTokenSummary, getMockRecentTrades } from '../../lib/mockData';

test('generated contracts are pinned to the canonical backend commit', () => {
  assert.equal(backendContractLock.repository, 'boredlabsio/meraki-protocol');
  assert.equal(backendContractLock.commit, 'eda91a012f87480f7246766534f56035af65104f');
});

test('approved snapshot and mock payloads validate against V1 schemas', () => {
  assert.equal(discoverySummarySchema.safeParse(discoveryFixture).success, true);
  assert.equal(discoverySummarySchema.safeParse(summaryMock).success, true);
  assert.equal(tokenSummarySchema.safeParse(getMockTokenSummary('1')).success, true);
  assert.equal(tokenTradesResponseSchema.safeParse({ token_id: '1', trades: getMockRecentTrades('1') }).success, true);
});

test('ApiErrorV1 and unknown mock tokens are deterministic', () => {
  assert.equal(apiErrorSchema.safeParse({ schema: 'ApiErrorV1', error_code: 'token_not_found', message: 'not found', correlation_id: 'test' }).success, true);
  assert.equal(getMockTokenSummary('missing'), null);
});
