import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeAbiParameters, encodeEventTopics, type TransactionReceipt } from 'viem';

process.env.NEXT_PUBLIC_TOKEN_CREATION_ENABLED = 'true';
process.env.NEXT_PUBLIC_TOKEN_CREATION_CHAIN_ID = '11155111';
process.env.NEXT_PUBLIC_TOKEN_CREATION_TESTNET_ONLY = 'true';
process.env.NEXT_PUBLIC_TOKEN_CREATION_ALLOWED_WALLETS = '0x1111111111111111111111111111111111111111';
process.env.NEXT_PUBLIC_BUY_ENABLED = 'false';

test('creation flags and allowlist are independent from buy', async () => {
  const { env } = await import('../../lib/config/env');
  const { assertCreationAccess } = await import('../../lib/creation/access');
  assert.equal(env.tokenCreationEnabled, true);
  assert.equal(env.buyEnabled, false);
  assert.doesNotThrow(() => assertCreationAccess('0x1111111111111111111111111111111111111111', 11155111));
  assert.throws(() => assertCreationAccess('0x2222222222222222222222222222222222222222', 11155111));
  assert.throws(() => assertCreationAccess('0x1111111111111111111111111111111111111111', 1));
});

test('creation input validation is bounded and normalizes symbols', async () => {
  const { validateCreationInput } = await import('../../lib/creation/validation');
  assert.deepEqual(validateCreationInput({ name: ' Meraki ', symbol: 'mrk', metadataURI: 'ipfs://cid' }), { name: 'Meraki', symbol: 'MRK', metadataURI: 'ipfs://cid' });
  assert.throws(() => validateCreationInput({ name: '', symbol: 'M', metadataURI: 'javascript:alert(1)' }));
  assert.throws(() => validateCreationInput({ name: 'M', symbol: 'M$', metadataURI: 'https://example.com' }));
});

test('lifecycle rejects skips and models rejected wallet transactions', async () => {
  const { assertCreationTransition } = await import('../../lib/creation/state');
  assert.doesNotThrow(() => assertCreationTransition('registry_wallet', 'rejected'));
  assert.doesNotThrow(() => assertCreationTransition('indexer_pending', 'api_visible'));
  assert.throws(() => assertCreationTransition('idle', 'factory_wallet'));
});

test('LaunchCreated decoding requires the pinned factory emitter', async () => {
  const { decodeLaunchCreated, factoryAbi } = await import('../../lib/creation/contracts');
  const { sepoliaDeployment } = await import('../../lib/api/generated/sepolia-deployment');
  const topics = encodeEventTopics({ abi: factoryAbi, eventName: 'LaunchCreated', args: { configId: 3n, creator: '0x1111111111111111111111111111111111111111', market: '0x2222222222222222222222222222222222222222' } });
  const data = encodeAbiParameters([{type:'address'},{type:'address'},{type:'uint16'},{type:'uint256'},{type:'address'}], ['0x3333333333333333333333333333333333333333','0x4444444444444444444444444444444444444444',100,70000n,'0x5555555555555555555555555555555555555555']);
  const receipt = { logs: [{ address: sepoliaDeployment.contracts.launchFactory.address, topics, data }] } as unknown as TransactionReceipt;
  assert.equal(decodeLaunchCreated(receipt).configId, 3n);
  assert.throws(() => decodeLaunchCreated({ logs: [{ address: '0x9999999999999999999999999999999999999999', topics, data }] } as unknown as TransactionReceipt));
});
