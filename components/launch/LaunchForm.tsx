'use client';

import { useRef, useState } from 'react';
import { decodeEventLog, getAddress, type Hex } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useRouter } from 'next/navigation';
import NextActionHint from '@/components/common/NextActionHint';
import { env } from '@/lib/config/env';
import { sepoliaDeployment } from '@/lib/api/generated/sepolia-deployment';
import { assertCreationAccess, isCreationWalletAllowed } from '@/lib/creation/access';
import { waitForCreationVisibility } from '@/lib/creation/api';
import { assertPinnedCode, decodeLaunchCreated, factoryAbi, registryAbi } from '@/lib/creation/contracts';
import { assertCreationTransition, type CreationState } from '@/lib/creation/state';
import { validateCreationInput } from '@/lib/creation/validation';

const MAX_SUPPLY = BigInt('1000000000000000000000000');
const BASE_PRICE = BigInt('1000000000000');
const PRICE_SLOPE = BigInt('1000');

export default function LaunchForm() {
  const router = useRouter();
  const { address, isConnected, chainId } = useAccount();
  const { data: wallet } = useWalletClient();
  const client = usePublicClient();
  const [form, setForm] = useState({ name: '', symbol: '', metadataURI: '' });
  const [state, setState] = useState<CreationState>('idle');
  const stateRef = useRef<CreationState>('idle');
  const [message, setMessage] = useState('Token creation is disabled pending the S4 audit.');
  const [transactions, setTransactions] = useState<{ registry?: Hex; factory?: Hex }>({});
  const busy = !['idle', 'complete', 'failed', 'rejected'].includes(state);
  const allowed = isCreationWalletAllowed(address);
  const registry = sepoliaDeployment.contracts.launchRegistry.address;
  const factory = sepoliaDeployment.contracts.launchFactory.address;

  function move(next: CreationState, text: string) {
    assertCreationTransition(stateRef.current, next);
    stateRef.current = next;
    setState(next);
    setMessage(text);
  }

  async function verifyDeployment() {
    if (!client) throw new Error('Sepolia client unavailable');
    const [registryCode, factoryCode, registryFactory, factoryRegistry] = await Promise.all([
      client.getCode({ address: registry }), client.getCode({ address: factory }),
      client.readContract({ address: registry, abi: registryAbi, functionName: 'factory' }),
      client.readContract({ address: factory, abi: factoryAbi, functionName: 'registry' })
    ]);
    assertPinnedCode(registry, registryCode || '0x');
    assertPinnedCode(factory, factoryCode || '0x');
    if (getAddress(registryFactory) !== getAddress(factory) || getAddress(factoryRegistry) !== getAddress(registry)) {
      throw new Error('Registry/factory relationship does not match the verified deployment');
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !wallet || !client) return;
    stateRef.current = 'idle'; setState('idle');
    try {
      move('validating', 'Validating controlled Sepolia creation');
      assertCreationAccess(address, chainId);
      const input = validateCreationInput(form);
      await verifyDeployment();

      move('simulating_registry', 'Simulating Registry metadata transaction');
      const registryArgs = [input.name, input.symbol, MAX_SUPPLY, BASE_PRICE, PRICE_SLOPE, input.metadataURI] as const;
      const registrySimulation = await client.simulateContract({ account: address!, address: registry, abi: registryAbi, functionName: 'registerLaunchMetadata', args: registryArgs });
      move('registry_wallet', 'Confirm metadata registration in the wallet (transaction 1 of 2)');
      const registryHash = await wallet.writeContract(registrySimulation.request);
      setTransactions({ registry: registryHash });
      move('registry_confirming', `Waiting for Registry receipt: ${registryHash}`);
      const registryReceipt = await client.waitForTransactionReceipt({ hash: registryHash });
      if (registryReceipt.status !== 'success') throw new Error('Registry transaction reverted');
      const registered = registryReceipt.logs.flatMap((log) => {
        if (getAddress(log.address) !== getAddress(registry)) return [];
        try { const decoded = decodeEventLog({ abi: registryAbi, data: log.data, topics: log.topics }); return decoded.eventName === 'LaunchMetadataRegistered' ? [decoded.args] : []; } catch { return []; }
      })[0];
      if (!registered || getAddress(registered.creator) !== getAddress(address!)) throw new Error('Verified Registry event missing');
      const configId = registered.configId;
      const config = await client.readContract({ address: registry, abi: registryAbi, functionName: 'getConfig', args: [configId] });
      if (getAddress(config.creator) !== getAddress(address!) || config.name !== input.name || config.symbol !== input.symbol || config.metadataURI !== input.metadataURI || config.finalized) {
        throw new Error('Registry config verification failed');
      }
      move('registry_verified', `Registry config ${configId} verified`);

      await verifyDeployment();
      const launchFee = await client.readContract({ address: factory, abi: factoryAbi, functionName: 'launchFee' });
      move('simulating_factory', `Simulating Factory transaction with exact fee ${launchFee} wei`);
      const factorySimulation = await client.simulateContract({ account: address!, address: factory, abi: factoryAbi, functionName: 'createLaunch', args: [configId], value: launchFee });
      move('factory_wallet', 'Confirm launch creation in the wallet (transaction 2 of 2)');
      const factoryHash = await wallet.writeContract(factorySimulation.request);
      setTransactions({ registry: registryHash, factory: factoryHash });
      move('factory_confirming', `Waiting for Factory receipt: ${factoryHash}`);
      const factoryReceipt = await client.waitForTransactionReceipt({ hash: factoryHash });
      if (factoryReceipt.status !== 'success') throw new Error('Factory transaction reverted');
      const created = decodeLaunchCreated(factoryReceipt);
      if (created.configId !== configId || getAddress(created.creator) !== getAddress(address!)) throw new Error('LaunchCreated provenance mismatch');
      const [tokenCode, marketCode, finalized] = await Promise.all([
        client.getCode({ address: created.launchToken }), client.getCode({ address: created.market }),
        client.readContract({ address: registry, abi: registryAbi, functionName: 'getConfig', args: [configId] })
      ]);
      if (!tokenCode || tokenCode === '0x' || !marketCode || marketCode === '0x' || !finalized.finalized || getAddress(finalized.launchToken) !== getAddress(created.launchToken) || getAddress(finalized.market) !== getAddress(created.market)) {
        throw new Error('On-chain launch verification failed');
      }
      move('onchain_verified', `LaunchCreated verified for ${created.launchToken}`);
      move('indexer_pending', 'On-chain creation confirmed; waiting for canonical indexing');
      const visible = await waitForCreationVisibility(factoryHash);
      move('api_visible', `Token ${visible.canonical_token_id} is visible through the live API`);
      move('complete', 'Creation complete; opening the canonical token page');
      router.push(`/launch/${visible.canonical_token_id}`);
      router.refresh();
    } catch (error) {
      const rejected = error instanceof Error && /rejected|denied|cancelled/i.test(error.message);
      stateRef.current = rejected ? 'rejected' : 'failed';
      setState(stateRef.current);
      setMessage(error instanceof Error ? error.message : 'Creation failed safely');
    }
  }

  return <form onSubmit={submit} className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6">
    <div><label htmlFor="creation-name" className="text-sm text-white/70">Token name</label><input id="creation-name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} maxLength={64} required className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-white" /></div>
    <div><label htmlFor="creation-symbol" className="text-sm text-white/70">Symbol</label><input id="creation-symbol" value={form.symbol} onChange={(e)=>setForm({...form,symbol:e.target.value.toUpperCase()})} maxLength={8} required className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-white" /></div>
    <div><label htmlFor="creation-metadata" className="text-sm text-white/70">Metadata URI</label><input id="creation-metadata" value={form.metadataURI} onChange={(e)=>setForm({...form,metadataURI:e.target.value})} maxLength={512} required placeholder="ipfs://… or https://…" className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-white" /></div>
    <div className="rounded-xl border border-amber-400/30 bg-amber-950/60 p-3 text-sm text-amber-100">Controlled Sepolia Preview only. The client allowlist is not a production security boundary. Production requires stronger authorization and governance controls.</div>
    <p className="break-all text-xs text-white/70">Registry: {registry}<br/>Factory: {factory}<br/>Wallet: {address || 'not connected'}</p>
    {transactions.registry && <p className="break-all text-xs">Registry tx: {transactions.registry}</p>}
    {transactions.factory && <p className="break-all text-xs">Factory tx: {transactions.factory}</p>}
    {isConnected && !allowed && <p role="alert" className="text-sm text-red-300">This wallet is not approved for the controlled S4 test.</p>}
    <button type="submit" disabled={busy || !env.tokenCreationEnabled || !isConnected || !allowed || chainId !== env.tokenCreationChainId} className="rounded bg-indigo-500 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40">{busy ? state.replaceAll('_',' ') : 'Simulate and create'}</button>
    <NextActionHint message={message} tone={state === 'failed' || state === 'rejected' ? 'error' : state === 'complete' ? 'success' : 'info'} />
  </form>;
}
