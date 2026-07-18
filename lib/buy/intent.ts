import { encodeFunctionData, getAddress, type Address, type Hex } from 'viem';
import { bondingCurveMarketAbi } from '@/lib/abi/bondingCurveMarket';
import { sepoliaDeployment } from '@/lib/api/generated/sepolia-deployment';
import type { BuyQuoteV1 } from '@/lib/api/generated/contracts';
import { env } from '@/lib/config/env';

export const BUY_SELECTOR = '0xd6febde8' as Hex;
export type BuyIntent = { chainId:11155111; to:Address; data:Hex; value:bigint; minTokensOut:bigint; deadline:bigint };
export function validateAmount(value: string) { if(!/^[1-9][0-9]*$/.test(value)) throw new Error('Enter a positive amount in base units'); const amount=BigInt(value); if(amount>BigInt(env.buyMaxNativeAmount)) throw new Error('Amount exceeds the configured testnet cap'); return amount; }
export function quoteIsFresh(q: BuyQuoteV1, nowMs=Date.now()) { return q.provenance==='live_sepolia_contract' && nowMs < Date.parse(q.expires_at) && nowMs-Date.parse(q.quote_timestamp) <= q.max_age_seconds*1000; }
export function buildBuyIntent(q: BuyQuoteV1, deadlineSeconds=300, nowSeconds=Math.floor(Date.now()/1000)): BuyIntent {
  if(!env.buyEnabled || !env.buyTestnetOnly || env.buyChainId!==11155111) throw new Error('Buy execution is disabled');
  if(q.chain_id!==11155111 || q.destination.toLowerCase()!==q.market_address.toLowerCase()) throw new Error('Quote destination or chain is invalid');
  if(q.state.registry.toLowerCase()!==sepoliaDeployment.contracts.launchRegistry.address.toLowerCase() || q.state.factory.toLowerCase()!==sepoliaDeployment.contracts.launchFactory.address.toLowerCase()) throw new Error('Quote does not belong to the verified deployment');
  if(q.contract_function!=='buy(uint256,uint256)' || !quoteIsFresh(q,nowSeconds*1000)) throw new Error('Quote is stale or has an invalid selector');
  const value=validateAmount(q.payable_value); if(value!==BigInt(q.native_input)) throw new Error('Quote value mismatch');
  if(deadlineSeconds<60 || deadlineSeconds>600) throw new Error('Deadline is outside allowed bounds');
  const deadline=BigInt(nowSeconds+deadlineSeconds); const minTokensOut=BigInt(q.minimum_tokens_out);
  const data=encodeFunctionData({abi:bondingCurveMarketAbi,functionName:'buy',args:[minTokensOut,deadline]});
  if(data.slice(0,10)!==BUY_SELECTOR) throw new Error('Canonical buy selector mismatch');
  return {chainId:11155111,to:getAddress(q.destination),data,value,minTokensOut,deadline};
}
export function assertIntent(q:BuyQuoteV1,intent:BuyIntent,currentChainId:number,code:Hex|undefined){ if(currentChainId!==11155111) throw new Error('Switch to Sepolia before buying'); if(!code||code==='0x') throw new Error('Destination has no contract code'); if(intent.to.toLowerCase()!==q.market_address.toLowerCase()||intent.value!==BigInt(q.native_input)||intent.data.slice(0,10)!==BUY_SELECTOR) throw new Error('Transaction intent validation failed'); }
