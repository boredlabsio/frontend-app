import { decodeEventLog, getAddress, keccak256, type Hex, type TransactionReceipt } from 'viem';
import { sepoliaDeployment } from '@/lib/api/generated/sepolia-deployment';

export const registryAbi = [
  { type: 'function', name: 'factory', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'registerLaunchMetadata', stateMutability: 'nonpayable', inputs: [{type:'string'},{type:'string'},{type:'uint256'},{type:'uint256'},{type:'uint256'},{type:'string'}], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'getConfig', stateMutability: 'view', inputs: [{type:'uint256'}], outputs: [{type:'tuple',components:[{name:'creator',type:'address'},{name:'name',type:'string'},{name:'symbol',type:'string'},{name:'maxSupply',type:'uint256'},{name:'basePrice',type:'uint256'},{name:'priceSlope',type:'uint256'},{name:'metadataURI',type:'string'},{name:'launchToken',type:'address'},{name:'market',type:'address'},{name:'finalized',type:'bool'}]}] },
  { type: 'event', name: 'LaunchMetadataRegistered', inputs: [{name:'configId',type:'uint256',indexed:true},{name:'creator',type:'address',indexed:true}] }
] as const;

export const factoryAbi = [
  { type:'function', name:'registry', stateMutability:'view', inputs:[], outputs:[{type:'address'}] },
  { type:'function', name:'quoteToken', stateMutability:'view', inputs:[], outputs:[{type:'address'}] },
  { type:'function', name:'launchFee', stateMutability:'view', inputs:[], outputs:[{type:'uint256'}] },
  { type:'function', name:'createLaunch', stateMutability:'payable', inputs:[{type:'uint256'}], outputs:[{type:'address'}] },
  { type:'event', name:'LaunchCreated', inputs:[{name:'configId',type:'uint256',indexed:true},{name:'creator',type:'address',indexed:true},{name:'market',type:'address',indexed:true},{name:'launchToken',type:'address'},{name:'quoteToken',type:'address'},{name:'feeBps',type:'uint16'},{name:'graduationThresholdQuote',type:'uint256'},{name:'migrationAdapter',type:'address'}] }
] as const;

export function assertPinnedCode(address: string, code: Hex) {
  const registry = sepoliaDeployment.contracts.launchRegistry;
  const factory = sepoliaDeployment.contracts.launchFactory;
  const expected = getAddress(address) === getAddress(registry.address) ? registry.runtimeBytecodeHash
    : getAddress(address) === getAddress(factory.address) ? factory.runtimeBytecodeHash : null;
  if (!expected || code === '0x' || keccak256(code).toLowerCase() !== expected.toLowerCase()) throw new Error('Contract bytecode does not match the verified Sepolia deployment');
}

export function decodeLaunchCreated(receipt: TransactionReceipt) {
  const factory = getAddress(sepoliaDeployment.contracts.launchFactory.address);
  for (const log of receipt.logs) {
    if (getAddress(log.address) !== factory) continue;
    try {
      const event = decodeEventLog({ abi: factoryAbi, data: log.data, topics: log.topics });
      if (event.eventName === 'LaunchCreated') return event.args;
    } catch {}
  }
  throw new Error('Verified LaunchCreated event was not found');
}
